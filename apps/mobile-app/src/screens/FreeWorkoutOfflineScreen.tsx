import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useOfflineWorkout, offlineStorage } from '../utils/offlineStorage'
import ExercisePickerModal from '../components/ExercisePickerModal'
import ExerciseSetInput from '../components/ExerciseSetInput'
import WorkoutTimer from '../components/WorkoutTimer'
import { showToast } from '../utils/Toast'
import api from '../utils/api'

interface Exercise {
  id: number
  name: string
  category: string
}

interface Props {
  navigation: any
}

export default function FreeWorkoutOfflineScreen({ navigation }: Props) {
  const { isOnline, currentSession, startWorkoutSession, addSet, finishWorkout } = useOfflineWorkout()
  const [showPicker, setShowPicker] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [cachedExercises, setCachedExercises] = useState<Exercise[]>([])
  const [sessionStarted, setSessionStarted] = useState(false)

  useEffect(() => {
    // Load cached exercises on mount
    loadCachedExercises()
  }, [])

  const loadCachedExercises = async () => {
    const cached = await offlineStorage.getCachedExercises()
    setCachedExercises(cached)
    
    // If online, update the cache
    if (isOnline) {
      try {
        const { data } = await api.get('/exercises')
        await offlineStorage.cacheExercises(data)
        setCachedExercises(data)
      } catch (error) {
        console.error('Failed to update exercise cache:', error)
      }
    }
  }

  const handleStartWorkout = async () => {
    const session = await startWorkoutSession()
    if (session) {
      setSessionStarted(true)
      showToast(isOnline ? '운동을 시작합니다!' : '오프라인 모드로 운동을 시작합니다!')
    }
  }

  const handleAddSet = async (payload: { exerciseId: number; weight: number; reps: number }) => {
    await addSet(payload.exerciseId, payload.weight, payload.reps)
    showToast('세트가 추가되었습니다')
  }

  const handleFinishWorkout = () => {
    Alert.alert(
      '운동 종료',
      '운동을 종료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: async () => {
            await finishWorkout()
            showToast(isOnline ? '운동이 저장되었습니다!' : '운동이 로컬에 저장되었습니다. 나중에 동기화됩니다.')
            navigation.goBack()
          }
        }
      ]
    )
  }

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={styles.exerciseCard}>
      <Text style={styles.exerciseName}>{item.name}</Text>
      <ExerciseSetInput
        exerciseId={item.id}
        onAdd={handleAddSet}
      />
      {currentSession?.sets
        .filter(set => set.exerciseId === item.id)
        .map((set, index) => (
          <Text key={set.tempId} style={styles.setInfo}>
            세트 {index + 1}: {set.weight}kg × {set.reps}회
          </Text>
        ))}
    </View>
  )

  if (!sessionStarted) {
    return (
      <View style={styles.container}>
        <View style={styles.statusBar}>
          <Text style={[styles.statusText, isOnline ? styles.online : styles.offline]}>
            {isOnline ? '온라인' : '오프라인 모드'}
          </Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.title}>자유 운동</Text>
          <Text style={styles.subtitle}>
            {isOnline 
              ? '운동을 시작하고 자유롭게 기록하세요' 
              : '인터넷 연결이 없어도 운동을 기록할 수 있습니다'}
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
            <Text style={styles.startButtonText}>운동 시작</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={[styles.statusText, isOnline ? styles.online : styles.offline]}>
          {isOnline ? '온라인' : '오프라인 모드'}
        </Text>
      </View>
      
      <WorkoutTimer
        startedAt={currentSession ? Date.parse(currentSession.startedAt) : Date.now()}
        paused={false}
      />

      <TouchableOpacity
        style={styles.addExerciseButton}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.addExerciseText}>+ 운동 추가</Text>
      </TouchableOpacity>

      <FlatList
        data={selectedExercises}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExercise}
        contentContainerStyle={styles.exerciseList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>운동을 추가해주세요</Text>
        }
      />

      <TouchableOpacity
        style={styles.finishButton}
        onPress={handleFinishWorkout}
      >
        <Text style={styles.finishButtonText}>운동 종료</Text>
      </TouchableOpacity>

      <ExercisePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={(exercises) => {
          setSelectedExercises(prev => [
            ...prev,
            ...exercises.filter(e => !prev.some(p => p.id === e.id))
          ])
          setShowPicker(false)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  online: {
    color: '#4CAF50',
  },
  offline: {
    color: '#FF9800',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    color: '#ff7f27',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
  },
  startButton: {
    backgroundColor: '#ff7f27',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addExerciseButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
  },
  addExerciseText: {
    color: '#ff7f27',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseList: {
    paddingHorizontal: 16,
  },
  exerciseCard: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  exerciseName: {
    color: '#ff7f27',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  setInfo: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  finishButton: {
    margin: 16,
    backgroundColor: '#ff7f27',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
})