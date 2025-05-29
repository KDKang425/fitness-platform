import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native'
import api from '../utils/api'  

export default function ProgramStartScreen({ navigation }: any) {
  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.post('/workouts', { type: 'program' })
        navigation.replace('WorkoutSession', { sessionId: data.id })
      } catch {
        Alert.alert('오류', '세션 생성에 실패했습니다.')
        navigation.goBack()
      }
    })()
  }, [])

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="orange" />
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
})