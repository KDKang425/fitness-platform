import React, { useState } from 'react'
import { View, FlatList, Text, Button, StyleSheet, Alert } from 'react-native'
import api from '../utils/api'
import ExercisePickerModal from '../components/ExercisePickerModal'

export default function FreeWorkoutScreen({ navigation }: any) {
  const [selected, setSelected] = useState<any[]>([])
  const [modal,     setModal]   = useState(false)

  const start = async () => {
    try {
      const { data } = await api.post('/workouts', {
        type: 'free',
        exercises: selected.map((e) => e.id),
      })
      navigation.replace('WorkoutSession', { sessionId: data.id })
    } catch (e) {
      Alert.alert('오류', '세션 생성 실패')
    }
  }

  return (
    <View style={styles.container}>
      <Button title="운동 추가" onPress={() => setModal(true)} />
      <FlatList
        data={selected}
        keyExtractor={(e) => e.id.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
      />
      <Button title="세션 시작" disabled={!selected.length} onPress={start} />
      <ExercisePickerModal
        visible={modal}
        onClose={() => setModal(false)}
        onConfirm={(list) => setSelected(list)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 12 },
  item: { color: 'white', fontSize: 16, marginVertical: 2 },
})
