import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { useFocusEffect } from '@react-navigation/native'
import api from '../utils/api'
import Loader from '../components/Loader'
import { showToast } from '../utils/Toast'

type Session = { id: string; date: string; volume: number }

export default function RecordScreen() {
  const today = new Date()
  const [currentYM, setCurrentYM] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
  )

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [marked, setMarked] = useState<{ [key: string]: any }>({})

  const buildMarks = (arr: Session[]) => {
    const obj: { [k: string]: any } = {}
    arr.forEach((s) => {
      obj[s.date] = { marked: true, dotColor: '#ff7f27' }
    })
    setMarked(obj)
  }

  const fetchMonth = async (ym: string) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/workouts?month=${ym}`)
      setSessions(data)
      buildMarks(data)
    } catch (e) {
      showToast('운동 기록을 불러오지 못했습니다.')
      setSessions([])
      setMarked({})
    }
    setLoading(false)
  }

  /** 화면 포커스될 때마다 해당 월 데이터 새로고침 */
  useFocusEffect(
    useCallback(() => {
      fetchMonth(currentYM)
    }, [currentYM]),
  )

  const onMonthChange = (d: DateData) => {
    const ym = `${d.year}-${String(d.month).padStart(2, '0')}`
    setCurrentYM(ym)
  }

  const renderItem = ({ item }: { item: Session }) => (
    <View style={styles.item}>
      <Text style={styles.itemDate}>{item.date}</Text>
      <Text style={styles.itemVol}>{item.volume.toLocaleString()} kg</Text>
    </View>
  )

  if (loading) return <Loader />

  return (
    <View style={styles.container}>
      <Calendar
        theme={{
          calendarBackground: '#000',
          dayTextColor: '#fff',
          monthTextColor: '#ff7f27',
          arrowColor: '#ff7f27',
        }}
        markedDates={marked}
        onMonthChange={onMonthChange}
      />
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>기록이 없습니다.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  itemDate: { color: '#fff', fontSize: 16 },
  itemVol: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
})
