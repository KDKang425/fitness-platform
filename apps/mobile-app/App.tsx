import 'react-native-gesture-handler'
import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { View, ActivityIndicator } from 'react-native'
import { AuthProvider, AuthContext } from './src/contexts/AuthContext'
import AuthStack from './src/navigation/AuthStack'
import MainTabs from './src/navigation/MainTabs'
import { pushNotifications } from './src/services/pushNotifications'

function RootNavigator() {
  const { isLoading, isLoggedIn } = React.useContext(AuthContext)
  
  useEffect(() => {
    if (isLoggedIn) {
      // Initialize push notifications when user is logged in
      pushNotifications.initialize();
    }
    
    return () => {
      // Cleanup on unmount
      pushNotifications.cleanup();
    };
  }, [isLoggedIn]);
  
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
