import React, { useEffect, useState } from 'react'
import { View, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator, StyleSheet } from 'react-native'
import api from '../utils/api'

const size = Dimensions.get('window').width / 3 - 2

type Post = { id: string; imageUrl: string }

export default function SocialScreen({ navigation }: { navigation: any }) {
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/posts?feed=all')
      setPosts(res.data)
    } catch {
      setPosts(
        Array.from({ length: 15 }).map((_, i) => ({
          id: String(i + 1),
          imageUrl: `https://picsum.photos/seed/${i + 1}/300/300`,
        })),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { id: item.id })}>
      <Image source={{ uri: item.imageUrl }} style={styles.img} />
    </TouchableOpacity>
  )

  return <FlatList data={posts} keyExtractor={p => p.id} renderItem={renderItem} numColumns={3} />
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  img: { width: size, height: size, margin: 1 },
})
