import React, { useState, useContext } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import api from '../utils/api'
import { AuthContext } from '../contexts/AuthContext'

export default function ProfileSetupScreen({ navigation }: { navigation: any }) {
  const { user, login, accessToken, refreshToken } = useContext(AuthContext)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bench, setBench] = useState('')
  const [squat, setSquat] = useState('')
  const [deadlift, setDeadlift] = useState('')
  const [ohp, setOhp] = useState('')
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri)
    }
  }

  const onSubmit = async () => {
    setError(null)
    setLoading(true)
    
    try {
      // Validate required fields
      if (!height || !weight) {
        setError('키와 몸무게는 필수 입력 사항입니다.')
        setLoading(false)
        return
      }
      
      // Upload profile image first if selected
      let profileImageUrl = null
      if (profileImage) {
        const formData = new FormData()
        formData.append('file', {
          uri: profileImage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any)
        
        try {
          const uploadResponse = await api.post('/upload/profile-image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          profileImageUrl = uploadResponse.data.data.url
        } catch (uploadError) {
          console.error('Profile image upload failed:', uploadError)
          // Continue without profile image if upload fails
        }
      }
      
      const payload: any = {
        height: Number(height),
        weight: Number(weight),
        preferredUnit: unit,
      }
      
      // Add optional 1RM values if provided
      if (bench) payload.benchPress1RM = Number(bench)
      if (squat) payload.squat1RM = Number(squat)
      if (deadlift) payload.deadlift1RM = Number(deadlift)
      if (ohp) payload.overheadPress1RM = Number(ohp)
      if (profileImageUrl) payload.profileImageUrl = profileImageUrl
      
      await api.post('/users/profile/initial', payload)
      
      // Update user data with completed setup flag
      if (user && accessToken && refreshToken) {
        const updatedUser = { ...user, hasCompletedInitialSetup: true, profileImageUrl }
        await login(accessToken, refreshToken, updatedUser)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '프로필 설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>프로필 설정</Text>
      
      <TouchableOpacity style={styles.imagePickerContainer} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={40} color="#888" />
            <Text style={styles.imagePlaceholderText}>프로필 사진 추가</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.unitContainer}>
        <TouchableOpacity
          style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
          onPress={() => setUnit('kg')}
        >
          <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>kg</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
          onPress={() => setUnit('lbs')}
        >
          <Text style={[styles.unitText, unit === 'lbs' && styles.unitTextActive]}>lbs</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput style={styles.input} placeholder="키 (cm)" placeholderTextColor="#888" keyboardType="numeric" onChangeText={setHeight} value={height} />
      <TextInput style={styles.input} placeholder={`몸무게 (${unit})`} placeholderTextColor="#888" keyboardType="numeric" onChangeText={setWeight} value={weight} />
      
      <Text style={styles.sectionTitle}>1RM 기록 (선택사항)</Text>
      <Text style={styles.helperText}>나중에 언제든지 추가할 수 있습니다</Text>
      
      <TextInput style={styles.input} placeholder={`벤치프레스 1RM (${unit})`} placeholderTextColor="#888" keyboardType="numeric" onChangeText={setBench} value={bench} />
      <TextInput style={styles.input} placeholder={`스쿼트 1RM (${unit})`} placeholderTextColor="#888" keyboardType="numeric" onChangeText={setSquat} value={squat} />
      <TextInput style={styles.input} placeholder={`데드리프트 1RM (${unit})`} placeholderTextColor="#888" keyboardType="numeric" onChangeText={setDeadlift} value={deadlift} />
      <TextInput style={styles.input} placeholder={`오버헤드프레스 1RM (${unit})`} placeholderTextColor="#888" keyboardType="numeric" onChangeText={setOhp} value={ohp} />
      
      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '저장 중...' : '저장하고 시작하기'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 20 },
  title: { color: '#ff7f27', fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8, alignSelf: 'flex-start', width: '100%' },
  helperText: { color: '#888', fontSize: 14, marginBottom: 16, alignSelf: 'flex-start', width: '100%' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ff7f27', borderRadius: 4, padding: 12, color: '#fff', marginBottom: 16 },
  button: { width: '100%', backgroundColor: '#ff7f27', padding: 14, borderRadius: 4, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  unitContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  unitButton: { paddingHorizontal: 30, paddingVertical: 10, borderWidth: 1, borderColor: '#ff7f27', borderRadius: 4 },
  unitButtonActive: { backgroundColor: '#ff7f27' },
  unitText: { color: '#ff7f27', fontSize: 16, fontWeight: 'bold' },
  unitTextActive: { color: '#000' },
  errorContainer: { backgroundColor: '#ff000020', padding: 12, borderRadius: 4, marginBottom: 16, width: '100%' },
  errorText: { color: '#ff6b6b', textAlign: 'center' },
  imagePickerContainer: { marginBottom: 20, alignItems: 'center' },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#ff7f27' },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#333' },
  imagePlaceholderText: { color: '#888', marginTop: 8, fontSize: 12 },
})
