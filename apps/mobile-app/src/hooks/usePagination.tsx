import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { showToast } from '../utils/Toast'

interface PaginationOptions {
  limit?: number
  initialPage?: number
}

interface PaginationState<T> {
  data: T[]
  loading: boolean
  refreshing: boolean
  hasMore: boolean
  page: number
}

export function usePagination<T>(
  fetchFunction: (page: number, limit: number) => Promise<{ data: T[], hasMore: boolean }>,
  options: PaginationOptions = {}
) {
  const { limit = 20, initialPage = 1 } = options
  
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: initialPage,
  })
  
  const isMounted = useRef(true)
  
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  
  const loadData = useCallback(async (isRefresh = false) => {
    if (!isMounted.current) return
    
    if (state.loading || state.refreshing) return
    if (!isRefresh && !state.hasMore) return
    
    setState(prev => ({
      ...prev,
      loading: !isRefresh,
      refreshing: isRefresh,
    }))
    
    try {
      const nextPage = isRefresh ? 1 : state.page
      const result = await fetchFunction(nextPage, limit)
      
      if (!isMounted.current) return
      
      setState(prev => ({
        ...prev,
        data: isRefresh ? result.data : [...prev.data, ...result.data],
        hasMore: result.hasMore,
        page: isRefresh ? 2 : prev.page + 1,
        loading: false,
        refreshing: false,
      }))
    } catch (error) {
      if (!isMounted.current) return
      
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
      }))
      
      showToast('데이터를 불러오는데 실패했습니다.')
    }
  }, [state.loading, state.refreshing, state.hasMore, state.page, fetchFunction, limit])
  
  const refresh = useCallback(() => {
    loadData(true)
  }, [loadData])
  
  const loadMore = useCallback(() => {
    loadData(false)
  }, [loadData])
  
  // 초기 로드
  useEffect(() => {
    loadData(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    data: state.data,
    loading: state.loading,
    refreshing: state.refreshing,
    hasMore: state.hasMore,
    refresh,
    loadMore,
  }
}

// List Footer Component

interface ListFooterProps {
  loading: boolean
  hasMore: boolean
  emptyMessage?: string
  dataLength: number
}

export function ListFooter({ loading, hasMore, emptyMessage, dataLength }: ListFooterProps) {
  if (loading) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#ff7f27" />
      </View>
    )
  }
  
  if (dataLength === 0 && emptyMessage) {
    return (
      <View style={styles.footer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }
  
  if (!hasMore && dataLength > 0) {
    return (
      <View style={styles.footer}>
        <Text style={styles.endText}>더 이상 데이터가 없습니다</Text>
      </View>
    )
  }
  
  return null
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  endText: {
    color: '#666',
    fontSize: 14,
  },
})