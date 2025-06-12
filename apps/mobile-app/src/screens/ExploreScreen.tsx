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

type Routine = { id: string; title: string; subscribers: number; weeks: number }

export default function ExploreScreen({ navigation }: { navigation: any }) {
  const [sortBy, setSortBy] = useState<'popular' | 'trending'>('popular')
  
  const fetchRoutines = useCallback(async (page: number, limit: number) => {
    try {
      const { data } = await api.get('/routines', {
        params: { sort: sortBy, page, limit }
      })
      
      // 백엔드가 페이지네이션을 지원하지 않으면 전체 데이터를 반환
      if (Array.isArray(data)) {
        const start = (page - 1) * limit
        const end = start + limit
        const paginatedData = data.slice(start, end)
        return {
          data: paginatedData,
          hasMore: end < data.length
        }
      }
      
      // 백엔드가 페이지네이션 지원
      return {
        data: data.items || data,
        hasMore: data.hasMore || false
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
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.sub}>
        {item.weeks}주 · 구독 {item.subscribers}
      </Text>
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
            인기순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'trending' && styles.sortButtonActive]}
          onPress={() => setSortBy('trending')}
        >
          <Text style={[styles.sortText, sortBy === 'trending' && styles.sortTextActive]}>
            트렌드
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
  sub: { color: '#fff', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', marginTop: 24 },
})
