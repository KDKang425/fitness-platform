import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api from '../utils/api'
import Loader from '../components/Loader'
import { showToast } from '../utils/Toast'
import { usePagination, ListFooter } from '../hooks/usePagination'

type Routine = { 
  id: number; 
  name: string; 
  description?: string; 
  isPublic: boolean;
  creator?: { id: number; nickname: string };
  subscriberCount?: number;
  weeks?: number;
}

export default function ExploreScreen({ navigation }: { navigation: any }) {
  const [sortBy, setSortBy] = useState<'popular' | 'trending'>('popular')
  
  const fetchRoutines = useCallback(async (page: number, limit: number) => {
    try {
      const { data } = await api.get('/routines', {
        params: { sort: sortBy, page, limit }
      })
      
      // 백엔드 응답 구조에 맞게 처리
      return {
        data: data.routines || [],
        hasMore: data.pagination ? page < data.pagination.totalPages : false
      }
    } catch (error) {
      throw error
    }
  }, [sortBy])
  
  const { data, loading, refreshing, hasMore, refresh, loadMore } = usePagination<Routine>(
    fetchRoutines,
    { limit: 10 }
  )
  
  // 정렬 변경 시 리프레시
  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [sortBy])
  )
  
  if (loading && data.length === 0) return <Loader />

  const renderItem = ({ item }: { item: Routine }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('RoutineDetail', { id: item.id })}
    >
      <View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.sub}>
          {item.creator?.nickname || 'Unknown'}
          {item.weeks && ` · ${item.weeks}주`}
          {item.subscriberCount !== undefined && ` · 구독 ${item.subscriberCount}`}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* 정렬 버튼 */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'popular' && styles.sortButtonActive]}
          onPress={() => setSortBy('popular')}
        >
          <Text style={[styles.sortText, sortBy === 'popular' && styles.sortTextActive]}>
            구독자 많은 순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'trending' && styles.sortButtonActive]}
          onPress={() => setSortBy('trending')}
        >
          <Text style={[styles.sortText, sortBy === 'trending' && styles.sortTextActive]}>
            트렌드 (3개월)
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={data}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#ff7f27"
          />
        }
        ListFooterComponent={
          <ListFooter
            loading={loading}
            hasMore={hasMore}
            dataLength={data.length}
            emptyMessage="표시할 루틴이 없습니다."
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  sortButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  sortButtonActive: {
    backgroundColor: '#ff7f27',
  },
  sortText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  sortTextActive: {
    color: '#000',
  },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  item: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { color: '#ff7f27', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  sub: { color: '#888', fontSize: 14, marginBottom: 4 },
  description: { color: '#fff', fontSize: 14, opacity: 0.8 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
})
