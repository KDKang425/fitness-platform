import React, { createContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type AuthState = {
  isLoading: boolean
  isLoggedIn: boolean
  accessToken: string | null
  refreshToken: string | null
  login: (at: string, rt: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  isLoading: true,
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const at = await AsyncStorage.getItem('accessToken')
      const rt = await AsyncStorage.getItem('refreshToken')
      if (at) {
        setAccessToken(at)
        setRefreshToken(rt)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const login = async (at: string, rt: string) => {
    await AsyncStorage.setItem('accessToken', at)
    await AsyncStorage.setItem('refreshToken', rt)
    setAccessToken(at)
    setRefreshToken(rt)
  }

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken')
    await AsyncStorage.removeItem('refreshToken')
    setAccessToken(null)
    setRefreshToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn: !!accessToken,
        accessToken,
        refreshToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
