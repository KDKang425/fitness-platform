import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SwipeListView } from 'react-native-swipe-list-view'

import api from '../utils/api'
import WorkoutTimer from '../components/WorkoutTimer'
import ExerciseSetInput from '../components/ExerciseSetInput'
import SetRow, { SetRowProps } from '../components/SetRow'
import EditSetModal from '../components/EditSetModal'
import ExercisePickerModal from '../components/ExercisePickerModal'
import { useError } from '../utils/errorHandler'
import { showToast } from '../utils/Toast'
import { TouchableOpacity, Text, FlatList } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

interface SetType {
  id: number
  weight: number
  reps: number
  isCompleted?: boolean
  exercise: {
    id: number
    name: string
  }
}

interface Session {
  id: number
  startedAt: string
  endTime?: string | null
  paused?: boolean
  workoutSets: SetType[]
}

interface ExerciseGroup {
  exerciseId: number
  exerciseName: string
  sets: SetType[]
}

interface AddSetPayload {
  exerciseId: number
  weight: number
  reps: number
}

interface Props {
  route: { params: { sessionId: number; routineId?: number; fromRoutine?: boolean } }
  navigation: any 
}

export default function WorkoutSessionScreen({ route, navigation }: Props) {
  const { sessionId, routineId, fromRoutine } = route.params
  const [session, setSession]   = useState<Session | null>(null)
  const [sets, setSets]         = useState<SetType[]>([])
  const [plannedExercises, setPlannedExercises] = useState<any[]>([])
  const [editTarget, setEditTarget] = useState<SetType | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null)
  const { error, loading, execute } = useError()

  useEffect(() => {
    ;(async () => {
      const result = await execute(
        api.get(`/workouts/${sessionId}`),
        {
          onError: () => {
            Alert.alert('오류', '운동 세션을 불러올 수 없습니다.', [
              { text: '확인', onPress: () => navigation.goBack() }
            ])
          }
        }
      )
      
      if (result) {
        const sessionData = result.data.data || result.data
        setSession(sessionData)
        setSets(sessionData.workoutSets ?? [])
        
        // If this is from a routine, load the routine exercises
        if (fromRoutine && routineId) {
          loadRoutineExercises(routineId)
        }
      }
    })()
  }, [sessionId, navigation, execute, fromRoutine, routineId])
  
  const loadRoutineExercises = async (routineId: number) => {
    try {
      const response = await api.get(`/routines/${routineId}`)
      const routine = response.data.data || response.data
      if (routine.routineExercises) {
        setPlannedExercises(routine.routineExercises.map((re: any) => ({
          exerciseId: re.exercise.id,
          exerciseName: re.exercise.name,
          defaultSets: re.defaultSets || 3,
          defaultReps: re.defaultReps || 10,
          defaultWeight: re.defaultWeight || 0,
          order: re.exerciseOrder
        })))
      }
    } catch (error) {
      console.error('Failed to load routine exercises:', error)
    }
  }

  const addSet = useCallback(
    async (payload: AddSetPayload) => {
      const result = await execute(
        api.post(`/workouts/${sessionId}/sets`, payload)
      )
      
      if (result) {
        const newSet = result.data.data || result.data
        setSets(prev => [...prev, newSet])
        showToast('세트가 추가되었습니다.')
      }
    },
    [sessionId, execute],
  )

  const deleteSet = useCallback(
    async (setId: number) => {
      const result = await execute(
        api.delete(`/workouts/sets/${setId}`)
      )
      
      if (result) {
        setSets(prev => prev.filter(s => s.id !== setId))
        showToast('세트가 삭제되었습니다.')
      }
    },
    [execute],
  )

  const saveEdit = useCallback(
    async (weight: number, reps: number) => {
      if (!editTarget) return
      
      const result = await execute(
        api.patch(`/workouts/sets/${editTarget.id}`, { weight, reps })
      )
      
      if (result) {
        setSets(prev =>
          prev.map(s =>
            s.id === editTarget.id ? { ...s, weight, reps } : s,
          ),
        )
        showToast('세트가 수정되었습니다.')
      }
      
      setEditTarget(null)
    },
    [editTarget, execute],
  )
  
  const toggleSetCompletion = useCallback(
    async (setId: number) => {
      const targetSet = sets.find(s => s.id === setId)
      if (!targetSet) return
      
      const newCompletedState = !targetSet.isCompleted
      
      const result = await execute(
        api.patch(`/workouts/sets/${setId}`, { isCompleted: newCompletedState })
      )
      
      if (result) {
        setSets(prev => prev.map(set =>
          set.id === setId ? { ...set, isCompleted: newCompletedState } : set
        ))
      }
    },
    [sets, execute],
  )

  const finishSession = async () => {
    Alert.alert(
      '운동 종료',
      '운동을 종료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: async () => {
            const result = await execute(
              api.patch(`/workouts/${sessionId}/finish`),
              { showAlert: true }
            )
            
            if (result) {
              showToast('운동이 완료되었습니다!')
              navigation.popToTop()
            }
          }
        }
      ]
    )
  }

  if (!session || loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )

  // Group sets by exercise
  const exerciseGroups = React.useMemo(() => {
    const groups: { [key: number]: ExerciseGroup } = {}
    sets.forEach(set => {
      const exerciseId = set.exercise.id
      if (!groups[exerciseId]) {
        groups[exerciseId] = {
          exerciseId: exerciseId,
          exerciseName: set.exercise.name,
          sets: []
        }
      }
      groups[exerciseId].sets.push(set)
    })
    return Object.values(groups)
  }, [sets])

  const handleExerciseSelect = (exerciseId: number) => {
    setSelectedExerciseId(exerciseId)
    setShowExercisePicker(false)
  }

  return (
    <View style={styles.container}>
      <WorkoutTimer
        startedAt={Date.parse(session.startedAt)}
        paused={session.paused || false}
      />

      <TouchableOpacity
        style={styles.addExerciseButton}
        onPress={() => setShowExercisePicker(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#ff7f27" />
        <Text style={styles.addExerciseText}>운동 추가</Text>
      </TouchableOpacity>

      {selectedExerciseId && (
        <ExerciseSetInput 
          exerciseId={selectedExerciseId} 
          onAdd={addSet} 
        />
      )}

      <FlatList
        data={exerciseGroups.length > 0 ? exerciseGroups : plannedExercises}
        keyExtractor={item => String(item.exerciseId)}
        renderItem={({ item }) => {
          const isPlanned = !item.sets
          const group = isPlanned ? null : item
          const completedSets = group ? group.sets : sets.filter(s => s.exercise.id === item.exerciseId)
          
          return (
            <View style={styles.exerciseGroup}>
              <Text style={styles.exerciseName}>{isPlanned ? item.exerciseName : group.exerciseName}</Text>
              
              {/* Show planned info if this is from routine */}
              {isPlanned && (
                <Text style={styles.plannedInfo}>
                  계획: {item.defaultSets}세트 × {item.defaultReps}회 @ {item.defaultWeight}kg
                </Text>
              )}
              
              {/* Show completed sets */}
              {completedSets.map((set, index) => (
                <TouchableOpacity
                  key={set.id}
                  onLongPress={() => setEditTarget(set)}
                >
                  <SetRow
                    index={index + 1}
                    weight={set.weight}
                    reps={set.reps}
                    isCompleted={set.isCompleted}
                    onLongPress={() => setEditTarget(set)}
                    onToggleComplete={() => toggleSetCompletion(set.id)}
                  />
                </TouchableOpacity>
              ))}
              
              {/* Add set button */}
              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => {
                  setSelectedExerciseId(item.exerciseId)
                }}
              >
                <Text style={styles.addSetText}>+ 세트 추가</Text>
              </TouchableOpacity>
            </View>
          )
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>운동을 추가하여 시작하세요</Text>
        }
      />

      <TouchableOpacity style={styles.finishButton} onPress={finishSession}>
        <Text style={styles.finishButtonText}>세션 종료</Text>
      </TouchableOpacity>

      <EditSetModal
        visible={!!editTarget}
        weight0={editTarget?.weight ?? 0}
        reps0={editTarget?.reps ?? 0}
        onSave={saveEdit}
        onCancel={() => setEditTarget(null)}
      />

      <ExercisePickerModal
        visible={showExercisePicker}
        onConfirm={(exercises) => {
          if (exercises.length > 0) {
            handleExerciseSelect(exercises[0].id)
          }
        }}
        onClose={() => setShowExercisePicker(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hidden: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    backgroundColor: 'red',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 8,
  },
  addExerciseText: {
    color: '#ff7f27',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  exerciseGroup: {
    backgroundColor: '#111',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
  },
  exerciseName: {
    color: '#ff7f27',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  plannedInfo: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  addSetButton: {
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addSetText: {
    color: '#ff7f27',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  finishButton: {
    backgroundColor: '#ff7f27',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
