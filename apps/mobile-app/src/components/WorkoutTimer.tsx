import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  startedAt: number
  paused?: boolean
}

export default function WorkoutTimer({ startedAt, paused = false }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (paused) return
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    )
    return () => clearInterval(id)
  }, [startedAt, paused])

  const h = Math.floor(elapsed / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((elapsed % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = (elapsed % 60).toString().padStart(2, '0')

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, paused && styles.pausedTimer]}>
        {`${h}:${m}:${s}`}
      </Text>
      {paused && (
        <View style={styles.pausedIndicator}>
          <Ionicons name="pause-circle" size={20} color="#ff7f27" />
          <Text style={styles.pausedText}>일시정지</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textAlign: 'center',
    color: 'white',
  },
  pausedTimer: {
    opacity: 0.6,
  },
  pausedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pausedText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#ff7f27',
    fontWeight: '600',
  },
})
