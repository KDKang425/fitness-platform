import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import ProfileSetupScreen from '../screens/ProfileSetupScreen'
import { AuthStackParamList } from '../types/navigation'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthStack({ initialRouteName = 'Login' }: { initialRouteName?: keyof AuthStackParamList }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  )
}