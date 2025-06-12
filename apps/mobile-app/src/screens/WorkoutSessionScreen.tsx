import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Button,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { SwipeListView } from 'react-native-swipe-list-view'

import api from '../utils/api'
import WorkoutTimer from '../components/WorkoutTimer'
import ExerciseSetInput from '../components/ExerciseSetInput'
import SetRow, { SetRowProps } from '../components/SetRow'
import EditSetModal from '../components/EditSetModal'
import { useError } from '../utils/errorHandler'
import { showToast } from '../utils/Toast'

interface SetType {
  id: number
  exerciseId: number
  weight: number
  reps: number
}

interface Session {
  id: number
  startedAt: string
  paused: boolean
  defaultExerciseId: number
  sets: SetType[]
}

interface AddSetPayload {
  exerciseId: number
  weight: number
  reps: number
}

interface Props {
  route: { params: { sessionId: number } }
  navigation: any 
}

export default function WorkoutSessionScreen({ route, navigation }: Props) {
  const { sessionId } = route.params
  const [session, setSession]   = useState<Session | null>(null)
  const [sets, setSets]         = useState<SetType[]>([])
  const [editTarget, setEditTarget] = useState<SetType | null>(null)
  const { error, loading, execute } = useError()

  useEffect(() => {
    ;(async () => {
      const result = await execute(
        api.get<Session>(`/workouts/${sessionId}`),
        {
          onError: () => {
            Alert.alert('오류', '운동 세션을 불러올 수 없습니다.', [
              { text: '확인', onPress: () => navigation.goBack() }
            ])
          }
        }
      )
      
      if (result) {
        setSession(result.data)
        setSets(result.data.sets ?? [])
      }
    })()
  }, [sessionId, navigation, execute])

  const addSet = useCallback(
    async (payload: AddSetPayload) => {
      const result = await execute(
        api.post<SetType>(`/workouts/${sessionId}/sets`, payload)
      )
      
      if (result) {
        setSets(prev => [...prev, result.data])
        showToast('세트가 추가되었습니다.')
      }
    },
    [sessionId, execute],
  )

  const deleteSet = useCallback(
    async (setId: number) => {
      const result = await execute(
        api.delete(`/workouts/sets/${setId}`)
      )
      
      if (result) {
        setSets(prev => prev.filter(s => s.id !== setId))
        showToast('세트가 삭제되었습니다.')
      }
    },
    [execute],
  )

  const saveEdit = useCallback(
    async (weight: number, reps: number) => {
      if (!editTarget) return
      
      const result = await execute(
        api.patch(`/workouts/sets/${editTarget.id}`, { weight, reps })
      )
      
      if (result) {
        setSets(prev =>
          prev.map(s =>
            s.id === editTarget.id ? { ...s, weight, reps } : s,
          ),
        )
        showToast('세트가 수정되었습니다.')
      }
      
      setEditTarget(null)
    },
    [editTarget, execute],
  )

  const finishSession = async () => {
    Alert.alert(
      '운동 종료',
      '운동을 종료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: async () => {
            const result = await execute(
              api.patch(`/workouts/${sessionId}/finish`),
              { showAlert: true }
            )
            
            if (result) {
              showToast('운동이 완료되었습니다!')
              navigation.popToTop()
            }
          }
        }
      ]
    )
  }

  if (!session || loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )

  return (
    <View style={styles.container}>
      <WorkoutTimer
        startedAt={Date.parse(session.startedAt)}
        paused={session.paused}
      />

      <ExerciseSetInput exerciseId={session.defaultExerciseId} onAdd={addSet} />

      <SwipeListView
        data={sets}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <SetRow
            index={index + 1}
            weight={item.weight}
            reps={item.reps}
            onLongPress={() => setEditTarget(item)}
          />
        )}
        renderHiddenItem={({ item }) => (
          <View style={styles.hidden}>
            <Button title="삭제" onPress={() => deleteSet(item.id)} />
          </View>
        )}
        rightOpenValue={-80}
        disableRightSwipe
      />

      <Button title="세션 종료" onPress={finishSession} />

      <EditSetModal
        visible={!!editTarget}
        weight0={editTarget?.weight ?? 0}
        reps0={editTarget?.reps ?? 0}
        onSave={saveEdit}
        onCancel={() => setEditTarget(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hidden: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    backgroundColor: 'red',
  },
})
