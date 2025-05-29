import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import RecordScreen from '../screens/RecordScreen'
import AddRecordScreen from '../screens/AddRecordScreen'
import Ionicons from '@expo/vector-icons/Ionicons'

export type RecordStackParamList = {
  Record: undefined
  AddRecord: undefined
}

const Stack = createNativeStackNavigator<RecordStackParamList>()

export default function RecordStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#ff7f27',
      }}
    >
      <Stack.Screen
        name="Record"
        component={RecordScreen}
        options={({ navigation }) => ({
          title: '기록',
          headerRight: () => (
            <Ionicons
              name="add"
              size={28}
              color="#ff7f27"
              onPress={() => navigation.navigate('AddRecord')}
              style={{ marginRight: 12 }}
            />
          ),
        })}
      />
      <Stack.Screen name="AddRecord" component={AddRecordScreen} options={{ title: '기록 추가' }} />
    </Stack.Navigator>
  )
}
