import { Platform, ToastAndroid, Alert } from 'react-native'

export function showToast(message: string, duration: 'SHORT' | 'LONG' = 'SHORT') {
  if (Platform.OS === 'android') {
    const toastDuration = duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG
    ToastAndroid.show(message, toastDuration)
  } else {
    // iOS에서는 Alert 사용
    Alert.alert('알림', message)
  }
}

export function showError(title: string, message: string) {
  Alert.alert(title, message)
}

export function showConfirm(
  title: string, 
  message: string, 
  onConfirm: () => void,
  onCancel?: () => void
) {
  Alert.alert(
    title,
    message,
    [
      { text: '취소', style: 'cancel', onPress: onCancel },
      { text: '확인', onPress: onConfirm }
    ]
  )
}