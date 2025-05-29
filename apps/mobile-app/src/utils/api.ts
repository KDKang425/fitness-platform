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

export default api
