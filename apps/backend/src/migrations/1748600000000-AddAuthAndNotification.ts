import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthAndNotification1748600000000 implements MigrationInterface {
    name = 'AddAuthAndNotification1748600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verification_expiry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_reset_expiry" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fcm_token" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "notifications_enabled" boolean NOT NULL DEFAULT true`);
        
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('workout_reminder', 'social', 'achievement', 'system')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying NOT NULL, "body" character varying NOT NULL, "data" jsonb, "read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9a8a82462cab47c73d25f49261f" ON "notifications" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at") `);
        
        await queryRunner.query(`CREATE TABLE "notification_settings" ("id" SERIAL NOT NULL, "workout_reminders" boolean NOT NULL DEFAULT true, "social_notifications" boolean NOT NULL DEFAULT true, "achievement_notifications" boolean NOT NULL DEFAULT true, "email_notifications" boolean NOT NULL DEFAULT true, "workout_reminder_times" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_2fd3770acdb67736f8f0a0d8ab" UNIQUE ("user_id"), CONSTRAINT "PK_978a6e267ff4c0c5c3d7912bba0" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_settings" ADD CONSTRAINT "FK_2fd3770acdb67736f8f0a0d8ab4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_settings" DROP CONSTRAINT "FK_2fd3770acdb67736f8f0a0d8ab4"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        
        await queryRunner.query(`DROP TABLE "notification_settings"`);
        await queryRunner.query(`DROP INDEX "IDX_notifications_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notifications_enabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fcm_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_expiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_reset_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_expiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verification_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
    }
}