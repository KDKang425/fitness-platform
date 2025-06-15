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
    
    // 비밀번호 유효성 검사 - 백엔드 요구사항과 일치
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      Alert.alert('알림', '비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 각각 하나 이상 포함해야 합니다.')
      return
    }

    try {
      setLoading(true)
      console.log('회원가입 시도:', { email, nickname })
      
      // 회원가입
      const registerResponse = await api.post('/auth/register', { 
        email, 
        password, 
        nickname 
      })
      console.log('회원가입 성공:', registerResponse.data)

      // 자동 로그인
      console.log('자동 로그인 시도...')
      const loginResponse = await api.post('/auth/login', { email, password })
      console.log('로그인 성공:', loginResponse.data)
      
      const { accessToken, refreshToken, user } = loginResponse.data
      await login(accessToken, refreshToken, user)

      // 프로필 설정으로 이동
      console.log('프로필 설정으로 이동...')
      navigation.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] })
      
    } catch (e: any) {
      console.error('회원가입 에러:', e)
      
      let errorMessage = '회원가입 중 오류가 발생했습니다.'
      
      if (e.code === 'NETWORK_ERROR' || e.message === 'Network Error') {
        errorMessage = '서버에 연결할 수 없습니다.\n\n가능한 해결방법:\n1. 백엔드 서버가 실행 중인지 확인\n2. 네트워크 연결 확인\n3. 개발 서버 주소 확인'
      } else if (e.response?.status === 400) {
        errorMessage = e.response.data?.message || '입력 정보를 확인해주세요.'
      } else if (e.response?.status === 409) {
        errorMessage = '이미 존재하는 이메일입니다.'
      } else if (e.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message
      }
      
      Alert.alert('회원가입 실패', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 테스트용 함수 - 서버 연결 확인
  const testConnection = async () => {
    try {
      setLoading(true)
      console.log('서버 연결 테스트 중...')
      
      // 간단한 헬스체크 또는 존재하는 엔드포인트 호출
      const response = await api.get('/health')
      Alert.alert('연결 성공', '서버 연결이 정상입니다.')
      console.log('서버 연결 성공:', response.data)
    } catch (e: any) {
      console.error('서버 연결 실패:', e)
      Alert.alert(
        '연결 실패', 
        `서버에 연결할 수 없습니다.\n\n에러 정보:\n${e.message || '알 수 없는 에러'}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      
      {/* 개발용 - 서버 연결 테스트 버튼 */}
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.testButtonText}>서버 연결 테스트</Text>
      </TouchableOpacity>
      
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
  testButton: { 
    backgroundColor: '#333', 
    padding: 8, 
    borderRadius: 4, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#666'
  },
  testButtonText: { color: '#fff', fontSize: 12 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', borderRadius: 4, padding: 12, color: '#fff', marginBottom: 16 },
  button: { width: '100%', backgroundColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginBottom: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center' },
  buttonOutlineText: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
})