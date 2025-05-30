import { NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

// Auth Stack
export type AuthStackParamList = {
  Login: undefined
  Signup: undefined
  ProfileSetup: undefined
}

// Home Stack
export type HomeStackParamList = {
  Home: undefined
  Settings: undefined
  ProgramStart: undefined
  FreeWorkout: undefined
  RoutineCreate: undefined
  WorkoutSession: { sessionId: number }
  ExerciseDetail: { exerciseId: number }
  AllExercises: undefined
}

// Record Stack
export type RecordStackParamList = {
  Record: undefined
  AddRecord: undefined
  WorkoutDetail: { id: number }
}

// Explore Stack
export type ExploreStackParamList = {
  Explore: undefined
  RoutineDetail: { id: number }
}

// Social Stack
export type SocialStackParamList = {
  Social: undefined
  PostDetail: { id: number }
  FriendList: undefined
  AddFriend: undefined
  CreatePost: undefined
}

// Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>
  Stats: undefined
  Record: NavigatorScreenParams<RecordStackParamList>
  Explore: NavigatorScreenParams<ExploreStackParamList>
  Social: NavigatorScreenParams<SocialStackParamList>
}

// Screen Props Types
export type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>
export type SettingsScreenProps = NativeStackScreenProps<HomeStackParamList, 'Settings'>
export type WorkoutSessionScreenProps = NativeStackScreenProps<HomeStackParamList, 'WorkoutSession'>
export type RecordScreenProps = NativeStackScreenProps<RecordStackParamList, 'Record'>
export type WorkoutDetailScreenProps = NativeStackScreenProps<RecordStackParamList, 'WorkoutDetail'>
export type SocialScreenProps = NativeStackScreenProps<SocialStackParamList, 'Social'>
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<AuthStackParamList, T>