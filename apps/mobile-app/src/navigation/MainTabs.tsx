import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Ionicons from '@expo/vector-icons/Ionicons'
import HomeStack from './HomeStack'
import StatsScreen from '../screens/StatsScreen'
import RecordStack from './RecordStack'
import ExploreStack from './ExploreStack'
import SocialStack from './SocialStack'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000' },
        tabBarActiveTintColor: '#ff7f27',
        tabBarInactiveTintColor: '#666',
        tabBarIcon: ({ color, size }) => {
          const m = { Home: 'home', Stats: 'stats-chart', Record: 'calendar', Explore: 'compass', Social: 'image' } as any
          return <Ionicons name={m[route.name]} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Record" component={RecordStack} />
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Social" component={SocialStack} />
    </Tab.Navigator>
  )
}
