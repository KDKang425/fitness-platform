import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingIndexes1753000000000 implements MigrationInterface {
    name = 'AddMissingIndexes1753000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing index on workout_sets.exercise_id
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workout_sets_exercise_id" ON "workout_sets" ("exercise_id")`);
        
        // Add missing index on posts.workout_session_id
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_posts_workout_session_id" ON "posts" ("workout_session_id")`);
        
        // Note: personal_records already has a unique constraint on user_id + exercise_id in the entity definition
        
        // Add indexes for performance on frequently queried columns
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_workout_sessions_date" ON "workout_sessions" ("date")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_posts_created_at" ON "posts" ("created_at")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" ON "notifications" ("user_id", "read")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workout_sets_exercise_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_workout_session_id"`);
await queryRunner.query(`DROP INDEX IF EXISTS "IDX_workout_sessions_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
    }
}