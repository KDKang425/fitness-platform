import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RecordStackParamList } from '../navigation/RecordStack'  
import api from '../utils/api'
import { colors, spacing } from '../theme'                 

type Props = NativeStackScreenProps<RecordStackParamList, 'WorkoutDetail'>

interface WorkoutSet {
  id: number
  weight: number
  reps: number
  exercise: { name: string }
}

interface WorkoutDetail {
  id: number
  date: string
  startTime?: Date | null
  endTime?: Date | null
  totalTime?: number | null
  totalVolume: number
  workoutSets: WorkoutSet[]
}

export default function WorkoutDetailScreen({ route }: Props) {
  const { id } = route.params
  const [data, setData] = useState<WorkoutDetail | null>(null)

  useEffect(() => {
    ;(async () => {
      const response = await api.get(`/workouts/${id}`)
      // Backend wraps response in { success, data, ... } structure
      setData(response.data.data)
    })()
  }, [id])

  if (!data) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {new Date(data.date).toLocaleDateString()}
      </Text>
      <Text style={styles.sub}>
        {data.totalTime ? `${Math.floor(data.totalTime / 60)}분` : '시간 정보 없음'} / 세트 {data.workoutSets.length}
      </Text>
      <Text style={styles.volume}>총 볼륨: {data.totalVolume.toLocaleString()} kg</Text>

      <FlatList
        data={data.workoutSets}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.exerciseName}>{item.exercise.name}</Text>
            <Text style={styles.setInfo}>{item.weight} kg × {item.reps}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: '#aaa', marginBottom: spacing.sm },
  volume: { color: colors.primary, fontSize: 16, fontWeight: '600', marginBottom: spacing.md },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  exerciseName: { color: colors.text, fontSize: 16 },
  setInfo: { color: colors.primary, fontSize: 16, fontWeight: '600' },
})
