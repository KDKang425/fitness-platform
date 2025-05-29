import React, { useState } from 'react'
import { View, TextInput, StyleSheet, Button } from 'react-native'

interface Props {
  exerciseId: number
  onAdd: (payload: { exerciseId: number; weight: number; reps: number }) => void
}

export default function ExerciseSetInput({ exerciseId, onAdd }: Props) {
  const [weight, setWeight] = useState('')
  const [reps, setReps]   = useState('')

  const handleAdd = () => {
    const w = Number(weight)
    const r = Number(reps)
    if (!w || !r) return
    onAdd({ exerciseId, weight: w, reps: r })
    setWeight('')
    setReps('')
  }

  return (
    <View style={styles.row}>
      <TextInput
        placeholder="중량"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="횟수"
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="추가" onPress={handleAdd} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    paddingHorizontal: 6,
    marginHorizontal: 4,
    color: 'white',
  },
})
