import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Svg, { Path, Circle, Rect, Text as SvgText } from 'react-native-svg'

interface MuscleData {
  muscle: string
  volume: number
  percentage: number
}

interface MuscleVisualizationProps {
  muscleData: MuscleData[]
  showFront?: boolean
}

const MUSCLE_GROUPS: Record<string, { front: boolean; path?: string; paths?: any[]; label: string }> = {
  CHEST: { 
    front: true,
    path: 'M 35 30 Q 50 25 65 30 L 65 45 Q 50 50 35 45 Z',
    label: '가슴'
  },
  BACK: { 
    front: false,
    path: 'M 32 25 L 68 25 L 68 55 L 32 55 Z',
    label: '등'
  },
  SHOULDER: { 
    front: true,
    paths: [
      { type: 'circle', cx: 30, cy: 25, r: 8 },
      { type: 'circle', cx: 70, cy: 25, r: 8 }
    ],
    label: '어깨'
  },
  TRICEPS: { 
    front: false,
    paths: [
      { type: 'rect', x: 25, y: 35, width: 8, height: 15 },
      { type: 'rect', x: 67, y: 35, width: 8, height: 15 }
    ],
    label: '삼두'
  },
  BICEPS: { 
    front: true,
    paths: [
      { type: 'rect', x: 25, y: 35, width: 8, height: 15 },
      { type: 'rect', x: 67, y: 35, width: 8, height: 15 }
    ],
    label: '이두'
  },
  FOREARM: { 
    front: true,
    paths: [
      { type: 'rect', x: 20, y: 45, width: 8, height: 20 },
      { type: 'rect', x: 72, y: 45, width: 8, height: 20 }
    ],
    label: '전완'
  },
  ABS: { 
    front: true,
    path: 'M 45 40 L 55 40 L 55 60 L 45 60 Z',
    label: '복근'
  },
  GLUTES: { 
    front: false,
    path: 'M 37 55 Q 50 50 63 55 L 63 65 Q 50 70 37 65 Z',
    label: '둔근'
  },
  HAMSTRING: { 
    front: false,
    paths: [
      { type: 'rect', x: 40, y: 65, width: 10, height: 20 },
      { type: 'rect', x: 50, y: 65, width: 10, height: 20 }
    ],
    label: '햄스트링'
  },
  QUADRICEPS: { 
    front: true,
    paths: [
      { type: 'rect', x: 40, y: 60, width: 10, height: 25 },
      { type: 'rect', x: 50, y: 60, width: 10, height: 25 }
    ],
    label: '대퇴사두'
  },
  TRAPS: { 
    front: false,
    path: 'M 35 15 L 65 15 Q 65 25 50 25 Q 35 25 35 15 Z',
    label: '승모근'
  },
  CALVES: { 
    front: false,
    paths: [
      { type: 'rect', x: 40, y: 85, width: 8, height: 10 },
      { type: 'rect', x: 52, y: 85, width: 8, height: 10 }
    ],
    label: '종아리'
  },
}

export default function MuscleVisualization({ muscleData, showFront = true }: MuscleVisualizationProps) {
  const getOpacityForMuscle = (muscleName: string) => {
    const data = muscleData.find(d => d.muscle === muscleName)
    if (!data) return 0.1
    // Scale opacity from 0.2 to 1.0 based on percentage
    return 0.2 + (data.percentage / 100) * 0.8
  }

  const renderMuscle = (muscleName: string, muscleConfig: any) => {
    if (muscleConfig.front !== showFront) return null
    
    const opacity = getOpacityForMuscle(muscleName)
    const fillColor = `rgba(255, 127, 39, ${opacity})`

    if (muscleConfig.path) {
      return (
        <Path
          key={muscleName}
          d={muscleConfig.path}
          fill={fillColor}
          stroke="#ff7f27"
          strokeWidth="0.5"
        />
      )
    } else if (muscleConfig.paths) {
      return muscleConfig.paths.map((pathConfig: any, index: number) => {
        if (pathConfig.type === 'circle') {
          return (
            <Circle
              key={`${muscleName}-${index}`}
              cx={pathConfig.cx}
              cy={pathConfig.cy}
              r={pathConfig.r}
              fill={fillColor}
              stroke="#ff7f27"
              strokeWidth="0.5"
            />
          )
        } else if (pathConfig.type === 'rect') {
          return (
            <Rect
              key={`${muscleName}-${index}`}
              x={pathConfig.x}
              y={pathConfig.y}
              width={pathConfig.width}
              height={pathConfig.height}
              fill={fillColor}
              stroke="#ff7f27"
              strokeWidth="0.5"
            />
          )
        }
      })
    }
  }

  // Body outline
  const bodyOutline = showFront 
    ? 'M 50 10 Q 30 15 25 25 L 20 60 Q 15 65 20 70 L 25 95 L 35 95 L 40 75 L 50 70 L 60 75 L 65 95 L 75 95 L 80 70 Q 85 65 80 60 L 75 25 Q 70 15 50 10 Z'
    : 'M 50 10 Q 30 15 25 25 L 20 60 Q 15 65 20 70 L 25 95 L 35 95 L 40 75 L 50 70 L 60 75 L 65 95 L 75 95 L 80 70 Q 85 65 80 60 L 75 25 Q 70 15 50 10 Z'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{showFront ? '전면' : '후면'}</Text>
      <Svg width="200" height="250" viewBox="0 0 100 100" style={styles.svg}>
        {/* Body outline */}
        <Path
          d={bodyOutline}
          fill="none"
          stroke="#333"
          strokeWidth="1"
        />
        
        {/* Head */}
        <Circle
          cx={50}
          cy={12}
          r={8}
          fill="none"
          stroke="#333"
          strokeWidth="1"
        />
        
        {/* Render muscles */}
        {Object.entries(MUSCLE_GROUPS).map(([muscleName, config]) => 
          renderMuscle(muscleName, config)
        )}
      </Svg>
      
      {/* Legend */}
      <View style={styles.legend}>
        {muscleData
          .filter(d => d.percentage > 0)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5)
          .map((data, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { opacity: 0.2 + (data.percentage / 100) * 0.8 }]} />
              <Text style={styles.legendText}>
                {MUSCLE_GROUPS[data.muscle]?.label || data.muscle} ({data.percentage}%)
              </Text>
            </View>
          ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  svg: {
    marginBottom: 20,
  },
  legend: {
    width: '100%',
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 20,
    height: 20,
    backgroundColor: '#ff7f27',
    marginRight: 10,
    borderRadius: 4,
  },
  legendText: {
    color: '#fff',
    fontSize: 14,
  },
})