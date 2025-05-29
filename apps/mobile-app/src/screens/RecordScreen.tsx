import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import api from '../utils/api'

type Session = { id: string; date: string; volume: number }

export default function RecordScreen() {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [marked, setMarked] = useState<{ [key: string]: any }>({})

  const fetchMonth = async (ym: string) => {
    setLoading(true)
    try {
      const res = await api.get(`/workouts?month=${ym}`)
      setSessions(res.data)
    } catch {
      const dummy: Session[] = [
        { id: '1', date: `${ym}-03`, volume: 12000 },
        { id: '2', date: `${ym}-06`, volume: 15000 },
        { id: '3', date: `${ym}-12`, volume: 9800 },
        { id: '4', date: `${ym}-18`, volume: 13400 },
      ]
      setSessions(dummy)
    }
    setLoading(false)
  }

  const buildMarks = (arr: Session[]) => {
    const obj: { [k: string]: any } = {}
    arr.forEach(s => {
      obj[s.date] = { marked: true, dotColor: '#ff7f27' }
    })
    setMarked(obj)
  }

  useEffect(() => {
    const today = new Date()
    const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    fetchMonth(ym)
  }, [])

  useEffect(() => {
    buildMarks(sessions)
  }, [sessions])

  const onMonthChange = (d: DateData) => {
    const ym = `${d.year}-${String(d.month).padStart(2, '0')}`
    fetchMonth(ym)
  }

  const renderItem = ({ item }: { item: Session }) => (
    <View style={styles.item}>
      <Text style={styles.itemDate}>{item.date}</Text>
      <Text style={styles.itemVol}>{item.volume.toLocaleString()} kg</Text>
    </View>
  )

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )

  return (
    <View style={styles.container}>
      <Calendar
        theme={{ calendarBackground: '#000', dayTextColor: '#fff', monthTextColor: '#ff7f27', arrowColor: '#ff7f27' }}
        markedDates={marked}
        onMonthChange={onMonthChange}
      />
      <FlatList data={sessions} keyExtractor={s => s.id} renderItem={renderItem} contentContainerStyle={styles.list} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  itemDate: { color: '#fff', fontSize: 16 },
  itemVol: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
})
