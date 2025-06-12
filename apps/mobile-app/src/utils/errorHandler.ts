import { Alert } from 'react-native'
import { showToast } from './Toast'

export interface AppError {
  message: string
  code?: string
  statusCode?: number
  field?: string
}

export class ErrorHandler {
  static handle(error: any, showAlert: boolean = false): AppError {
    let appError: AppError = {
      message: '알 수 없는 오류가 발생했습니다.',
    }

    // API 에러 처리
    if (error.response) {
      const { status, data } = error.response
      appError.statusCode = status

      switch (status) {
        case 400:
          appError.message = data.message || '잘못된 요청입니다.'
          appError.code = 'BAD_REQUEST'
          break
        case 401:
          appError.message = '로그인이 필요합니다.'
          appError.code = 'UNAUTHORIZED'
          // TODO: 자동 로그아웃 처리
          break
        case 403:
          appError.message = '권한이 없습니다.'
          appError.code = 'FORBIDDEN'
          break
        case 404:
          appError.message = '요청한 정보를 찾을 수 없습니다.'
          appError.code = 'NOT_FOUND'
          break
        case 409:
          appError.message = data.message || '중복된 요청입니다.'
          appError.code = 'CONFLICT'
          break
        case 422:
          appError.message = data.message || '입력값을 확인해주세요.'
          appError.code = 'VALIDATION_ERROR'
          if (data.errors && Array.isArray(data.errors)) {
            appError.message = data.errors[0].message || appError.message
            appError.field = data.errors[0].field
          }
          break
        case 500:
          appError.message = '서버 오류가 발생했습니다.'
          appError.code = 'SERVER_ERROR'
          break
        default:
          appError.message = data.message || '요청 처리 중 오류가 발생했습니다.'
      }
    } else if (error.request) {
      // 네트워크 에러
      appError.message = '네트워크 연결을 확인해주세요.'
      appError.code = 'NETWORK_ERROR'
    } else {
      // 기타 에러
      appError.message = error.message || '오류가 발생했습니다.'
      appError.code = 'UNKNOWN_ERROR'
    }

    // 에러 로깅 (프로덕션에서는 Sentry 등으로 전송)
    console.error('Error:', appError)

    // UI 피드백
    if (showAlert) {
      Alert.alert('오류', appError.message)
    } else {
      showToast(appError.message)
    }

    return appError
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    showAlert: boolean = false
  ): Promise<[T | null, AppError | null]> {
    try {
      const result = await promise
      return [result, null]
    } catch (error) {
      const appError = ErrorHandler.handle(error, showAlert)
      return [null, appError]
    }
  }
}

// 커스텀 훅
import { useState, useCallback } from 'react'

export function useError() {
  const [error, setError] = useState<AppError | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async <T,>(
    promise: Promise<T>,
    options?: { showAlert?: boolean; onError?: (error: AppError) => void }
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    const [result, err] = await ErrorHandler.handleAsync(promise, options?.showAlert)
    
    if (err) {
      setError(err)
      options?.onError?.(err)
    }

    setLoading(false)
    return result
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, loading, execute, clearError }
}