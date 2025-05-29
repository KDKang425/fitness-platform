// src/screens/LoginScreen.tsx
import React, { useState, useContext } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import api from '../utils/api'
import { AuthStackParamList } from '../navigation/AuthStack'
import { AuthContext } from '../contexts/AuthContext'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)

  const onPressLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력하세요.')
      return
    }
    try {
      setLoading(true)
      const res = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken } = res.data
      await login(accessToken, refreshToken)
    } catch (e: any) {
      Alert.alert('로그인 실패', e?.response?.data?.message ?? '이메일/비밀번호를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitness Mate</Text>
      <TextInput
        placeholder="이메일"
        placeholderTextColor="#777"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="비밀번호"
        placeholderTextColor="#777"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={onPressLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.linkText}>아직 계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#111' },
  title: { fontSize: 32, color: '#ff7f27', marginBottom: 32, textAlign: 'center', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', marginBottom: 12 },
  button: { backgroundColor: '#ff7f27', paddingVertical: 14, borderRadius: 8, marginTop: 8, alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  link: { marginTop: 24 },
  linkText: { color: '#ff7f27', textAlign: 'center' },
})
