import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1747736796263 implements MigrationInterface {
    name = 'InitSchema1747736796263'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."muscle_enum" AS ENUM('CHEST', 'BACK', 'SHOULDER', 'TRICEPS', 'BICEPS', 'FOREARM', 'ABS', 'GLUTES', 'HAMSTRING', 'QUADRICEPS', 'TRAPS', 'CALVES')`);
        await queryRunner.query(`CREATE TYPE "public"."modality_enum" AS ENUM('CARDIO', 'BARBELL', 'DUMBBELL', 'BODYWEIGHT', 'MACHINE', 'CABLE', 'SMITH_MACHINE')`);
        await queryRunner.query(`CREATE TABLE "exercises" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "category" "public"."muscle_enum" NOT NULL, "modality" "public"."modality_enum" NOT NULL, "difficulty" character varying(50), "video_url" character varying(255), "image_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "exercises_name_key" UNIQUE ("name"), CONSTRAINT "PK_c4c46f5fa89a58ba7c2d894e3c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "routine_exercises" ("id" SERIAL NOT NULL, "exercise_order" integer, "default_sets" integer, "default_reps" integer, "default_weight" integer, "routine_id" integer NOT NULL, "exercise_id" integer NOT NULL, CONSTRAINT "routine_exercises_routine_id_exercise_id_key" UNIQUE ("routine_id", "exercise_id"), CONSTRAINT "PK_1e557a3e724e3497b89112bfd6b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "routines" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(255), "is_public" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "creator_id" integer, CONSTRAINT "PK_6847e8f0f74e65a6f10409dee9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" SERIAL NOT NULL, "image_url" character varying(255), "content" character varying(255), "likes_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "workout_session_id" integer, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "likes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "post_id" integer NOT NULL, CONSTRAINT "likes_user_id_post_id_key" UNIQUE ("user_id", "post_id"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "follows" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "follower_id" integer NOT NULL, "following_id" integer NOT NULL, CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "body_records" ("id" SERIAL NOT NULL, "date" date NOT NULL DEFAULT ('now'::text)::date, "weight" integer NOT NULL, "body_fat_percentage" integer, "skeletal_muscle_mass" integer, "user_id" integer NOT NULL, CONSTRAINT "PK_f0d2ca9b3f7b4f878d5a3051e11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "nickname" character varying(50) NOT NULL, "profile_image_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "users_nickname_key" UNIQUE ("nickname"), CONSTRAINT "users_email_key" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workout_sets" ("id" SERIAL NOT NULL, "set_number" integer NOT NULL, "reps" integer NOT NULL, "weight" integer NOT NULL, "volume" integer NOT NULL, "workout_session_id" integer NOT NULL, "exercise_id" integer NOT NULL, CONSTRAINT "PK_5ad75c97e58e8c660a48926d438" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workout_sessions" ("id" SERIAL NOT NULL, "date" date NOT NULL DEFAULT ('now'::text)::date, "start_time" TIMESTAMP, "end_time" TIMESTAMP, "total_time" integer, "total_volume" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "routine_id" integer, CONSTRAINT "PK_eea00e05dc78d40b55a588c9f57" PRIMARY KEY ("id"))`);
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
        await queryRunner.query(`DROP TABLE "workout_sessions"`);
        await queryRunner.query(`DROP TABLE "workout_sets"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "body_records"`);
        await queryRunner.query(`DROP TABLE "follows"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "routines"`);
        await queryRunner.query(`DROP TABLE "routine_exercises"`);
        await queryRunner.query(`DROP TABLE "exercises"`);
        await queryRunner.query(`DROP TYPE "public"."modality_enum"`);
        await queryRunner.query(`DROP TYPE "public"."muscle_enum"`);
    }

}
