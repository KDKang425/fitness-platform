import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingFeatures1749000000000 implements MigrationInterface {
    name = 'AddMissingFeatures1749000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "overhead_press_1rm" integer`);
        
        await queryRunner.query(`
            CREATE TABLE "user_programs" (
                "id" SERIAL NOT NULL,
                "is_active" boolean NOT NULL DEFAULT true,
                "start_date" date,
                "end_date" date,
                "completed_sessions" integer NOT NULL DEFAULT '0',
                "progress" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" integer NOT NULL,
                "routine_id" integer NOT NULL,
                CONSTRAINT "PK_user_programs" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."friend_request_status_enum" AS ENUM('pending', 'accepted', 'rejected')
        `);
        await queryRunner.query(`
            CREATE TABLE "friend_requests" (
                "id" SERIAL NOT NULL,
                "status" "public"."friend_request_status_enum" NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "responded_at" TIMESTAMP,
                "requester_id" integer NOT NULL,
                "recipient_id" integer NOT NULL,
                CONSTRAINT "UQ_friend_request" UNIQUE ("requester_id", "recipient_id"),
                CONSTRAINT "PK_friend_requests" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`
            CREATE TABLE "daily_stats" (
                "id" SERIAL NOT NULL,
                "date" date NOT NULL,
                "total_volume" integer NOT NULL DEFAULT '0',
                "session_count" integer NOT NULL DEFAULT '0',
                "set_count" integer NOT NULL DEFAULT '0',
                "total_time" integer NOT NULL DEFAULT '0',
                "muscle_volume" jsonb,
                "exercise_volume" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "user_id" integer NOT NULL,
                CONSTRAINT "UQ_user_date" UNIQUE ("user_id", "date"),
                CONSTRAINT "PK_daily_stats" PRIMARY KEY ("id")
            )
        `);
        
        await queryRunner.query(`CREATE INDEX "IDX_routine_subscriptions_user" ON "routine_subscriptions" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_routine_subscriptions_routine" ON "routine_subscriptions" ("routine_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_stats_user_date" ON "daily_stats" ("user_id", "date")`);
        await queryRunner.query(`CREATE INDEX "IDX_friend_requests_recipient_status" ON "friend_requests" ("recipient_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_programs_user_active" ON "user_programs" ("user_id", "is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_personal_records_user_1rm" ON "personal_records" ("user_id", "estimated1_rm" DESC)`);
        
        await queryRunner.query(`ALTER TABLE "user_programs" ADD CONSTRAINT "FK_user_programs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_programs" ADD CONSTRAINT "FK_user_programs_routine" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_friend_requests_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_friend_requests_recipient" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "daily_stats" ADD CONSTRAINT "FK_daily_stats_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "daily_stats" DROP CONSTRAINT "FK_daily_stats_user"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_recipient"`);
        await queryRunner.query(`ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_friend_requests_requester"`);
        await queryRunner.query(`ALTER TABLE "user_programs" DROP CONSTRAINT "FK_user_programs_routine"`);
        await queryRunner.query(`ALTER TABLE "user_programs" DROP CONSTRAINT "FK_user_programs_user"`);
        
        await queryRunner.query(`DROP INDEX "IDX_personal_records_user_1rm"`);
        await queryRunner.query(`DROP INDEX "IDX_user_programs_user_active"`);
        await queryRunner.query(`DROP INDEX "IDX_friend_requests_recipient_status"`);
        await queryRunner.query(`DROP INDEX "IDX_daily_stats_user_date"`);
        await queryRunner.query(`DROP INDEX "IDX_routine_subscriptions_routine"`);
        await queryRunner.query(`DROP INDEX "IDX_routine_subscriptions_user"`);
        
        await queryRunner.query(`DROP TABLE "daily_stats"`);
        await queryRunner.query(`DROP TABLE "friend_requests"`);
        await queryRunner.query(`DROP TYPE "public"."friend_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_programs"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "overhead_press_1rm"`);
    }
}