import React, { useEffect, useState, useContext } from 'react'
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '../utils/api'

export default function PostDetailScreen({ route }: { route: any }) {
  const { id } = route.params
  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)

  const fetchPost = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/posts/${id}`)
      setPost(res.data)
      setLiked(res.data.liked)
      setLikes(res.data.likes)
    } catch {
      setPost({ imageUrl: `https://picsum.photos/id/${id}/600/600`, caption: '더미 게시글' })
      setLikes(23)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPost()
  }, [])

  const onLike = async () => {
    try {
      await api.post(`/posts/${id}/like`)
    } catch {}
    setLiked(!liked)
    setLikes(likes + (liked ? -1 : 1))
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: post.imageUrl }} style={styles.img} />
      <View style={styles.row}>
        <TouchableOpacity onPress={onLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color="#ff7f27" />
        </TouchableOpacity>
        <Text style={styles.likes}>{likes}</Text>
      </View>
      <Text style={styles.caption}>{post.caption}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#000', padding: 16 },
  img: { width: '100%', height: 360, borderRadius: 8, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  likes: { color: '#fff', marginLeft: 6, fontSize: 16 },
  caption: { color: '#fff', fontSize: 16 },
})
