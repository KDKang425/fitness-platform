import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenTable1748770000000 implements MigrationInterface {
  name = 'AddRefreshTokenTable1748770000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" SERIAL NOT NULL,
        "token" character varying(512) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "user_id" integer,
        CONSTRAINT "UQ_refresh_token_token" UNIQUE ("token"),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id")
      )
    `);
    
    // Add foreign key if it doesn't exist
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "FK_refresh_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
