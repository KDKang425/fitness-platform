// screens/RoutineCreateScreen.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
} from 'react-native'
import ExercisePickerModal from '../components/ExercisePickerModal'
import api from '../utils/api'


interface Exercise {
  id: number
  name: string
  category: string
}

interface Props {
  navigation: any 
}

export default function RoutineCreateScreen({ navigation }: Props) {

  const [step, setStep] = useState<1 | 2 | 3>(1)


  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')


  const [weeks, setWeeks] = useState('4')

 
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [modalVisible, setModalVisible] = useState(false)

  const save = async () => {
    try {
      await api.post('/routines', {
        title,
        description: desc,
        weeks: Number(weeks),
        exerciseIds: exercises.map((e) => e.id),
      })
      navigation.goBack()
    } catch {
     
    }
  }


  return (
    <View style={styles.container}>
      {step === 1 && (
        <>
          <TextInput
            placeholder="루틴 이름"
            placeholderTextColor="#666"
            style={styles.input}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            placeholder="설명"
            placeholderTextColor="#666"
            style={[styles.input, { height: 80 }]}
            value={desc}
            onChangeText={setDesc}
            multiline
          />
          <Button
            title="다음"
            onPress={() => setStep(2)}
            disabled={!title.trim()}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>몇 주 프로그램인가요?</Text>
          <TextInput
            keyboardType="numeric"
            style={styles.input}
            value={weeks}
            onChangeText={setWeeks}
          />
          <Button title="다음" onPress={() => setStep(3)} />
        </>
      )}

      {step === 3 && (
        <>
          <Button
            title="운동 추가"
            onPress={() => setModalVisible(true)}
          />
          <FlatList
            data={exercises}
            keyExtractor={(e) => String(e.id)}
            renderItem={({ item }) => (
              <Text style={styles.exercise}>{item.name}</Text>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>선택된 운동이 없습니다.</Text>
            }
          />
          <Button
            title="저장"
            onPress={save}
            disabled={exercises.length === 0}
          />

          {/* 운동 선택 모달 */}
          <ExercisePickerModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onConfirm={(sel) => {
              setExercises(sel)
              setModalVisible(false)
            }}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    marginVertical: 6,
  },
  label: { color: '#fff', fontSize: 16, marginVertical: 8 },
  exercise: { color: '#fff', fontSize: 16, paddingVertical: 4 },
  empty: { color: '#666', textAlign: 'center', marginVertical: 20 },
})
