export function estimate1RM(weightKg: number, reps: number): number {
  if (!weightKg || !reps) return 0;
  if (reps === 1) return weightKg;
  // Using Brzycki formula: weight / (1.0278 - 0.0278 × reps)
  // This is more accurate for 1RM estimation than the linear formula
  return Math.round(weightKg / (1.0278 - 0.0278 * reps));
}
