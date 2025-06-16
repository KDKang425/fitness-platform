import React, { useEffect, useState, useContext } from 'react'
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
import { AuthContext } from '../contexts/AuthContext'

type Props = NativeStackScreenProps<HomeStackParamList, 'ExerciseDetail'>

export default function ExerciseDetailScreen({ route }: Props) {
  const { exerciseId } = route.params
  const { user } = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [recentSets, setRecentSets] = useState<WorkoutSet[]>([])
  const [oneRM, setOneRM] = useState<number | null>(null)
  const [isProfile1RM, setIsProfile1RM] = useState(false)

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
      
      const exerciseData = exerciseRes.data.data || exerciseRes.data
      setExercise(exerciseData)
      setRecentSets(historyRes.data.data?.sets || historyRes.data.sets || [])
      
      // Check if this is a major lift and user has profile 1RM
      const exerciseName = exerciseData.name?.toLowerCase()
      let profile1RM = null
      
      if (user) {
        if (exerciseName?.includes('bench') || exerciseName?.includes('벤치')) {
          profile1RM = user.benchPress1RM
        } else if (exerciseName?.includes('squat') || exerciseName?.includes('스쿼트')) {
          profile1RM = user.squat1RM
        } else if (exerciseName?.includes('deadlift') || exerciseName?.includes('데드')) {
          profile1RM = user.deadlift1RM
        } else if (exerciseName?.includes('overhead') || exerciseName?.includes('오버헤드') || exerciseName?.includes('ohp')) {
          profile1RM = user.overheadPress1RM
        }
      }
      
      if (profile1RM) {
        setOneRM(profile1RM)
        setIsProfile1RM(true)
      } else {
        // Calculate 1RM from recent sets
        const sets = historyRes.data.data?.sets || historyRes.data.sets || []
        if (sets.length > 0) {
          const bestSet = sets.reduce((best: WorkoutSet, current: WorkoutSet) => {
            const currentRM = calculate1RM(current.weight, current.reps)
            const bestRM = calculate1RM(best.weight, best.reps)
            return currentRM > bestRM ? current : best
          })
          setOneRM(calculate1RM(bestSet.weight, bestSet.reps))
          setIsProfile1RM(false)
        }
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

      {/* 1RM 정보 (주요 운동) */}
      {oneRM && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isProfile1RM ? '프로필 1RM' : '추정 1RM'}
          </Text>
          <Text style={styles.oneRM}>{oneRM} kg</Text>
          {!isProfile1RM && (
            <Text style={styles.oneRMNote}>최근 기록을 기반으로 계산됨</Text>
          )}
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
  oneRMNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
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