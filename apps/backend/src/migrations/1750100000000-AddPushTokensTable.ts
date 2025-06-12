import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushTokensTable1750100000000 implements MigrationInterface {
  name = 'AddPushTokensTable1750100000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type if it doesn't exist
    await queryRunner.query(`DO $$ BEGIN
      CREATE TYPE "public"."push_tokens_platform_enum" AS ENUM('ios', 'android', 'web');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    
    // Create push_tokens table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_tokens" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "token" character varying NOT NULL,
        "platform" "public"."push_tokens_platform_enum" NOT NULL,
        "deviceId" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_tokens" PRIMARY KEY ("id")
      )
    `);

    // Create indexes if they don't exist
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_push_tokens_userId" ON "push_tokens" ("userId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_push_tokens_userId_token" ON "push_tokens" ("userId", "token")
    `);

    // Add foreign key if it doesn't exist
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "push_tokens"
      ADD CONSTRAINT "FK_push_tokens_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key if exists
    await queryRunner.query(`
      ALTER TABLE "push_tokens"
      DROP CONSTRAINT IF EXISTS "FK_push_tokens_userId"
    `);

    // Drop indexes if they exist
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_tokens_userId_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_push_tokens_userId"`);

    // Drop table if exists
    await queryRunner.query(`DROP TABLE IF EXISTS "push_tokens"`);
    
    // Drop enum type if exists
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."push_tokens_platform_enum"`);
  }
}