import React, { useEffect, useState } from 'react'
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Text
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SocialScreenProps } from '../types/navigation'
import { Post } from '../types'
import api from '../utils/api'
import { showToast } from '../utils/Toast'

const { width } = Dimensions.get('window')
const imageSize = width / 3 - 2

export default function SocialScreen({ navigation }: SocialScreenProps) {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState<'all' | 'following'>('all')
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')

  useEffect(() => {
    fetchPosts()
  }, [filter, sort])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts/feed', {
        params: { filter, sort }
      })
      setPosts(response.data.posts || [])
    } catch (error) {
      // 더미 데이터로 대체
      const dummyPosts: Post[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        userId: i + 1,
        imageUrl: `https://picsum.photos/seed/${i + 1}/300/300`,
        caption: `피트니스 운동 ${i + 1}`,
        likesCount: Math.floor(Math.random() * 100),
        isLiked: Math.random() > 0.5,
        createdAt: new Date().toISOString()
      }))
      setPosts(dummyPosts)
    } finally {
      setLoading(false)
    }
  }

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PostDetail', { id: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
    </TouchableOpacity>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      {/* 필터 버튼 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            전체
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'following' && styles.filterButtonActive]}
          onPress={() => setFilter('following')}
        >
          <Text style={[styles.filterText, filter === 'following' && styles.filterTextActive]}>
            팔로잉
          </Text>
        </TouchableOpacity>
      </View>

      {/* 정렬 버튼 */}
      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortButton, sort === 'latest' && styles.sortButtonActive]}
          onPress={() => setSort('latest')}
        >
          <Text style={[styles.sortText, sort === 'latest' && styles.sortTextActive]}>
            최신순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sort === 'popular' && styles.sortButtonActive]}
          onPress={() => setSort('popular')}
        >
          <Text style={[styles.sortText, sort === 'popular' && styles.sortTextActive]}>
            인기순
          </Text>
        </TouchableOpacity>
      </View>
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
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>게시글이 없습니다.</Text>
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
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#333',
    marginRight: 8,
    borderRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: '#ff7f27',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  sortRow: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#222',
    marginRight: 8,
    borderRadius: 12,
  },
  sortButtonActive: {
    backgroundColor: '#ff7f27',
  },
  sortText: {
    color: '#ccc',
    fontSize: 12,
  },
  sortTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  postImage: {
    width: imageSize,
    height: imageSize,
    margin: 1,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
})