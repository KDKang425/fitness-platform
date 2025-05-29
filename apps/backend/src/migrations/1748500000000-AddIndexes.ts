import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexes1748500000000 implements MigrationInterface {
    name = 'AddIndexes1748500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_workout_sessions_user_date" ON "workout_sessions" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sessions_user_start_time" ON "workout_sessions" ("user_id", "start_time")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_created_at" ON "posts" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_user_id" ON "posts" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_exercises_category" ON "exercises" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_exercises_modality" ON "exercises" ("modality")`);
        await queryRunner.query(`CREATE INDEX "IDX_routines_is_public" ON "routines" ("is_public")`);
        await queryRunner.query(`CREATE INDEX "IDX_follows_follower_id" ON "follows" ("follower_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_follows_following_id" ON "follows" ("following_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_workout_sessions_user_date"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sessions_user_start_time"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_exercises_category"`);
        await queryRunner.query(`DROP INDEX "IDX_exercises_modality"`);
        await queryRunner.query(`DROP INDEX "IDX_routines_is_public"`);
        await queryRunner.query(`DROP INDEX "IDX_follows_follower_id"`);
        await queryRunner.query(`DROP INDEX "IDX_follows_following_id"`);
    }
}