import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import api from '../utils/api'

export default function RoutineDetailScreen({ route }: { route: any }) {
  const { id } = route.params
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [subscribed, setSubscribed] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/routines/${id}`)
      setData(res.data)
      setSubscribed(res.data.isSubscribed)
    } catch {
      setData({
        title: '더미 루틴',
        description: '가슴/등/하체 분할, 주 4회',
        weeks: 4,
        days: ['Day 1: 벤치', 'Day 2: 스쿼트', 'Day 3: 휴식', 'Day 4: 데드리프트'],
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onSubscribe = async () => {
    try {
      await api.post(`/routine-subscriptions/${id}`)
    } catch {}
    setSubscribed(true)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.desc}>{data.description}</Text>
      <Text style={styles.info}>{data.weeks}주 프로그램</Text>
      {data.days?.map((d: string, i: number) => (
        <Text key={i} style={styles.day}>
          {d}
        </Text>
      ))}
      {subscribed ? (
        <View style={styles.subscribedBtn}>
          <Text style={styles.btnText}>구독 완료</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.subscribeBtn} onPress={onSubscribe}>
          <Text style={styles.btnText}>구독하기</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: '#000', padding: 24 },
  title: { color: '#ff7f27', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: '#fff', fontSize: 16, marginBottom: 8 },
  info: { color: '#fff', fontSize: 14, marginBottom: 16 },
  day: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  subscribeBtn: { backgroundColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 20 },
  subscribedBtn: { borderWidth: 1, borderColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
})
