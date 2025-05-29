import axios from 'axios';

// 에뮬레이터 종류에 따라 IP 변경
//  * Android Studio 에뮬레이터 → 10.0.2.2
//  * iOS 시뮬레이터       → localhost
//  * 실기기 + 같은 Wi-Fi  → PC의 LAN IP (예: 192.168.x.x)
const BASE_URL = 'http://192.168.48.1:3001/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// 액세스 토큰 자동 헤더 삽입 (선택)
// import AsyncStorage from '@react-native-async-storage/async-storage';
// api.interceptors.request.use(async (config) => {
//   const token = await AsyncStorage.getItem('accessToken');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
