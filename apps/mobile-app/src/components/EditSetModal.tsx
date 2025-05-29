import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native'

interface Props {
  visible: boolean
  weight0: number
  reps0: number
  onSave: (w: number, r: number) => void
  onCancel: () => void
}

export default function EditSetModal({
  visible,
  weight0,
  reps0,
  onSave,
  onCancel,
}: Props) {
  const [weight, setWeight] = useState(String(weight0))
  const [reps, setReps] = useState(String(reps0))

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.box}>
        <Text style={styles.title}>세트 수정</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="중량"
          value={weight}
          onChangeText={setWeight}
        />
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="횟수"
          value={reps}
          onChangeText={setReps}
        />

        <View style={styles.btnRow}>
          <Button title="취소" onPress={onCancel} />
          <Button
            title="저장"
            onPress={() => onSave(Number(weight), Number(reps))}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#0008' },
  box: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#222',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { color: '#fff', fontSize: 18, marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    paddingHorizontal: 10,
    color: '#fff',
    marginVertical: 6,
  },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
})
