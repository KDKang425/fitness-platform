// utils/api.ts - 디버깅 버전
import axios from 'axios'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

function getBaseUrl() {
  const host = Constants.manifest?.debuggerHost?.split(':')[0]
  console.log('Debug Host:', host)
  
  if (host) {
    const url = `http://192.168.0.12:3001/api/v1`
    console.log('Development API URL:', url)
    return url
  }
  
  const prodUrl = 'https://your-production-domain.com/api/v1'
  console.log('Production API URL:', prodUrl)
  return prodUrl
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// 요청 인터셉터에 로깅 추가
api.interceptors.request.use(async (config) => {
  console.log('API Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    data: config.data
  })
  
  const token = await AsyncStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('Authorization header added')
  }
  return config
})

// 응답 인터셉터에 로깅 추가
api.interceptors.response.use(
  (res) => {
    console.log('API Response Success:', {
      status: res.status,
      statusText: res.statusText,
      data: res.data
    })
    return res
  },
  async (error) => {
    console.log('API Response Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      }
    })

    const original = error.config as any
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !(original?.url ?? '').includes('/auth/refresh')
    ) {
      original._retry = true
      const rt = await AsyncStorage.getItem('refreshToken')
      if (rt) {
        try {
          const resp = await axios.post(`${getBaseUrl()}/auth/refresh`, { refreshToken: rt })
          const { accessToken, refreshToken } = resp.data
          await AsyncStorage.setItem('accessToken', accessToken)
          await AsyncStorage.setItem('refreshToken', refreshToken)
          original.headers.Authorization = `Bearer ${accessToken}`
          return api(original)
        } catch {
          await AsyncStorage.removeItem('accessToken')
          await AsyncStorage.removeItem('refreshToken')
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api