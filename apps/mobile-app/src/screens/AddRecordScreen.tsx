import React, { useState } from 'react'
import {
  View,
  Button,
  Text,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native'
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import ExercisePickerModal from '../components/ExercisePickerModal'
import ExerciseSetInput from '../components/ExerciseSetInput'
import api from '../utils/api'

interface Exercise {
  id: number
  name: string
  category: string
}

interface SetPayload {
  exerciseId: number
  weight: number
  reps: number
}

interface Props {
  navigation: any
}

export default function AddRecordScreen({ navigation }: Props) {
  const [date, setDate] = useState(new Date())
  const [picker, setPicker] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [setsByEx, setSetsByEx] = useState<Record<number, SetPayload[]>>({})

  const addSet = (p: SetPayload) => {
    setSetsByEx((prev) => ({
      ...prev,
      [p.exerciseId]: [...(prev[p.exerciseId] ?? []), p],
    }))
  }

  const save = async () => {
    const sets = Object.values(setsByEx).flat()
    if (!sets.length) return
    await api.post('/workouts/manual', {
      performedAt: date.toISOString().slice(0, 10),
      sets,
    })
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <Button title={date.toISOString().slice(0, 10)} onPress={() => setPicker(true)} />
      {picker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.select({ ios: 'spinner', android: 'default' })}
          onChange={(_: DateTimePickerEvent, d?: Date) => {
            if (d) setDate(d)
            setPicker(false)
          }}
        />
      )}
      <Button title="운동 추가" onPress={() => setExercises([])} />
      <ExercisePickerModal
        visible={!exercises.length}
        onClose={() => {}}
        onConfirm={(sel) => setExercises(sel as Exercise[])}
      />
      <FlatList
        data={exercises}
        keyExtractor={(e) => String(e.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.exercise}>{item.name}</Text>
            <ExerciseSetInput exerciseId={item.id} onAdd={addSet} />
            {(setsByEx[item.id] ?? []).map((s, i) => (
              <Text key={i} style={styles.set}>
                {s.weight} kg × {s.reps} 회
              </Text>
            ))}
          </View>
        )}
      />
      <Button title="저장" onPress={save} disabled={!exercises.length} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  card: { backgroundColor: '#111', borderRadius: 8, padding: 12, marginVertical: 8 },
  exercise: { color: '#ff7f27', fontSize: 16, marginBottom: 4 },
  set: { color: '#ccc', fontSize: 14 },
})
