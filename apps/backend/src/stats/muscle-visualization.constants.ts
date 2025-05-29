export const MUSCLE_VISUALIZATION_MAP = {
  CHEST: { 
    front: true, 
    x: 50, 
    y: 30, 
    width: 30, 
    height: 20,
    svg: 'M 35 30 Q 50 25 65 30 L 65 45 Q 50 50 35 45 Z'
  },
  BACK: { 
    front: false, 
    x: 50, 
    y: 35, 
    width: 35, 
    height: 30,
    svg: 'M 32 25 L 68 25 L 68 55 L 32 55 Z'
  },
  SHOULDER: { 
    front: {
      left: { x: 30, y: 25, r: 8 },
      right: { x: 70, y: 25, r: 8 }
    },
    back: {
      left: { x: 30, y: 25, r: 8 },
      right: { x: 70, y: 25, r: 8 }
    }
  },
  TRICEPS: { 
    front: false,
    left: { x: 25, y: 35, width: 8, height: 15 },
    right: { x: 67, y: 35, width: 8, height: 15 }
  },
  BICEPS: { 
    front: true,
    left: { x: 25, y: 35, width: 8, height: 15 },
    right: { x: 67, y: 35, width: 8, height: 15 }
  },
  FOREARM: { 
    front: true,
    left: { x: 20, y: 45, width: 8, height: 20 },
    right: { x: 72, y: 45, width: 8, height: 20 }
  },
  ABS: { 
    front: true, 
    x: 50, 
    y: 45, 
    width: 20, 
    height: 20,
    svg: 'M 45 40 L 55 40 L 55 60 L 45 60 Z'
  },
  GLUTES: { 
    front: false, 
    x: 50, 
    y: 55, 
    width: 25, 
    height: 15,
    svg: 'M 37 55 Q 50 50 63 55 L 63 65 Q 50 70 37 65 Z'
  },
  HAMSTRING: { 
    front: false,
    left: { x: 40, y: 65, width: 10, height: 20 },
    right: { x: 60, y: 65, width: 10, height: 20 }
  },
  QUADRICEPS: { 
    front: true,
    left: { x: 40, y: 60, width: 10, height: 25 },
    right: { x: 60, y: 60, width: 10, height: 25 }
  },
  TRAPS: { 
    front: false, 
    x: 50, 
    y: 20, 
    width: 30, 
    height: 10,
    svg: 'M 35 15 L 65 15 Q 65 25 50 25 Q 35 25 35 15 Z'
  },
  CALVES: { 
    front: false,
    left: { x: 40, y: 85, width: 8, height: 10 },
    right: { x: 60, y: 85, width: 8, height: 10 }
  },
};

export const getMuscleVisualizationData = (muscleGroup: string) => {
  return MUSCLE_VISUALIZATION_MAP[muscleGroup] || null;
};