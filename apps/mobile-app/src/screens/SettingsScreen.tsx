import React, { useState, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AuthContext } from '../contexts/AuthContext'
import { SettingsScreenProps } from '../types/navigation'
import api from '../utils/api'
import { showToast, showConfirm } from '../utils/Toast'

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { logout } = useContext(AuthContext)
  const [isKg, setIsKg] = useState(true)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  const handleSaveProfile = async () => {
    try {
      await api.put('/users/profile', {
        height: Number(height),
        weight: Number(weight),
        unitPreference: isKg ? 'kg' : 'lbs'
      })
      showToast('프로필이 업데이트되었습니다.')
    } catch (error) {
      showToast('프로필 업데이트에 실패했습니다.')
    }
  }

  const handleDataSync = async () => {
    try {
      await api.post('/backup/sync')
      showToast('데이터 동기화가 완료되었습니다.')
    } catch (error) {
      showToast('데이터 동기화에 실패했습니다.')
    }
  }

  const handleDataDownload = async () => {
    try {
      const response = await api.get('/export/my-data')
      // 실제로는 파일 다운로드 로직 구현 필요
      showToast('데이터 다운로드가 시작되었습니다.')
    } catch (error) {
      showToast('데이터 다운로드에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    showConfirm(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      () => logout()
    )
  }

  const SettingItem = ({ 
    icon, 
    title, 
    onPress, 
    rightComponent 
  }: {
    icon: string
    title: string
    onPress?: () => void
    rightComponent?: React.ReactNode
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color="#ff7f27" />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {rightComponent || <Ionicons name="chevron-forward" size={20} color="#666" />}
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 설정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>프로필 설정</Text>
        
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>키 (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
            placeholder="170"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>몸무게 ({isKg ? 'kg' : 'lbs'})</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholder="70"
            placeholderTextColor="#666"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      {/* 단위 설정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>단위 설정</Text>
        <SettingItem
          icon="scale-outline"
          title="킬로그램/파운드"
          rightComponent={
            <Switch
              value={isKg}
              onValueChange={setIsKg}
              trackColor={{ false: '#333', true: '#ff7f27' }}
            />
          }
        />
      </View>

      {/* 운동 관련 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>운동</Text>
        <SettingItem
          icon="barbell-outline"
          title="모든 운동 목록"
          onPress={() => navigation.navigate('AllExercises')}
        />
      </View>

      {/* 데이터 관리 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>데이터 관리</Text>
        <SettingItem
          icon="sync-outline"
          title="데이터 동기화"
          onPress={handleDataSync}
        />
        <SettingItem
          icon="download-outline"
          title="데이터 다운로드"
          onPress={handleDataDownload}
        />
      </View>

      {/* 계정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <SettingItem
          icon="log-out-outline"
          title="로그아웃"
          onPress={handleLogout}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>버전 1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: '#ff7f27',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'right',
    minWidth: 60,
  },
  saveButton: {
    backgroundColor: '#ff7f27',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  version: {
    color: '#666',
    fontSize: 14,
  },
})