import 'react-native-gesture-handler'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { View, ActivityIndicator } from 'react-native'
import { AuthProvider, AuthContext } from './src/contexts/AuthContext'
import AuthStack from './src/navigation/AuthStack'
import MainTabs from './src/navigation/MainTabs'

function RootNavigator() {
  const { isLoading, isLoggedIn } = React.useContext(AuthContext)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#ff7f27" />
      </View>
    )
  }
  return isLoggedIn ? <MainTabs /> : <AuthStack />
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
