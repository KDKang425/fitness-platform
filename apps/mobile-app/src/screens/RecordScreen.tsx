import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { Calendar, DateData } from 'react-native-calendars'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RecordStackParamList } from '../navigation/RecordStack'
import api from '../utils/api'
import Loader from '../components/Loader'
import { showToast } from '../utils/Toast'

type Session = { 
  id: number
  date: string
  totalVolume: number
  totalTime?: number | null
  workoutSets?: any[]
}

export default function RecordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RecordStackParamList>>()
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
      // Backend wraps response in { success, data, ... } structure
      const sessions = data.data?.sessions || []
      setSessions(sessions)
      buildMarks(sessions)
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

  const renderItem = ({ item }: { item: Session }) => {
    const duration = item.totalTime ? `${Math.floor(item.totalTime / 60)}분` : ''
    const setCount = item.workoutSets?.length || 0
    
    return (
      <TouchableOpacity 
        style={styles.item}
        onPress={() => navigation.navigate('WorkoutDetail', { id: item.id })}
      >
        <View>
          <Text style={styles.itemDate}>{item.date}</Text>
          {setCount > 0 && <Text style={styles.itemSets}>{setCount}세트 {duration}</Text>}
        </View>
        <Text style={styles.itemVol}>{item.totalVolume.toLocaleString()} kg</Text>
      </TouchableOpacity>
    )
  }

  if (loading) return <Loader />

  return (
    <View style={styles.container}>
      <Calendar
        theme={{
          calendarBackground: '#000',
          dayTextColor: '#fff',
          monthTextColor: '#ff7f27',
          arrowColor: '#ff7f27',
          todayTextColor: '#ff7f27',
          selectedDayTextColor: '#000',
          selectedDayBackgroundColor: '#ff7f27',
          textDisabledColor: '#444',
          dotColor: '#ff7f27',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
        }}
        markedDates={marked}
        onMonthChange={onMonthChange}
      />
      <FlatList
        data={sessions}
        keyExtractor={(s) => String(s.id)}
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
  itemSets: { color: '#999', fontSize: 14, marginTop: 2 },
  itemVol: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
})
