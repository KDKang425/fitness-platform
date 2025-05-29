import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ExploreScreen from '../screens/ExploreScreen'
import RoutineDetailScreen from '../screens/RoutineDetailScreen'

export type ExploreStackParamList = {
  Explore: undefined
  RoutineDetail: { id: string }
}

const Stack = createNativeStackNavigator<ExploreStackParamList>()

export default function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#000' }, headerTintColor: '#ff7f27' }}>
      <Stack.Screen name="Explore" component={ExploreScreen} options={{ title: '탐색' }} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ title: '루틴 상세' }} />
    </Stack.Navigator>
  )
}
