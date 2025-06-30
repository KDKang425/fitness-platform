export interface User {
  id: number
  email: string
  nickname: string
  profileImageUrl?: string
  height?: number
  weight?: number
  benchPress1RM?: number
  squat1RM?: number
  deadlift1RM?: number
  overheadPress1RM?: number
  hasCompletedInitialSetup?: boolean
  unitPreference?: 'kg' | 'lbs'
}

export interface Exercise {
  id: number
  name: string
  category: string
  muscle: MuscleGroup
  type: ExerciseType
  youtubeUrl?: string
}

export interface WorkoutSet {
  id: number
  exerciseId: number
  weight: number
  reps: number
  completed?: boolean
}

export interface WorkoutSession {
  id: number
  startedAt: string
  endedAt?: string
  duration?: number
  type: 'program' | 'free'
  paused: boolean
  sets: WorkoutSet[]
}

export interface Routine {
  id: number
  title: string
  description: string
  weeks: number
  exercises: Exercise[]
  subscribers: number
  isSubscribed?: boolean
}

export interface Post {
  id: number
  userId: number
  imageUrl: string
  caption: string
  likesCount: number
  isLiked: boolean
  createdAt: string
}

export interface Friend {
  id: number
  nickname: string
  profileImage?: string
  isFollowing: boolean
}

export type MuscleGroup = 
  | 'CHEST' | 'BACK' | 'SHOULDER' | 'TRICEPS' | 'BICEPS' 
  | 'FOREARM' | 'ABS' | 'GLUTES' | 'HAMSTRING' | 'QUADRICEPS' 
  | 'TRAPS' | 'CALVES'

export type ExerciseType = 
  | 'CARDIO' | 'BARBELL' | 'DUMBBELL' | 'BODYWEIGHT' 
  | 'MACHINE' | 'CABLE' | 'SMITH_MACHINE'

export interface StatsData {
  totalVolume: number
  muscleVolumes: Record<MuscleGroup, number>
  weeklyComparison: {
    current: number
    previous: number
    change: number
    changePercent: number
  }
}