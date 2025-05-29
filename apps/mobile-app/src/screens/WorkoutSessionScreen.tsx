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

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get<Session>(`/workouts/${sessionId}`)
        setSession(data)
        setSets(data.sets ?? [])
      } catch {
        Alert.alert('세션 불러오기 실패')
        navigation.goBack()
      }
    })()
  }, [sessionId, navigation])

  const addSet = useCallback(
    async (payload: AddSetPayload) => {
      try {
        const { data } = await api.post<SetType>(
          `/workouts/${sessionId}/sets`,
          payload,
        )
        setSets(prev => [...prev, data])
      } catch {
        Alert.alert('추가 실패')
      }
    },
    [sessionId],
  )

  const deleteSet = useCallback(
    async (setId: number) => {
      try {
        await api.delete(`/workouts/sets/${setId}`)
        setSets(prev => prev.filter(s => s.id !== setId))
      } catch {
        Alert.alert('삭제 실패')
      }
    },
    [],
  )

  const saveEdit = useCallback(
    async (weight: number, reps: number) => {
      if (!editTarget) return
      try {
        await api.patch(`/workouts/sets/${editTarget.id}`, { weight, reps })
        setSets(prev =>
          prev.map(s =>
            s.id === editTarget.id ? { ...s, weight, reps } : s,
          ),
        )
      } catch {
        Alert.alert('수정 실패')
      } finally {
        setEditTarget(null)
      }
    },
    [editTarget],
  )

  const finishSession = async () => {
    try {
      await api.patch(`/workouts/${sessionId}/finish`)
      navigation.popToTop()
    } catch {
      Alert.alert('종료 실패')
    }
  }

  if (!session)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
