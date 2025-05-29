import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkoutSessionPauseFields1748700000000 implements MigrationInterface {
    name = 'AddWorkoutSessionPauseFields1748700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_sessions" ADD "paused_intervals" jsonb`);
        await queryRunner.query(`ALTER TABLE "workout_sessions" ADD "total_paused_time" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_sessions" DROP COLUMN "total_paused_time"`);
        await queryRunner.query(`ALTER TABLE "workout_sessions" DROP COLUMN "paused_intervals"`);
    }
}