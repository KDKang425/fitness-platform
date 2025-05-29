import React, { useEffect, useState } from 'react'
import { Text, StyleSheet } from 'react-native'

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

  return <Text style={styles.timer}>{`${h}:${m}:${s}`}</Text>
}

const styles = StyleSheet.create({
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginVertical: 8,
    color: 'white',
  },
})
