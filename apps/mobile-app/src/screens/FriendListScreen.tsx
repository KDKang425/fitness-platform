import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { SocialStackParamList } from '../types/navigation'
import { Friend } from '../types'
import api from '../utils/api'
import { showToast } from '../utils/Toast'

type Props = NativeStackScreenProps<SocialStackParamList, 'FriendList'>

export default function FriendListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/friends')
      setFriends(response.data)
    } catch (error) {
      // 더미 데이터
      const dummyFriends: Friend[] = [
        { id: 1, nickname: '헬스매니아', profileImage: 'https://picsum.photos/100/100?random=1', isFollowing: true },
        { id: 2, nickname: '근육왕', profileImage: 'https://picsum.photos/100/100?random=2', isFollowing: true },
        { id: 3, nickname: '피트니스러버', profileImage: 'https://picsum.photos/100/100?random=3', isFollowing: false },
      ]
      setFriends(dummyFriends)
    } finally {
      setLoading(false)
    }
  }

  const toggleFollow = async (friendId: number) => {
    try {
      const friend = friends.find(f => f.id === friendId)
      if (!friend) return

      if (friend.isFollowing) {
        await api.delete(`/users/follow/${friendId}`)
      } else {
        await api.post(`/users/follow/${friendId}`)
      }

      setFriends(prev => 
        prev.map(f => 
          f.id === friendId ? { ...f, isFollowing: !f.isFollowing } : f
        )
      )
    } catch (error) {
      showToast('작업을 완료할 수 없습니다.')
    }
  }

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <Image 
        source={{ uri: item.profileImage || 'https://picsum.photos/60/60?random=' + item.id }} 
        style={styles.profileImage} 
      />
      <View style={styles.friendInfo}>
        <Text style={styles.nickname}>{item.nickname}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing && styles.followingButton
        ]}
        onPress={() => toggleFollow(item.id)}
      >
        <Text style={[
          styles.followButtonText,
          item.isFollowing && styles.followingButtonText
        ]}>
          {item.isFollowing ? '팔로잉' : '팔로우'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFriend}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>친구가 없습니다.</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  list: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  nickname: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  followButton: {
    backgroundColor: '#ff7f27',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  followingButton: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#ff7f27',
  },
  followButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  followingButtonText: {
    color: '#ff7f27',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
})