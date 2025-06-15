import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { HomeStackParamList } from '../types/navigation'
import { Exercise, MuscleGroup, ExerciseType } from '../types'
import api from '../utils/api'
import { showToast } from '../utils/Toast'

type Props = NativeStackScreenProps<HomeStackParamList, 'AllExercises'>

export default function AllExercisesScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'ALL'>('ALL')
  const [selectedType, setSelectedType] = useState<ExerciseType | 'ALL'>('ALL')

  const muscles: (MuscleGroup | 'ALL')[] = [
    'ALL', 'CHEST', 'BACK', 'SHOULDER', 'TRICEPS', 'BICEPS',
    'FOREARM', 'ABS', 'GLUTES', 'HAMSTRING', 'QUADRICEPS', 'TRAPS', 'CALVES'
  ]

  const exerciseTypes: (ExerciseType | 'ALL')[] = [
    'ALL', 'BARBELL', 'DUMBBELL', 'BODYWEIGHT', 'MACHINE', 'CABLE', 'SMITH_MACHINE', 'CARDIO'
  ]

  const typeLabels: { [key: string]: string } = {
    'ALL': '전체',
    'BARBELL': '바벨',
    'DUMBBELL': '덤벨',
    'BODYWEIGHT': '맨몸',
    'MACHINE': '머신',
    'CABLE': '케이블',
    'SMITH_MACHINE': '스미스머신',
    'CARDIO': '유산소'
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchQuery, selectedMuscle, selectedType])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const response = await api.get('/exercises')
      setExercises(response.data)
    } catch (error) {
      showToast('운동 목록을 불러오는데 실패했습니다.')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    // 근육군 필터
    if (selectedMuscle !== 'ALL') {
      filtered = filtered.filter(exercise => exercise.muscle === selectedMuscle)
    }

    // 운동 타입 필터
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(exercise => exercise.category === selectedType)
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        exercise.category.toLowerCase().includes(query)
      )
    }

    setFilteredExercises(filtered)
  }

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
    >
      <View style={styles.exerciseContent}>
        <View>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseInfo}>{item.muscle}</Text>
        </View>
        <View style={styles.exerciseTypeTag}>
          <Text style={styles.exerciseTypeText}>{typeLabels[item.category] || item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const renderMuscleFilter = ({ item }: { item: MuscleGroup | 'ALL' }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedMuscle === item && styles.filterChipActive
      ]}
      onPress={() => setSelectedMuscle(item)}
    >
      <Text style={[
        styles.filterChipText,
        selectedMuscle === item && styles.filterChipTextActive
      ]}>
        {item === 'ALL' ? '전체' : item}
      </Text>
    </TouchableOpacity>
  )

  const renderTypeFilter = ({ item }: { item: ExerciseType | 'ALL' }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedType === item && styles.filterChipActive
      ]}
      onPress={() => setSelectedType(item)}
    >
      <Text style={[
        styles.filterChipText,
        selectedType === item && styles.filterChipTextActive
      ]}>
        {typeLabels[item]}
      </Text>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* 검색 */}
      <TextInput
        style={styles.searchInput}
        placeholder="운동 검색..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* 운동 타입 필터 */}
      <Text style={styles.filterTitle}>운동 타입</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={exerciseTypes}
        keyExtractor={(item) => item}
        renderItem={renderTypeFilter}
        contentContainerStyle={styles.filterContainer}
      />

      {/* 근육군 필터 */}
      <Text style={styles.filterTitle}>근육군</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={muscles}
        keyExtractor={(item) => item}
        renderItem={renderMuscleFilter}
        contentContainerStyle={styles.filterContainer}
      />

      {/* 운동 목록 */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderExercise}
        contentContainerStyle={styles.exerciseList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  searchInput: {
    backgroundColor: '#111',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterChip: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#ff7f27',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  exerciseList: {
    paddingHorizontal: 16,
  },
  exerciseItem: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseInfo: {
    color: '#ccc',
    fontSize: 14,
  },
  exerciseTypeTag: {
    backgroundColor: '#ff7f27',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseTypeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterTitle: {
    color: '#ff7f27',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
})