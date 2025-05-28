import { WorkoutSet } from '../../workouts/entities/workout-set.entity';
import { MuscleGroup } from '../../exercises/entities/muscle-group.enum';

export type MuscleVolumeMap = Partial<Record<MuscleGroup, number>>;

export function aggregateVolumeByMuscle(
  sets: WorkoutSet[],
): MuscleVolumeMap {
  const totals: MuscleVolumeMap = {};

  for (const set of sets) {
    if (!set.exercise) continue;            
    const group = set.exercise.category;
    const vol = set.volume ?? set.reps * set.weight;
    totals[group] = (totals[group] ?? 0) + vol;
  }

  return totals;
}
