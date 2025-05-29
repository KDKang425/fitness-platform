import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Ionicons from '@expo/vector-icons/Ionicons'

import HomeScreen from '../screens/HomeScreen'
import SettingsScreen from '../screens/SettingsScreen'
import ProgramStartScreen from '../screens/ProgramStartScreen'
import FreeWorkoutScreen from '../screens/FreeWorkoutScreen'
import RoutineCreateScreen from '../screens/RoutineCreateScreen'
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen'

export type HomeStackParamList = {
  Home: undefined
  Settings: undefined
  ProgramStart: undefined
  FreeWorkout: undefined
  RoutineCreate: undefined
  WorkoutSession: { sessionId: number }
}

const Stack = createNativeStackNavigator<HomeStackParamList>()

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#ff7f27',
      }}
    >
      {/* 홈 */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: '홈',
          headerRight: () => (
            <Ionicons
              name="settings-outline"
              size={24}
              color="#ff7f27"
              onPress={() => navigation.navigate('Settings')}
              style={{ marginRight: 12 }}
            />
          ),
        })}
      />

      {/* 설정 */}
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '설정' }} />

      {/* 프로그램 / 자유 운동 시작 */}
      <Stack.Screen name="ProgramStart" component={ProgramStartScreen} options={{ title: '프로그램 시작' }} />
      <Stack.Screen name="FreeWorkout"   component={FreeWorkoutScreen}   options={{ title: '자유 운동'     }} />

      {/* 루틴 생성 */}
      <Stack.Screen name="RoutineCreate" component={RoutineCreateScreen} options={{ title: '루틴 생성' }} />

      {/* 🎯 새로 추가 – 실제 운동 세션 진행 화면 */}
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}
