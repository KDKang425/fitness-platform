import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Ionicons from '@expo/vector-icons/Ionicons'
import { View } from 'react-native'

import SocialScreen from '../screens/SocialScreen'
import PostDetailScreen from '../screens/PostDetailScreen'
import FriendListScreen from '../screens/FriendListScreen'
import AddFriendScreen from '../screens/AddFriendScreen'
import CreatePostScreen from '../screens/CreatePostScreen'
import { SocialStackParamList } from '../types/navigation'

const Stack = createNativeStackNavigator<SocialStackParamList>()

export default function SocialStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#000' }, 
        headerTintColor: '#ff7f27'
      }}
    >
      <Stack.Screen 
        name="Social" 
        component={SocialScreen} 
        options={({ navigation }) => ({
          title: '소셜',
          headerRight: () => (
            <View style={{ flexDirection: 'row', marginRight: 12 }}>
              <Ionicons
                name="person-outline"
                size={24}
                color="#ff7f27"
                onPress={() => navigation.navigate('FriendList')}
                style={{ marginRight: 16 }}
              />
              <Ionicons
                name="person-add-outline"
                size={24}
                color="#ff7f27"
                onPress={() => navigation.navigate('AddFriend')}
                style={{ marginRight: 16 }}
              />
              <Ionicons
                name="add"
                size={28}
                color="#ff7f27"
                onPress={() => navigation.navigate('CreatePost')}
              />
            </View>
          ),
        })}
      />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: '게시글' }} />
      <Stack.Screen name="FriendList" component={FriendListScreen} options={{ title: '친구 목록' }} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} options={{ title: '친구 추가' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: '게시글 작성' }} />
    </Stack.Navigator>
  )
}