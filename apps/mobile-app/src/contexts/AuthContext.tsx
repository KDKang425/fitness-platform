import React, { createContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type User = {
  id: number
  email: string
  nickname: string
  profileImageUrl?: string
  hasCompletedInitialSetup: boolean
}

type AuthState = {
  isLoading: boolean
  isLoggedIn: boolean
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  login: (at: string, rt: string, user: User) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  isLoading: true,
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const load = async () => {
      const at = await AsyncStorage.getItem('accessToken')
      const rt = await AsyncStorage.getItem('refreshToken')
      const userData = await AsyncStorage.getItem('user')
      if (at && userData) {
        setAccessToken(at)
        setRefreshToken(rt)
        setUser(JSON.parse(userData))
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const login = async (at: string, rt: string, userData: User) => {
    await AsyncStorage.setItem('accessToken', at)
    await AsyncStorage.setItem('refreshToken', rt)
    await AsyncStorage.setItem('user', JSON.stringify(userData))
    setAccessToken(at)
    setRefreshToken(rt)
    setUser(userData)
  }

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken')
    await AsyncStorage.removeItem('refreshToken')
    await AsyncStorage.removeItem('user')
    setAccessToken(null)
    setRefreshToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn: !!accessToken,
        accessToken,
        refreshToken,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
