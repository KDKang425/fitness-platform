import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { showToast } from './Toast'

// 환경에 따른 BASE URL 설정
function getBaseUrl(): string {
  // 환경변수에서 먼저 확인 - React Native에서는 process.env가 동작하지 않으므로 Constants를 사용
  const envUrl = Constants.expoConfig?.extra?.apiUrl || Constants.manifest?.extra?.apiUrl
  if (envUrl) {
    console.log('Using API URL from env:', envUrl)
    return `${envUrl}/api/v1`
  }

  // 개발 환경에서 디버거 호스트 사용
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0] || Constants.manifest?.debuggerHost?.split(':')[0]
  if (debuggerHost && debuggerHost !== 'localhost') {
    const devUrl = `http://${debuggerHost}:3001/api/v1`
    console.log('Using development API URL:', devUrl)
    return devUrl
  }
  
  // 기본값
  const defaultUrl = 'http://localhost:3001/api/v1'
  console.log('Using default API URL:', defaultUrl)
  return defaultUrl
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 요청 인터셉터
api.interceptors.request.use(async (config) => {
  console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
  
  try {
    const token = await AsyncStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    console.warn('Failed to get access token:', error)
  }
  
  return config
}, (error) => {
  console.error('Request interceptor error:', error)
  return Promise.reject(error)
})

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    
    // Unwrap backend response format
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data
    }
    
    return response
  },
  async (error) => {
    const original = error.config
    
    console.error(`❌ API Error: ${error.response?.status || 'Network'} ${original?.url}`, {
      message: error.message,
      data: error.response?.data
    })

    // 401 에러 처리 (토큰 갱신)
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original?.url?.includes('/auth/')
    ) {
      original._retry = true
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${getBaseUrl()}/auth/refresh`, {
            refreshToken
          })
          
          // Handle wrapped response from backend
          const responseData = response.data.data || response.data
          const { accessToken, refreshToken: newRefreshToken } = responseData
          await AsyncStorage.setItem('accessToken', accessToken)
          await AsyncStorage.setItem('refreshToken', newRefreshToken)
          
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
        showToast('세션이 만료되었습니다. 다시 로그인해주세요.')
      }
    }

    // 네트워크 에러 처리
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      showToast('네트워크 연결을 확인해주세요.')
    } else if (error.response?.status >= 500) {
      showToast('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }

    return Promise.reject(error)
  }
)

export default api