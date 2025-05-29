import axios from 'axios'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

function getBaseUrl() {
  const host = Constants.manifest?.debuggerHost?.split(':')[0]
  if (host) return `http://${host}:3001/api/v1`
  return 'https://your-production-domain.com/api/v1'
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
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
