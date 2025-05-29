import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import api from '../utils/api'

export default function SignupScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const onPressSignup = async () => {
    try {
      await api.post('/auth/signup', { email, password, nickname })
      navigation.navigate('ProfileSetup', { email, password })
    } catch {}
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput style={styles.input} placeholder="이메일" placeholderTextColor="#888" onChangeText={setEmail} value={email} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor="#888" secureTextEntry onChangeText={setPassword} value={password} />
      <TextInput style={styles.input} placeholder="닉네임" placeholderTextColor="#888" onChangeText={setNickname} value={nickname} />
      <TouchableOpacity style={styles.button} onPress={onPressSignup}>
        <Text style={styles.buttonText}>계정 생성</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonOutline} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonOutlineText}>로그인으로 돌아가기</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  title: { color: '#ff7f27', fontSize: 32, fontWeight: 'bold', marginBottom: 32 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', borderRadius: 4, padding: 12, color: '#fff', marginBottom: 16 },
  button: { width: '100%', backgroundColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center' },
  buttonOutlineText: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
})
