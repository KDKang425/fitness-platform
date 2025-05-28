import { IsInt, Min } from 'class-validator';
export class AddWorkoutSetDto {
  @IsInt() exerciseId: number;
  @IsInt() @Min(1) reps: number;
  @IsInt() @Min(1) weightKg: number;
}
