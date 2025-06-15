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
import { showToast } from '../utils/Toast'

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
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const addSet = (p: SetPayload) => {
    setSetsByEx((prev) => ({
      ...prev,
      [p.exerciseId]: [...(prev[p.exerciseId] ?? []), p],
    }))
  }

  const save = async () => {
    const allSets = Object.values(setsByEx).flat()
    if (!allSets.length) {
      showToast('운동 세트를 추가해주세요.')
      return
    }
    
    try {
      const exercises = Object.entries(setsByEx).map(([exerciseId, sets]) => ({
        exerciseId: Number(exerciseId),
        sets: sets.map((set, index) => ({
          setNumber: index + 1,
          reps: set.reps,
          weight: set.weight,
        })),
      }))
      
      await api.post('/workouts/manual', {
        date: date.toISOString().slice(0, 10),
        startTime: '09:00',  // Default times for manual entry
        endTime: '10:00',
        duration: 3600,
        exercises,
      })
      
      showToast('운동 기록이 저장되었습니다.')
      navigation.goBack()
    } catch (error) {
      showToast('저장에 실패했습니다.')
    }
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
      <Button title="운동 추가" onPress={() => setShowExercisePicker(true)} />
      <ExercisePickerModal
        visible={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onConfirm={(sel) => {
          setExercises(sel as Exercise[])
          setShowExercisePicker(false)
        }}
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
  exercise: { color: '#ff7f27', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  set: { color: '#ccc', fontSize: 14, marginVertical: 2 },
})
