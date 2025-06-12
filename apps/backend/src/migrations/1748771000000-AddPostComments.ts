import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostComments1748771000000 implements MigrationInterface {
  name = 'AddPostComments1748771000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "post_comments" (
        "id" SERIAL NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "author_id" integer,
        "post_id" integer,
        "parent_id" integer,
        CONSTRAINT "PK_post_comments_id" PRIMARY KEY ("id")
      )
    `);
    
    // Add foreign keys if they don't exist
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "post_comments"
      ADD CONSTRAINT "FK_post_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "post_comments"
      ADD CONSTRAINT "FK_post_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
    
    await queryRunner.query(`DO $$ BEGIN
      ALTER TABLE "post_comments"
      ADD CONSTRAINT "FK_post_comments_parent" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "post_comments"`);
  }
}