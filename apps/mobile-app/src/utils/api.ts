import axios from 'axios';
import Constants from 'expo-constants';

/**
 * 개발(Expo Go)·에뮬·실기기 환경별로
 *   PC IP → http://<PC_IP>:3001
 *   iOS 시뮬 → http://localhost:3001
 * 자동으로 맞춰 주는 유틸
 */
function getBaseUrl() {
  // dev 빌드: manifest.debuggerHost = "192.168.xx.xx:8081"
  const host = Constants.manifest?.debuggerHost?.split(':')[0];
  // EAS 빌드·프로덕션 APK에서는 .extra.apiUrl 혹은 ENV로 주입
  if (host) return `http://${host}:3001/api/v1`;

  // fallback (프로덕션에선 .env / EXPO_PUBLIC_API_URL 권장)
  return 'https://your-production-domain.com/api/v1';
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

// ──────────────────────────────────────────────
// 액세스 토큰을 자동으로 Authorization 헤더에 실어 보내고 싶다면
//
// import AsyncStorage from '@react-native-async-storage/async-storage';
// api.interceptors.request.use(async config => {
//   const token = await AsyncStorage.getItem('accessToken');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
// ──────────────────────────────────────────────
