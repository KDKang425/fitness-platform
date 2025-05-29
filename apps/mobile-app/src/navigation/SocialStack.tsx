import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SocialScreen from '../screens/SocialScreen'
import PostDetailScreen from '../screens/PostDetailScreen'

export type SocialStackParamList = {
  Social: undefined
  PostDetail: { id: string }
}

const Stack = createNativeStackNavigator<SocialStackParamList>()

export default function SocialStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#000' }, headerTintColor: '#ff7f27' }}>
      <Stack.Screen name="Social" component={SocialScreen} options={{ title: '소셜' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '게시글' }} />
    </Stack.Navigator>
  )
}
