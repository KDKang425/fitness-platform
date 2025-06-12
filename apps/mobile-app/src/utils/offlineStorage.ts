import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { showToast } from './Toast'

const OFFLINE_QUEUE_KEY = 'offline_workout_queue'
const OFFLINE_SESSIONS_KEY = 'offline_workout_sessions'
const OFFLINE_EXERCISES_KEY = 'offline_exercises_cache'

export interface OfflineWorkoutSet {
  tempId: string
  exerciseId: number
  weight: number
  reps: number
  createdAt: string
}

export interface OfflineWorkoutSession {
  tempId: string
  routineExerciseId?: number
  startedAt: string
  endedAt?: string
  sets: OfflineWorkoutSet[]
  synced: boolean
}

export interface OfflineRequest {
  id: string
  type: 'CREATE_SESSION' | 'ADD_SET' | 'UPDATE_SET' | 'DELETE_SET' | 'FINISH_SESSION'
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: any
  timestamp: string
}

class OfflineStorageService {
  private isOnline: boolean = true
  private syncInProgress: boolean = false

  constructor() {
    // Monitor network status
    NetInfo.addEventListener((state) => {
      this.isOnline = state.isConnected ?? false
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineData()
      }
    })
  }

  // Check if we're online
  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch()
    this.isOnline = state.isConnected ?? false
    return this.isOnline
  }

  // Save workout session locally
  async saveWorkoutSession(session: OfflineWorkoutSession): Promise<void> {
    try {
      const sessions = await this.getOfflineSessions()
      const index = sessions.findIndex(s => s.tempId === session.tempId)
      
      if (index >= 0) {
        sessions[index] = session
      } else {
        sessions.push(session)
      }
      
      await AsyncStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('Failed to save offline session:', error)
    }
  }

  // Get offline sessions
  async getOfflineSessions(): Promise<OfflineWorkoutSession[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_SESSIONS_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  // Add request to offline queue
  async addToQueue(request: Omit<OfflineRequest, 'id' | 'timestamp'>): Promise<void> {
    try {
      const queue = await this.getQueue()
      const newRequest: OfflineRequest = {
        ...request,
        id: `${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
      }
      
      queue.push(newRequest)
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
      
      if (!this.isOnline) {
        showToast('오프라인 모드: 데이터는 연결 시 동기화됩니다.')
      }
    } catch (error) {
      console.error('Failed to add to offline queue:', error)
    }
  }

  // Get offline queue
  async getQueue(): Promise<OfflineRequest[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  // Cache exercises for offline use
  async cacheExercises(exercises: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_EXERCISES_KEY, JSON.stringify(exercises))
    } catch (error) {
      console.error('Failed to cache exercises:', error)
    }
  }

  // Get cached exercises
  async getCachedExercises(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_EXERCISES_KEY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  // Sync offline data when connection is restored
  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return
    
    this.syncInProgress = true
    showToast('동기화 시작...')
    
    try {
      const queue = await this.getQueue()
      const sessions = await this.getOfflineSessions()
      
      // Process queued requests
      for (const request of queue) {
        try {
          // This would be replaced with actual API calls
          console.log('Syncing request:', request)
          // await api[request.method.toLowerCase()](request.endpoint, request.data)
        } catch (error) {
          console.error('Failed to sync request:', request.id, error)
        }
      }
      
      // Clear synced items
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]))
      
      // Mark sessions as synced
      const updatedSessions = sessions.map(s => ({ ...s, synced: true }))
      await AsyncStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(updatedSessions))
      
      showToast('동기화 완료!')
    } catch (error) {
      console.error('Sync failed:', error)
      showToast('동기화 실패. 나중에 다시 시도합니다.')
    } finally {
      this.syncInProgress = false
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        OFFLINE_QUEUE_KEY,
        OFFLINE_SESSIONS_KEY,
        OFFLINE_EXERCISES_KEY,
      ])
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
  }

  // Generate temporary ID
  generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export const offlineStorage = new OfflineStorageService()

// Hook for offline-capable workout sessions
import { useState, useEffect, useCallback } from 'react'
import api from './api'

export function useOfflineWorkout() {
  const [isOnline, setIsOnline] = useState(true)
  const [currentSession, setCurrentSession] = useState<OfflineWorkoutSession | null>(null)

  useEffect(() => {
    // Check connection status
    offlineStorage.checkConnection().then(setIsOnline)
    
    // Listen for connection changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false)
    })
    
    return unsubscribe
  }, [])

  const startWorkoutSession = useCallback(async (routineExerciseId?: number) => {
    const tempId = offlineStorage.generateTempId()
    const session: OfflineWorkoutSession = {
      tempId,
      routineExerciseId,
      startedAt: new Date().toISOString(),
      sets: [],
      synced: false,
    }
    
    if (isOnline) {
      try {
        const response = await api.post('/workouts/start', { routineExerciseId })
        session.tempId = response.data.id.toString()
        session.synced = true
      } catch (error) {
        console.error('Failed to start online session:', error)
      }
    } else {
      await offlineStorage.addToQueue({
        type: 'CREATE_SESSION',
        endpoint: '/workouts/start',
        method: 'POST',
        data: { routineExerciseId },
      })
    }
    
    await offlineStorage.saveWorkoutSession(session)
    setCurrentSession(session)
    
    return session
  }, [isOnline])

  const addSet = useCallback(async (exerciseId: number, weight: number, reps: number) => {
    if (!currentSession) return
    
    const tempSetId = offlineStorage.generateTempId()
    const newSet: OfflineWorkoutSet = {
      tempId: tempSetId,
      exerciseId,
      weight,
      reps,
      createdAt: new Date().toISOString(),
    }
    
    const updatedSession = {
      ...currentSession,
      sets: [...currentSession.sets, newSet],
    }
    
    if (isOnline && currentSession.synced) {
      try {
        const response = await api.post(`/workouts/${currentSession.tempId}/sets`, {
          exerciseId,
          weight,
          reps,
        })
        newSet.tempId = response.data.id.toString()
      } catch (error) {
        console.error('Failed to add set online:', error)
      }
    } else {
      await offlineStorage.addToQueue({
        type: 'ADD_SET',
        endpoint: `/workouts/${currentSession.tempId}/sets`,
        method: 'POST',
        data: { exerciseId, weight, reps },
      })
    }
    
    await offlineStorage.saveWorkoutSession(updatedSession)
    setCurrentSession(updatedSession)
  }, [currentSession, isOnline])

  const finishWorkout = useCallback(async () => {
    if (!currentSession) return
    
    const updatedSession = {
      ...currentSession,
      endedAt: new Date().toISOString(),
    }
    
    if (isOnline && currentSession.synced) {
      try {
        await api.patch(`/workouts/${currentSession.tempId}/finish`)
      } catch (error) {
        console.error('Failed to finish workout online:', error)
      }
    } else {
      await offlineStorage.addToQueue({
        type: 'FINISH_SESSION',
        endpoint: `/workouts/${currentSession.tempId}/finish`,
        method: 'PATCH',
      })
    }
    
    await offlineStorage.saveWorkoutSession(updatedSession)
    setCurrentSession(null)
  }, [currentSession, isOnline])

  return {
    isOnline,
    currentSession,
    startWorkoutSession,
    addSet,
    finishWorkout,
  }
}