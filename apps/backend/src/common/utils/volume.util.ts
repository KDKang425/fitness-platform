export const calcVolume = (reps: number, weightKg: number): number => {
  if (!reps || !weightKg) return 0;
  return reps * weightKg;
};