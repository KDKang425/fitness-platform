import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import api from '../utils/api'

type Routine = { id: string; title: string; subscribers: number; weeks: number }

export default function ExploreScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Routine[]>([])

  const fetchList = async () => {
    setLoading(true)
    try {
      const res = await api.get('/routines?sort=popular')
      setList(res.data)
    } catch {
      setList([
        { id: '1', title: 'PHUL 4주 프로그램', subscribers: 152, weeks: 4 },
        { id: '2', title: 'nSuns 5/3/1 6주', subscribers: 97, weeks: 6 },
        { id: '3', title: 'TSA 중급 파워리프팅', subscribers: 211, weeks: 9 },
      ])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchList()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  const renderItem = ({ item }: { item: Routine }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('RoutineDetail', { id: item.id })}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.sub}>{item.weeks}주 · 구독 {item.subscribers}</Text>
    </TouchableOpacity>
  )

  return (
    <FlatList data={list} keyExtractor={r => r.id} renderItem={renderItem} contentContainerStyle={styles.list} />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  list: { backgroundColor: '#000', padding: 16 },
  item: { backgroundColor: '#111', padding: 20, borderRadius: 8, marginBottom: 12 },
  title: { color: '#ff7f27', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  sub: { color: '#fff', fontSize: 14 },
})
