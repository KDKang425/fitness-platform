import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface Props {
  index: number
  weight: number
  reps: number
}

export default function SetRow({ index, weight, reps }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.index}>{index}</Text>
      <Text style={styles.text}>{weight} kg</Text>
      <Text style={styles.text}>{reps} 회</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  index: { width: 32, color: 'orange', fontWeight: '600' },
  text: { flex: 1, color: 'white' },
})
