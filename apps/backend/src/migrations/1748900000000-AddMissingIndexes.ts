import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingIndexes1748900000000 implements MigrationInterface {
    name = 'AddMissingIndexes1748900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_workout_sets_user_exercise_date" ON "workout_sets" ("workout_session_id", "exercise_id", "set_number")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email_verified" ON "users" ("email_verified") WHERE "email_verified" = true`);
        await queryRunner.query(`CREATE INDEX "IDX_routine_exercises_routine_order" ON "routine_exercises" ("routine_id", "exercise_order")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "read") WHERE "read" = false`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sessions_month" ON "workout_sessions" ("user_id", "date") WHERE "end_time" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_workout_sessions_month"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX "IDX_routine_exercises_routine_order"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email_verified"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sets_user_exercise_date"`);
    }
}