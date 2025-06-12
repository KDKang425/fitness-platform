import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemovePostComments1752000000000 implements MigrationInterface {
  name = 'RemovePostComments1752000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the post_comments table and all its constraints
    await queryRunner.query(`DROP TABLE IF EXISTS "post_comments" CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the post_comments table if needed to rollback
    await queryRunner.query(`
      CREATE TABLE "post_comments" (
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
    
    await queryRunner.query(`
      ALTER TABLE "post_comments"
      ADD CONSTRAINT "FK_post_comments_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "post_comments"
      ADD CONSTRAINT "FK_post_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "post_comments"
      ADD CONSTRAINT "FK_post_comments_parent" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_post_comments_post_id" ON "post_comments" ("post_id")
    `);
    
    await queryRunner.query(`
      CREATE INDEX "IDX_post_comments_author_id" ON "post_comments" ("author_id")
    `);
  }
}