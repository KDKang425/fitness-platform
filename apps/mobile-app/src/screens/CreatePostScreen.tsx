import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SocialStackParamList } from '../types/navigation'
import api from '../utils/api'
import { showToast } from '../utils/Toast'

type Props = NativeStackScreenProps<SocialStackParamList, 'CreatePost'>

export default function CreatePostScreen({ navigation }: Props) {
  const [caption, setCaption] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectImage = () => {
    // 실제로는 이미지 피커 라이브러리 사용
    // 현재는 더미 이미지 사용
    const dummyImage = `https://picsum.photos/400/400?random=${Date.now()}`
    setImageUri(dummyImage)
  }

  const handlePost = async () => {
    if (!imageUri || !caption.trim()) {
      Alert.alert('알림', '이미지와 캡션을 모두 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      await api.post('/posts', {
        imageUrl: imageUri,
        content: caption.trim()
      })
      showToast('게시글이 업로드되었습니다.')
      navigation.goBack()
    } catch (error) {
      showToast('게시글 업로드에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* 이미지 선택 */}
      <TouchableOpacity style={styles.imageSection} onPress={selectImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷</Text>
            <Text style={styles.imagePlaceholderSubText}>이미지 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 캡션 입력 */}
      <TextInput
        style={styles.captionInput}
        placeholder="운동에 대한 이야기를 들려주세요..."
        placeholderTextColor="#666"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={300}
      />

      <Text style={styles.charCount}>{caption.length}/300</Text>

      {/* 게시 버튼 */}
      <TouchableOpacity 
        style={[styles.postButton, (!imageUri || !caption.trim()) && styles.postButtonDisabled]}
        onPress={handlePost}
        disabled={loading || !imageUri || !caption.trim()}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.postButtonText}>게시하기</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  imageSection: {
    height: 300,
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderSubText: {
    color: '#666',
    fontSize: 16,
  },
  captionInput: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 16,
  },
  postButton: {
    backgroundColor: '#ff7f27',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#333',
  },
  postButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
})