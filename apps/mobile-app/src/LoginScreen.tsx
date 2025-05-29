import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { api } from '../utils/api';       
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 모두 입력하세요.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      // navigation.replace('Home', { user });   // HomeScreen 추가 후 주석 해제
      Alert.alert('로그인 성공', '일단 Home 화면 연결 전입니다.');
    } catch (e: any) {
      console.error(e);
      Alert.alert('로그인 실패', e?.response?.data?.message ?? '이메일/비밀번호를 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#111' }}>
      <Text style={{ fontSize: 28, color: '#fff', marginBottom: 32, textAlign: 'center' }}>
        Fitness Platform
      </Text>

      <TextInput
        placeholder="이메일"
        placeholderTextColor="#777"
        keyboardType="email-address"
        autoCapitalize="none"
        style={inputStyle}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="비밀번호"
        placeholderTextColor="#777"
        secureTextEntry
        style={inputStyle}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={submitting}
        style={{
          backgroundColor: submitting ? '#444' : '#ff7f27',
          paddingVertical: 14,
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>
          {submitting ? '로그인 중...' : '로그인'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#333',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: '#fff',
  marginBottom: 12,
};
