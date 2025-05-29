import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api from '../utils/api'
import Loader from '../components/Loader'
import { showToast } from '../utils/Toast'

type Routine = { id: string; title: string; subscribers: number; weeks: number }

export default function ExploreScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<Routine[]>([])

  const fetchList = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/routines?sort=popular')
      setList(data)
    } catch {
      showToast('루틴 목록을 불러오지 못했습니다.')
      setList([])
    }
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      fetchList()
    }, []),
  )

  if (loading) return <Loader />

  const renderItem = ({ item }: { item: Routine }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('RoutineDetail', { id: item.id })}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.sub}>
        {item.weeks}주 · 구독 {item.subscribers}
      </Text>
    </TouchableOpacity>
  )

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={styles.empty}>표시할 루틴이 없습니다.</Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { backgroundColor: '#000', padding: 16 },
  item: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { color: '#ff7f27', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  sub: { color: '#fff', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
})
