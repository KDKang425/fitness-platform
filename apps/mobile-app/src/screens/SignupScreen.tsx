import React, { useState, useContext } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import api from '../utils/api'
import { AuthContext } from '../contexts/AuthContext'

export default function SignupScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(AuthContext)

  const onPressSignup = async () => {
    // 입력값 검증
    if (!email || !password || !nickname) {
      Alert.alert('알림', '모든 필드를 입력해주세요.')
      return
    }
    
    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.')
      return
    }

    try {
      setLoading(true)
      
      // 회원가입
      await api.post('/auth/register', { email, password, nickname })

      // 자동 로그인
      const res = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken } = res.data
      await login(accessToken, refreshToken)

      // 프로필 설정으로 이동
      navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] })
    } catch (e: any) {
      console.error('Signup error:', e)
      Alert.alert(
        '회원가입 실패', 
        e?.response?.data?.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput 
        style={styles.input} 
        placeholder="이메일" 
        placeholderTextColor="#888" 
        onChangeText={setEmail} 
        value={email} 
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput 
        style={styles.input} 
        placeholder="비밀번호" 
        placeholderTextColor="#888" 
        secureTextEntry 
        onChangeText={setPassword} 
        value={password}
        editable={!loading}
      />
      <TextInput 
        style={styles.input} 
        placeholder="닉네임" 
        placeholderTextColor="#888" 
        onChangeText={setNickname} 
        value={nickname}
        editable={!loading}
      />
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={onPressSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>계정 생성</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.buttonOutline} 
        onPress={() => navigation.navigate('Login')}
        disabled={loading}
      >
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
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center' },
  buttonOutlineText: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
})