import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SocialStackParamList } from '../types/navigation'
import { Friend } from '../types'
import api from '../utils/api'
import { showToast } from '../utils/Toast'

type Props = NativeStackScreenProps<SocialStackParamList, 'AddFriend'>

export default function AddFriendScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)

  const searchUsers = async () => {
    if (!searchQuery.trim()) return

    try {
      setLoading(true)
      const response = await api.get('/users/search', {
        params: { q: searchQuery }
      })
      setSearchResults(response.data)
    } catch (error) {
      showToast('검색에 실패했습니다.')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (userId: number) => {
    try {
      await api.post(`/friend-requests/${userId}`)
      showToast('친구 요청을 보냈습니다.')
    } catch (error) {
      showToast('친구 요청을 보낼 수 없습니다.')
    }
  }

  const renderUser = ({ item }: { item: Friend }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.nickname}>{item.nickname}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>친구 추가</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="닉네임으로 검색..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchUsers}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ff7f27" />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
            ) : (
              <Text style={styles.emptyText}>닉네임을 입력해서 친구를 찾아보세요.</Text>
            )
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#ff7f27',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  nickname: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#ff7f27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
})