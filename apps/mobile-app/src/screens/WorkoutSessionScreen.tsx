import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Button,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SwipeListView } from 'react-native-swipe-list-view'
import api from '../utils/api'
import WorkoutTimer from '../components/WorkoutTimer'
import ExerciseSetInput from '../components/ExerciseSetInput'

interface Props {
  navigation: any
  route: { params: { sessionId: number } }
}

interface SetType {
  id: number
  exerciseId: number
  weight: number
  reps: number
}

export default function WorkoutSessionScreen({ navigation, route }: Props) {
  const { sessionId } = route.params
  const [session, setSession] = useState<any>(null)
  const [paused, setPaused] = useState(false)

  const [editVisible, setEditVisible] = useState(false)
  const [editSet, setEditSet] = useState<SetType | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  const refresh = async () => {
    const { data } = await api.get(`/workouts/${sessionId}`)
    setSession(data)
  }

  useEffect(() => {
    refresh()
  }, [])

  const addSet = async (payload: { exerciseId: number; weight: number; reps: number }) => {
    await api.post(`/workouts/${sessionId}/sets`, payload)
    await refresh()
  }

  const deleteSet = async (setId: number) => {
    try {
      await api.delete(`/workouts/sets/${setId}`)
      await refresh()
    } catch {
      Alert.alert('오류', '세트 삭제에 실패했습니다.')
    }
  }

  const openEdit = (set: SetType) => {
    setEditSet(set)
    setEditWeight(String(set.weight))
    setEditReps(String(set.reps))
    setEditVisible(true)
  }

  const saveEdit = async () => {
    if (!editSet) return
    const weight = Number(editWeight)
    const reps = Number(editReps)
    if (!weight || !reps) return
    try {
      await api.patch(`/workouts/sets/${editSet.id}`, { weight, reps })
      setEditVisible(false)
      await refresh()
    } catch {
      Alert.alert('오류', '세트 수정에 실패했습니다.')
    }
  }

  const togglePause = async () => {
    try {
      await api.patch(`/workouts/${sessionId}/${paused ? 'resume' : 'pause'}`)
      setPaused((p) => !p)
    } catch {
      Alert.alert('오류', '일시정지/재개에 실패했습니다.')
    }
  }

  const finish = async () => {
    try {
      await api.patch(`/workouts/${sessionId}/finish`, {
        duration: Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000),
      })
      Alert.alert('세션 종료', '운동 기록이 저장되었습니다.')
      navigation.popToTop()
    } catch {
      Alert.alert('오류', '세션 종료에 실패했습니다.')
    }
  }

  if (!session)
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )

  return (
    <View style={styles.container}>
      {/* 타이머 & 일시정지 */}
      <WorkoutTimer startedAt={new Date(session.startedAt).getTime()} paused={paused} />
      <TouchableOpacity onPress={togglePause} style={styles.pauseBtn}>
        <Text style={styles.pauseTxt}>{paused ? '▶️ 재개' : '⏸️ 일시정지'}</Text>
      </TouchableOpacity>

      {/* 운동별 카드 + 세트 목록 */}
      {session.exercises.map((ex: any) => (
        <View key={ex.id} style={styles.card}>
          <Text style={styles.exerciseName}>{ex.name}</Text>

          {/* 세트 목록 (Swipe → Delete / LongPress → Edit) */}
          <SwipeListView
            data={ex.sets as SetType[]}
            keyExtractor={(s) => String(s.id)}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onLongPress={() => openEdit(item)}
                delayLongPress={300}
                style={styles.setRow}
              >
                <Text style={styles.setIdx}>{index + 1}</Text>
                <Text style={styles.setTxt}>
                  {item.weight} kg × {item.reps} 회
                </Text>
              </TouchableOpacity>
            )}
            renderHiddenItem={({ item }) => (
              <View style={styles.hiddenRow}>
                <Ionicons
                  name="trash"
                  size={20}
                  color="white"
                  onPress={() => deleteSet(item.id)}
                />
              </View>
            )}
            rightOpenValue={-64}
            disableRightSwipe
            showsVerticalScrollIndicator={false}
          />

          {/* 세트 추가 입력창 */}
          <ExerciseSetInput exerciseId={ex.id} onAdd={addSet} />
        </View>
      ))}

      {/* 세션 종료 버튼 */}
      <TouchableOpacity style={styles.finishBtn} onPress={finish}>
        <Ionicons name="checkmark-circle" size={20} color="#000" />
        <Text style={styles.finishTxt}>운동 종료</Text>
      </TouchableOpacity>

      {/* 세트 수정 모달 */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>세트 수정</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="중량"
              value={editWeight}
              onChangeText={setEditWeight}
            />
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="횟수"
              value={editReps}
              onChangeText={setEditReps}
            />
            <View style={styles.modalBtns}>
              <Button title="취소" onPress={() => setEditVisible(false)} />
              <Button title="저장" onPress={saveEdit} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  pauseBtn: { alignSelf: 'center', marginVertical: 6 },
  pauseTxt: { color: '#ff7f27', fontSize: 16 },

  card: { backgroundColor: '#111', borderRadius: 8, padding: 12, marginVertical: 8 },
  exerciseName: { color: '#ff7f27', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#222',
  },
  setIdx: { width: 26, color: '#ff7f27', fontWeight: '600' },
  setTxt: { color: '#ccc' },

  hiddenRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
    backgroundColor: 'red',
  },

  finishBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff7f27',
    padding: 14,
    borderRadius: 6,
    marginTop: 10,
  },
  finishTxt: { color: '#000', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },

  modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' },
  modalBox: { width: '80%', backgroundColor: '#222', padding: 20, borderRadius: 8 },
  modalTitle: { color: '#fff', fontSize: 18, marginBottom: 12, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    paddingHorizontal: 10,
    color: '#fff',
    marginVertical: 6,
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
})
