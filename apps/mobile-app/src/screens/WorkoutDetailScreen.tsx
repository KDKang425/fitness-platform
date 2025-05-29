import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RecordStackParamList } from '../navigation/types'  
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
  performedAt: string
  duration: number
  sets: WorkoutSet[]
}

export default function WorkoutDetailScreen({ route }: Props) {
  const { id } = route.params
  const [data, setData] = useState<WorkoutDetail | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get<WorkoutDetail>(`/workouts/${id}`)
      setData(data)
    })()
  }, [id])

  if (!data) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {new Date(data.performedAt).toLocaleDateString()}
      </Text>
      <Text style={styles.sub}>
        {(data.duration / 60).toFixed(1)} 분 / 세트 {data.sets.length}
      </Text>

      <FlatList
        data={data.sets}
        keyExtractor={(s) => String(s.id)}
        renderItem={({ item }) => (
          <Text style={styles.row}>
            {item.exercise.name}{'  '}
            {item.weight} kg × {item.reps}
          </Text>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  sub: { color: '#aaa', marginBottom: spacing.sm },
  row: { color: colors.text, paddingVertical: spacing.xs },
})
