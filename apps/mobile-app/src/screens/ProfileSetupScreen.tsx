import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'
import api from '../utils/api'

export default function ProfileSetupScreen({ navigation }: { navigation: any }) {
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bench, setBench] = useState('')
  const [squat, setSquat] = useState('')
  const [deadlift, setDeadlift] = useState('')

  const onSubmit = async () => {
    try {
      await api.post('/users/profile/initial', {
        height: Number(height),
        initial_weight: Number(weight),
        bench_press_1rm: Number(bench),
        squat_1rm: Number(squat),
        deadlift_1rm: Number(deadlift),
      })
      navigation.goBack()
    } catch {
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>프로필 설정</Text>
      <TextInput style={styles.input} placeholder="키 (cm)" placeholderTextColor="#888" keyboardType="numeric" onChangeText={setHeight} value={height} />
      <TextInput style={styles.input} placeholder="몸무게 (kg)" placeholderTextColor="#888" keyboardType="numeric" onChangeText={setWeight} value={weight} />
      <TextInput style={styles.input} placeholder="벤치프레스 1RM" placeholderTextColor="#888" keyboardType="numeric" onChangeText={setBench} value={bench} />
      <TextInput style={styles.input} placeholder="스쿼트 1RM" placeholderTextColor="#888" keyboardType="numeric" onChangeText={setSquat} value={squat} />
      <TextInput style={styles.input} placeholder="데드리프트 1RM" placeholderTextColor="#888" keyboardType="numeric" onChangeText={setDeadlift} value={deadlift} />
      <TouchableOpacity style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>저장하고 시작하기</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  title: { color: '#ff7f27', fontSize: 32, fontWeight: 'bold', marginBottom: 32 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', borderRadius: 4, padding: 12, color: '#fff', marginBottom: 16 },
  button: { width: '100%', backgroundColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
})
