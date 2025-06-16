import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

export interface SetRowProps {
  index: number
  weight: number
  reps: number
  isCompleted?: boolean
  onLongPress?: () => void
  onToggleComplete?: () => void
}

export default function SetRow({
  index,
  weight,
  reps,
  isCompleted,
  onLongPress,
  onToggleComplete,
}: SetRowProps) {
  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onToggleComplete} style={styles.checkbox}>
          <Ionicons 
            name={isCompleted ? "checkbox" : "square-outline"} 
            size={24} 
            color={isCompleted ? "#ff7f27" : "#666"} 
          />
        </TouchableOpacity>
        <Text style={[styles.index, isCompleted && styles.completedText]}>{index}</Text>
        <Text style={[styles.text, isCompleted && styles.completedText]}>{weight} kg</Text>
        <Text style={[styles.text, isCompleted && styles.completedText]}>{reps} 회</Text>
      </View>
    </TouchableOpacity>
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
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 12,
  },
  index: { width: 32, color: 'orange', fontWeight: '600' },
  text: { flex: 1, color: 'white' },
  completedText: { 
    color: '#888', 
    textDecorationLine: 'line-through' 
  },
})
