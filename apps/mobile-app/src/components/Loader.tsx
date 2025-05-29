
import React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'

interface Props {
  
  full?: boolean

  size?: number | 'small' | 'large'
}

export default function Loader({ full = true, size = 'large' }: Props) {
  if (full) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size={size} color="#ff7f27" />
      </View>
    )
  }
  return <ActivityIndicator size={size} color="#ff7f27" />
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
