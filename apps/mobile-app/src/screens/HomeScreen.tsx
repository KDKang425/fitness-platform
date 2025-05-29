import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import api from '../utils/api'

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<any>(null)

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const res = await api.get('/routines/active')
        setProgram(res.data)
      } catch {}
      setLoading(false)
    }
    fetchProgram()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {program ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{program.title}</Text>
          <Text style={styles.cardSub}>주차 {program.week} / {program.totalWeeks}</Text>
          <TouchableOpacity style={styles.cardButton} onPress={() => navigation.navigate('ProgramStart')}>
            <Text style={styles.cardButtonText}>오늘의 운동 시작</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardEmpty}>
          <Text style={styles.emptyText}>진행 중인 프로그램이 없습니다</Text>
        </View>
      )}

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ProgramStart')}>
        <Text style={styles.actionText}>프로그램 시작</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('FreeWorkout')}>
        <Text style={styles.actionText}>자유 운동 시작</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButtonOutline} onPress={() => navigation.navigate('RoutineCreate')}>
        <Text style={styles.actionOutlineText}>루틴 생성</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111', borderRadius: 8, padding: 20, marginBottom: 24 },
  cardTitle: { color: '#ff7f27', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  cardSub: { color: '#fff', fontSize: 16, marginBottom: 16 },
  cardButton: { backgroundColor: '#ff7f27', padding: 12, borderRadius: 4, alignItems: 'center' },
  cardButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  cardEmpty: { backgroundColor: '#111', borderRadius: 8, padding: 32, marginBottom: 24, alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16 },
  actionButton: { backgroundColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginBottom: 16 },
  actionText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  actionButtonOutline: { borderWidth: 1, borderColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center' },
  actionOutlineText: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
})
