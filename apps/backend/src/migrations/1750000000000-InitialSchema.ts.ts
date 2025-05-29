import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1750000000000 implements MigrationInterface {
    name = 'InitialSchema1750000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."muscle_enum" AS ENUM('CHEST', 'BACK', 'SHOULDER', 'TRICEPS', 'BICEPS', 'FOREARM', 'ABS', 'GLUTES', 'HAMSTRING', 'QUADRICEPS', 'TRAPS', 'CALVES')`);
        await queryRunner.query(`CREATE TYPE "public"."modality_enum" AS ENUM('CARDIO', 'BARBELL', 'DUMBBELL', 'BODYWEIGHT', 'MACHINE', 'CABLE', 'SMITH_MACHINE')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('workout_reminder', 'social', 'achievement', 'system')`);
        await queryRunner.query(`CREATE TYPE "public"."friend_request_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        
        await queryRunner.query(`CREATE TABLE "exercises" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "category" "public"."muscle_enum" NOT NULL, "modality" "public"."modality_enum" NOT NULL, "difficulty" character varying(50), "video_url" character varying(255), "image_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "exercises_name_key" UNIQUE ("name"), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "nickname" character varying(50) NOT NULL, "profile_image_url" character varying(255), "height" integer, "initial_weight" integer, "bench_press_1rm" integer, "squat_1rm" integer, "deadlift_1rm" integer, "overhead_press_1rm" integer, "has_completed_initial_setup" boolean NOT NULL DEFAULT false, "email_verified" boolean NOT NULL DEFAULT false, "email_verification_token" character varying, "email_verification_expiry" TIMESTAMP, "password_reset_token" character varying, "password_reset_expiry" TIMESTAMP, "password_reset_token_hash" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "fcm_token" character varying, "notifications_enabled" boolean NOT NULL DEFAULT true, "preferred_unit" character varying(3) NOT NULL DEFAULT 'kg', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "users_nickname_key" UNIQUE ("nickname"), CONSTRAINT "users_email_key" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "routines" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "creator_id" integer, CONSTRAINT "PK_6847e8f0f74e65a6f10409dee9f" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "routine_exercises" ("id" SERIAL NOT NULL, "exercise_order" integer, "default_sets" integer, "default_reps" integer, "default_weight" integer, "routine_id" integer NOT NULL, "exercise_id" integer NOT NULL, CONSTRAINT "routine_exercises_routine_id_exercise_id_key" UNIQUE ("routine_id", "exercise_id"), CONSTRAINT "PK_1e557a3e724e3497b89112bfd6b" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "workout_sessions" ("id" SERIAL NOT NULL, "date" date NOT NULL DEFAULT ('now'::text)::date, "start_time" TIMESTAMP, "end_time" TIMESTAMP, "total_time" integer, "total_volume" integer NOT NULL DEFAULT '0', "paused_intervals" jsonb, "total_paused_time" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "routine_id" integer, CONSTRAINT "PK_eea00e05dc78d40b55a588c9f57" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "workout_sets" ("id" SERIAL NOT NULL, "set_number" integer NOT NULL, "reps" integer NOT NULL, "weight" integer NOT NULL, "volume" integer NOT NULL, "workout_session_id" integer NOT NULL, "exercise_id" integer NOT NULL, CONSTRAINT "PK_5ad75c97e58e8c660a48926d438" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "body_records" ("id" SERIAL NOT NULL, "date" date NOT NULL DEFAULT ('now'::text)::date, "weight" integer NOT NULL, "body_fat_percentage" integer, "skeletal_muscle_mass" integer, "user_id" integer NOT NULL, CONSTRAINT "PK_f0d2ca9b3f7b4f878d5a3051e11" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "image_url" character varying(255), "content" character varying(255), "likes_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "workout_session_id" integer, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "likes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "post_id" integer NOT NULL, CONSTRAINT "likes_user_id_post_id_key" UNIQUE ("user_id", "post_id"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "follows" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "follower_id" integer NOT NULL, "following_id" integer NOT NULL, CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "routine_subscriptions" ("id" SERIAL NOT NULL, "subscribed_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "routine_id" integer NOT NULL, CONSTRAINT "UQ_user_routine" UNIQUE ("user_id", "routine_id"), CONSTRAINT "PK_routine_subscriptions" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "personal_records" ("id" SERIAL NOT NULL, "best_weight" integer NOT NULL, "best_reps" integer NOT NULL, "estimated1_rm" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "exercise_id" integer NOT NULL, CONSTRAINT "UQ_user_exercise" UNIQUE ("user_id", "exercise_id"), CONSTRAINT "PK_personal_records" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "body" character varying NOT NULL, "data" jsonb, "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "notification_settings" ("id" SERIAL NOT NULL, "workout_reminders" boolean NOT NULL DEFAULT true, "social_notifications" boolean NOT NULL DEFAULT true, "achievement_notifications" boolean NOT NULL DEFAULT true, "email_notifications" boolean NOT NULL DEFAULT true, "workout_reminder_times" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_2fd3770acdb67736f8f0a0d8ab" UNIQUE ("user_id"), CONSTRAINT "PK_978a6e267ff4c0c5c3d7912bba0" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "workout_templates" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "exercises" jsonb NOT NULL, "is_quick_start" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT false, "subscriber_count" integer NOT NULL DEFAULT '0', "usage_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_workout_templates" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "user_programs" ("id" SERIAL NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "start_date" date, "end_date" date, "completed_sessions" integer NOT NULL DEFAULT '0', "progress" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "routine_id" integer NOT NULL, CONSTRAINT "PK_user_programs" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "friend_requests" ("id" SERIAL NOT NULL, "status" "public"."friend_request_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "responded_at" TIMESTAMP, "requester_id" integer NOT NULL, "recipient_id" integer NOT NULL, CONSTRAINT "UQ_friend_request" UNIQUE ("requester_id", "recipient_id"), CONSTRAINT "PK_friend_requests" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "daily_stats" ("id" SERIAL NOT NULL, "date" date NOT NULL, "total_volume" integer NOT NULL DEFAULT '0', "session_count" integer NOT NULL DEFAULT '0', "set_count" integer NOT NULL DEFAULT '0', "total_time" integer NOT NULL DEFAULT '0', "muscle_volume" jsonb, "exercise_volume" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "UQ_user_date" UNIQUE ("user_id", "date"), CONSTRAINT "PK_daily_stats" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "routine_recommendations" ("id" SERIAL NOT NULL, "score" numeric(3,2) NOT NULL, "reason" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "routine_id" integer NOT NULL, CONSTRAINT "UQ_user_routine_recommendation" UNIQUE ("user_id", "routine_id"), CONSTRAINT "PK_routine_recommendations" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE INDEX "IDX_exercises_category" ON "exercises" ("category")`);
        await queryRunner.query(`CREATE INDEX "IDX_exercises_modality" ON "exercises" ("modality")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email_verified" ON "users" ("email_verified") WHERE "email_verified" = true`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sessions_user_date" ON "workout_sessions" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sessions_user_start_time" ON "workout_sessions" ("user_id", "start_time")`);
        await queryRunner.query(`CREATE INDEX "IDX_active_sessions" ON "workout_sessions" ("user_id") WHERE "end_time" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sessions_month" ON "workout_sessions" ("user_id", "date") WHERE "end_time" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sets_session_exercise" ON "workout_sets" ("workout_session_id", "exercise_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_sets_user_exercise_date" ON "workout_sets" ("workout_session_id", "exercise_id", "set_number")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_created_at" ON "posts" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_user_id" ON "posts" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_likes_count" ON "posts" ("likes_count" DESC) WHERE "created_at" >= NOW() - INTERVAL '7 days'`);
        await queryRunner.query(`CREATE INDEX "IDX_routines_is_public" ON "routines" ("is_public")`);
        await queryRunner.query(`CREATE INDEX "IDX_routine_exercises_routine_order" ON "routine_exercises" ("routine_id", "exercise_order")`);
        await queryRunner.query(`CREATE INDEX "IDX_follows_follower_id" ON "follows" ("follower_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_follows_following_id" ON "follows" ("following_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_routine_subscriptions_user" ON "routine_subscriptions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_routine_subscriptions_routine" ON "routine_subscriptions" ("routine_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_personal_records_user_1rm" ON "personal_records" ("user_id", "estimated1_rm" DESC)`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "read") WHERE "read" = false`);
        await queryRunner.query(`CREATE INDEX "IDX_body_records_user_date" ON "body_records" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_stats_user_date" ON "daily_stats" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_friend_requests_recipient_status" ON "friend_requests" ("recipient_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_programs_user_active" ON "user_programs" ("user_id", "is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_templates_user" ON "workout_templates" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_workout_templates_public" ON "workout_templates" ("is_public", "subscriber_count" DESC)`);
        
        await queryRunner.query(`ALTER TABLE "routine_exercises" ADD CONSTRAINT "FK_1e3257412b3f18b7db29584aaa6" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "routine_exercises" ADD CONSTRAINT "FK_a53b55c6c91fdff79bb92f6dbec" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "routines" ADD CONSTRAINT "FK_de9d20a6c5263b0d30bd9929430" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_77d5a7cdc76fe7df5e913092eb1" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_3f519ed95f775c781a254089171" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_54b5dc2739f2dea57900933db66" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "body_records" ADD CONSTRAINT "FK_7feb042c367bd64189d9527e5b0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_880094353cf9c9edb8033ca365a" FOREIGN KEY ("workout_session_id") REFERENCES "workout_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD CONSTRAINT "FK_9a3b700413f3f5c26ee17daabd1" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_sessions" ADD CONSTRAINT "FK_3a1ec9260afc530837db15579a5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_sessions" ADD CONSTRAINT "FK_286ccdc9341557e387ad6abe78b" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "routine_subscriptions" ADD CONSTRAINT "FK_sub_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "routine_subscriptions" ADD CONSTRAINT "FK_sub_routine" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "personal_records" ADD CONSTRAINT "FK_pr_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "personal_records" ADD CONSTRAINT "FK_pr_ex" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_settings" ADD CONSTRAINT "FK_2fd3770acdb67736f8f0a0d8ab4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_programs" ADD CONSTRAINT "FK_user_programs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_programs" ADD CONSTRAINT "FK_user_programs_routine" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_friend_requests_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_friend_requests_recipient" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "daily_stats" ADD CONSTRAINT "FK_daily_stats_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "workout_templates" ADD CONSTRAINT "FK_workout_templates_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "routine_recommendations" ADD CONSTRAINT "FK_routine_recommendations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "routine_recommendations" ADD CONSTRAINT "FK_routine_recommendations_routine" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "routine_recommendations" DROP CONSTRAINT "FK_routine_recommendations_routine"`);
        await queryRunner.query(`ALTER TABLE "routine_recommendations" DROP CONSTRAINT "FK_routine_recommendations_user"`);
        await queryRunner.query(`ALTER TABLE "workout_templates" DROP CONSTRAINT "FK_workout_templates_user"`);
        await queryRunner.query(`ALTER TABLE "daily_stats" DROP CONSTRAINT "FK_daily_stats_user"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_recipient"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_requester"`);
        await queryRunner.query(`ALTER TABLE "user_programs" DROP CONSTRAINT "FK_user_programs_routine"`);
        await queryRunner.query(`ALTER TABLE "user_programs" DROP CONSTRAINT "FK_user_programs_user"`);
        await queryRunner.query(`ALTER TABLE "notification_settings" DROP CONSTRAINT "FK_2fd3770acdb67736f8f0a0d8ab4"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "personal_records" DROP CONSTRAINT "FK_pr_ex"`);
        await queryRunner.query(`ALTER TABLE "personal_records" DROP CONSTRAINT "FK_pr_user"`);
        await queryRunner.query(`ALTER TABLE "routine_subscriptions" DROP CONSTRAINT "FK_sub_routine"`);
        await queryRunner.query(`ALTER TABLE "routine_subscriptions" DROP CONSTRAINT "FK_sub_user"`);
        await queryRunner.query(`ALTER TABLE "workout_sessions" DROP CONSTRAINT "FK_286ccdc9341557e387ad6abe78b"`);
        await queryRunner.query(`ALTER TABLE "workout_sessions" DROP CONSTRAINT "FK_3a1ec9260afc530837db15579a5"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_9a3b700413f3f5c26ee17daabd1"`);
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP CONSTRAINT "FK_880094353cf9c9edb8033ca365a"`);
        await queryRunner.query(`ALTER TABLE "body_records" DROP CONSTRAINT "FK_7feb042c367bd64189d9527e5b0"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_54b5dc2739f2dea57900933db66"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_741df9b9b72f328a6d6f63e79ff"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_3f519ed95f775c781a254089171"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_77d5a7cdc76fe7df5e913092eb1"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`ALTER TABLE "routines" DROP CONSTRAINT "FK_de9d20a6c5263b0d30bd9929430"`);
        await queryRunner.query(`ALTER TABLE "routine_exercises" DROP CONSTRAINT "FK_a53b55c6c91fdff79bb92f6dbec"`);
        await queryRunner.query(`ALTER TABLE "routine_exercises" DROP CONSTRAINT "FK_1e3257412b3f18b7db29584aaa6"`);
        
        await queryRunner.query(`DROP INDEX "IDX_workout_templates_public"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_templates_user"`);
        await queryRunner.query(`DROP INDEX "IDX_user_programs_user_active"`);
        await queryRunner.query(`DROP INDEX "IDX_friend_requests_recipient_status"`);
        await queryRunner.query(`DROP INDEX "IDX_daily_stats_user_date"`);
        await queryRunner.query(`DROP INDEX "IDX_body_records_user_date"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_personal_records_user_1rm"`);
        await queryRunner.query(`DROP INDEX "IDX_routine_subscriptions_routine"`);
        await queryRunner.query(`DROP INDEX "IDX_routine_subscriptions_user"`);
        await queryRunner.query(`DROP INDEX "IDX_follows_following_id"`);
        await queryRunner.query(`DROP INDEX "IDX_follows_follower_id"`);
        await queryRunner.query(`DROP INDEX "IDX_routine_exercises_routine_order"`);
        await queryRunner.query(`DROP INDEX "IDX_routines_is_public"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_likes_count"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sets_user_exercise_date"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sets_session_exercise"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sessions_month"`);
        await queryRunner.query(`DROP INDEX "IDX_active_sessions"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sessions_user_start_time"`);
        await queryRunner.query(`DROP INDEX "IDX_workout_sessions_user_date"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email_verified"`);
        await queryRunner.query(`DROP INDEX "IDX_exercises_modality"`);
        await queryRunner.query(`DROP INDEX "IDX_exercises_category"`);
        
        await queryRunner.query(`DROP TABLE "routine_recommendations"`);
        await queryRunner.query(`DROP TABLE "daily_stats"`);
        await queryRunner.query(`DROP TABLE "friend_requests"`);
        await queryRunner.query(`DROP TABLE "user_programs"`);
        await queryRunner.query(`DROP TABLE "workout_templates"`);
        await queryRunner.query(`DROP TABLE "notification_settings"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "personal_records"`);
        await queryRunner.query(`DROP TABLE "routine_subscriptions"`);
        await queryRunner.query(`DROP TABLE "follows"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "body_records"`);
        await queryRunner.query(`DROP TABLE "workout_sets"`);
        await queryRunner.query(`DROP TABLE "workout_sessions"`);
        await queryRunner.query(`DROP TABLE "routine_exercises"`);
        await queryRunner.query(`DROP TABLE "routines"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "exercises"`);
        
        await queryRunner.query(`DROP TYPE "public"."friend_request_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."modality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."muscle_enum"`);
    }
}