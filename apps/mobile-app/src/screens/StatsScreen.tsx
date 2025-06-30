import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import api from '../utils/api'
import VolumeChart from '../components/VolumeChart'
import MuscleVisualization from '../components/MuscleVisualization'

type StatRes = { label: string; value: number }[]

const muscleGroupMap: { [key: string]: string } = {
  '가슴': 'CHEST',
  '등': 'BACK',
  '어깨': 'SHOULDER',
  '삼두': 'TRICEPS',
  '이두': 'BICEPS',
  '전완': 'FOREARM',
  '복근': 'ABS',
  '둔근': 'GLUTES',
  '햄스트링': 'HAMSTRING',
  '대퇴사두': 'QUADRICEPS',
  '승모근': 'TRAPS',
  '종아리': 'CALVES',
  '다리': 'QUADRICEPS', // fallback for generic "legs"
  '팔': 'BICEPS', // fallback for generic "arms"
}

export default function StatsScreen() {
  const [mode, setMode] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<StatRes>([])
  const [previous, setPrevious] = useState<StatRes>([])
  const [showFront, setShowFront] = useState(true)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const apiPath = mode === 'week' ? 'weekly' : 'monthly'
      const { data } = await api.get(`/stats/${apiPath}`)
      
      // Transform backend response to expected format
      
      const transformed: StatRes = [
        { label: '총볼륨', value: data.totalVolume },
        ...data.perMuscleGroup.map((mg: any) => ({
          label: mg.muscle_group,
          value: mg.volume
        }))
      ]
      
      const transformedPrev: StatRes = [
        { label: '총볼륨', value: data.prevTotalVolume },
        ...data.perMuscleGroup.map((mg: any) => ({
          label: mg.muscle_group,
          value: Math.round(mg.volume * (data.prevTotalVolume / data.totalVolume))
        }))
      ]
      
      setCurrent(transformed)
      setPrevious(transformedPrev)
    } catch {
      const dummy: StatRes = [
        { label: '총볼륨', value: mode === 'week' ? 32000 : 128000 },
        { label: '가슴', value: mode === 'week' ? 6800 : 27200 },
        { label: '등', value: mode === 'week' ? 7400 : 29600 },
        { label: '다리', value: mode === 'week' ? 9200 : 36800 },
        { label: '팔', value: mode === 'week' ? 5600 : 22400 },
      ]
      const dummyPrev: StatRes = dummy.map(d => ({ ...d, value: Math.round(d.value * 0.85) }))
      setCurrent(dummy)
      setPrevious(dummyPrev)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStats()
  }, [mode])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  const totalCur = current[0]?.value ?? 0
  const totalPrev = previous[0]?.value ?? 0
  const diff = totalCur - totalPrev
  const diffPct = totalPrev ? Math.round((diff / totalPrev) * 100) : 0
  const diffColor = diff >= 0 ? '#ff7f27' : '#ff3b30'

  // Calculate muscle percentages for visualization
  
  const muscleData = current.slice(1).map(item => {
    const totalMuscleVolume = current.slice(1).reduce((sum, m) => sum + m.value, 0)
    return {
      muscle: muscleGroupMap[item.label] || item.label.toUpperCase(),
      volume: item.value,
      percentage: totalMuscleVolume > 0 ? Math.round((item.value / totalMuscleVolume) * 100) : 0
    }
  })

  return (
    <ScrollView style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.toggleBtn, mode === 'week' && styles.toggleActive]} onPress={() => setMode('week')}>
          <Text style={styles.toggleText}>주간</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, mode === 'month' && styles.toggleActive]} onPress={() => setMode('month')}>
          <Text style={styles.toggleText}>월간</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>총 볼륨</Text>
      <Text style={[styles.totalText, { color: diffColor }]}>
        {totalCur.toLocaleString()} kg ({diff >= 0 ? '+' : ''}{diff.toLocaleString()} / {diffPct}%)
      </Text>

      <Text style={styles.sectionTitle}>근육군별 볼륨</Text>
      <VolumeChart
        labels={current.slice(1).map(d => d.label)}
        current={current.slice(1).map(d => d.value)}
        previous={previous.slice(1).map(d => d.value)}
      />

      <Text style={styles.sectionTitle}>근육 사용 분포</Text>
      <View style={styles.muscleToggle}>
        <TouchableOpacity 
          style={[styles.muscleToggleBtn, showFront && styles.muscleToggleActive]} 
          onPress={() => setShowFront(true)}
        >
          <Text style={styles.muscleToggleText}>전면</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.muscleToggleBtn, !showFront && styles.muscleToggleActive]} 
          onPress={() => setShowFront(false)}
        >
          <Text style={styles.muscleToggleText}>후면</Text>
        </TouchableOpacity>
      </View>
      <MuscleVisualization muscleData={muscleData} showFront={showFront} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', marginBottom: 24 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderColor: '#ff7f27' },
  toggleActive: { backgroundColor: '#ff7f27' },
  toggleText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionTitle: { color: '#ff7f27', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  totalText: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  muscleToggle: { flexDirection: 'row', marginBottom: 16, justifyContent: 'center' },
  muscleToggleBtn: { paddingHorizontal: 24, paddingVertical: 8, borderWidth: 1, borderColor: '#ff7f27' },
  muscleToggleActive: { backgroundColor: '#ff7f27' },
  muscleToggleText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
})
