import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { HomeStackParamList } from '../types/navigation'
import { Exercise, WorkoutSet } from '../types'
import api from '../utils/api'
import { showToast } from '../utils/Toast'

type Props = NativeStackScreenProps<HomeStackParamList, 'ExerciseDetail'>

export default function ExerciseDetailScreen({ route }: Props) {
  const { exerciseId } = route.params
  const [loading, setLoading] = useState(true)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [recentSets, setRecentSets] = useState<WorkoutSet[]>([])
  const [oneRM, setOneRM] = useState<number | null>(null)

  useEffect(() => {
    fetchExerciseDetail()
  }, [exerciseId])

  const fetchExerciseDetail = async () => {
    try {
      setLoading(true)
      const [exerciseRes, historyRes] = await Promise.all([
        api.get(`/exercises/${exerciseId}`),
        api.get(`/exercises/${exerciseId}/history?limit=5`)
      ])
      
      setExercise(exerciseRes.data)
      setRecentSets(historyRes.data.sets || [])
      
      // 1RM 계산 (간단한 공식 사용)
      if (historyRes.data.sets?.length > 0) {
        const bestSet = historyRes.data.sets.reduce((best: WorkoutSet, current: WorkoutSet) => {
          const currentRM = calculate1RM(current.weight, current.reps)
          const bestRM = calculate1RM(best.weight, best.reps)
          return currentRM > bestRM ? current : best
        })
        setOneRM(calculate1RM(bestSet.weight, bestSet.reps))
      }
    } catch (error) {
      showToast('운동 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const calculate1RM = (weight: number, reps: number): number => {
    // Brzycki 공식: 1RM = weight / (1.0278 - 0.0278 × reps)
    if (reps === 1) return weight
    return Math.round(weight / (1.0278 - 0.0278 * reps))
  }

  const openYouTube = () => {
    if (exercise?.youtubeUrl) {
      Linking.openURL(exercise.youtubeUrl)
    } else {
      // 기본 검색 URL
      const searchQuery = encodeURIComponent(`${exercise?.name} 운동 방법`)
      Linking.openURL(`https://www.youtube.com/results?search_query=${searchQuery}`)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  if (!exercise) return null

  return (
    <ScrollView style={styles.container}>
      {/* 운동 정보 */}
      <View style={styles.section}>
        <Text style={styles.title}>{exercise.name}</Text>
        <Text style={styles.category}>{exercise.category}</Text>
        <Text style={styles.muscle}>주요 근육: {exercise.muscle}</Text>
        <Text style={styles.type}>운동 유형: {exercise.type}</Text>
      </View>

      {/* YouTube 강의 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.youtubeButton} onPress={openYouTube}>
          <Text style={styles.youtubeText}>🎥 YouTube 강의 보기</Text>
        </TouchableOpacity>
      </View>

      {/* 1RM 정보 (주요 바벨 운동) */}
      {oneRM && ['벤치프레스', '스쿼트', '데드리프트', '오버헤드프레스'].some(name => 
        exercise.name.includes(name)
      ) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추정 1RM</Text>
          <Text style={styles.oneRM}>{oneRM} kg</Text>
        </View>
      )}

      {/* 최근 기록 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>최근 기록 (최대 5개)</Text>
        {recentSets.length > 0 ? (
          recentSets.map((set, index) => (
            <View key={set.id} style={styles.setRow}>
              <Text style={styles.setIndex}>{index + 1}</Text>
              <Text style={styles.setText}>{set.weight} kg × {set.reps} 회</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noData}>기록이 없습니다.</Text>
        )}
      </View>
    </ScrollView>
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#ff7f27',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  category: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  muscle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  type: {
    color: '#ccc',
    fontSize: 14,
  },
  youtubeButton: {
    backgroundColor: '#ff0000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  youtubeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#ff7f27',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  oneRM: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  setIndex: {
    color: '#ff7f27',
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  setText: {
    color: '#fff',
    fontSize: 16,
  },
  noData: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
})