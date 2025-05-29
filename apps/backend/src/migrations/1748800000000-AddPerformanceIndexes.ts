import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1748800000000 implements MigrationInterface {
    name = 'AddPerformanceIndexes1748800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_workout_sets_session_exercise" ON "workout_sets" ("workout_session_id", "exercise_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_personal_records_user_1rm" ON "personal_records" ("user_id", "estimated1_rm" DESC)`);
        await queryRunner.query(`CREATE INDEX "IDX_active_sessions" ON "workout_sessions" ("user_id") WHERE "end_time" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_body_records_user_date" ON "body_records" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_likes_count" ON "posts" ("likes_count" DESC) WHERE "created_at" >= NOW() - INTERVAL '7 days'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_posts_likes_count"`);
        await queryRunner.query(`DROP INDEX "IDX_body_records_user_date"`);
        await queryRunner.query(`DROP INDEX "IDX_active_sessions"`);
        await queryRunner.query(`DROP INDEX "IDX_personal_records_user_1rm"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sets_session_exercise"`);
    }
}