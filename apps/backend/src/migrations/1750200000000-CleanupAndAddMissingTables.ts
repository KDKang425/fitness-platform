import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupAndAddMissingTables1750200000000 implements MigrationInterface {
  name = 'CleanupAndAddMissingTables1750200000000';
  
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if post_comments table exists (from 1748771000000 migration)
    const postCommentsExists = await queryRunner.hasTable('post_comments');
    if (!postCommentsExists) {
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
      
      // Add indexes for post_comments
      await queryRunner.query(`
        CREATE INDEX "IDX_post_comments_post_id" ON "post_comments" ("post_id")
      `);
      
      await queryRunner.query(`
        CREATE INDEX "IDX_post_comments_author_id" ON "post_comments" ("author_id")
      `);
    }

    // Check if refresh_tokens table exists (from 1748770000000 migration)
    const refreshTokensExists = await queryRunner.hasTable('refresh_tokens');
    if (!refreshTokensExists) {
      await queryRunner.query(`
        CREATE TABLE "refresh_tokens" (
          "id" SERIAL NOT NULL,
          "token" character varying(512) NOT NULL,
          "expires_at" TIMESTAMP NOT NULL,
          "revoked" boolean NOT NULL DEFAULT false,
          "user_id" integer,
          CONSTRAINT "UQ_refresh_token_token" UNIQUE ("token"),
          CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id")
        )
      `);
      
      await queryRunner.query(`
        ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "FK_refresh_tokens_user"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      `);
      
      // Add indexes for refresh_tokens
      await queryRunner.query(`
        CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
      `);
      
      await queryRunner.query(`
        CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")
      `);
    }

    // Check if push_tokens table exists (from our new migration)
    const pushTokensExists = await queryRunner.hasTable('push_tokens');
    if (!pushTokensExists) {
      // Check if enum exists
      const enumExists = await queryRunner.query(`
        SELECT 1 FROM pg_type WHERE typname = 'push_tokens_platform_enum'
      `);
      
      if (enumExists.length === 0) {
        await queryRunner.query(`
          CREATE TYPE "public"."push_tokens_platform_enum" AS ENUM('ios', 'android', 'web')
        `);
      }
      
      await queryRunner.query(`
        CREATE TABLE "push_tokens" (
          "id" SERIAL NOT NULL,
          "user_id" integer NOT NULL,
          "token" character varying NOT NULL,
          "platform" "public"."push_tokens_platform_enum" NOT NULL,
          "device_id" character varying,
          "is_active" boolean NOT NULL DEFAULT true,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_push_tokens_id" PRIMARY KEY ("id")
        )
      `);
      
      await queryRunner.query(`
        ALTER TABLE "push_tokens"
        ADD CONSTRAINT "FK_push_tokens_user"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      `);
      
      // Add indexes for push_tokens
      await queryRunner.query(`
        CREATE INDEX "IDX_push_tokens_user_id" ON "push_tokens" ("user_id")
      `);
      
      await queryRunner.query(`
        CREATE UNIQUE INDEX "UQ_push_tokens_user_token" ON "push_tokens" ("user_id", "token")
      `);
    }

    // Add any missing indexes that might have been skipped
    const indexesToCheck = [
      { table: 'posts', name: 'IDX_posts_workout_session_id', columns: ['workout_session_id'] },
      { table: 'likes', name: 'IDX_likes_post_id', columns: ['post_id'] },
      { table: 'likes', name: 'IDX_likes_user_id', columns: ['user_id'] },
    ];

    for (const index of indexesToCheck) {
      const tableExists = await queryRunner.hasTable(index.table);
      if (tableExists) {
        const hasIndex = await queryRunner.query(`
          SELECT 1 FROM pg_indexes 
          WHERE tablename = '${index.table}' 
          AND indexname = '${index.name.toLowerCase()}'
        `);
        
        if (hasIndex.length === 0) {
          await queryRunner.query(`
            CREATE INDEX "${index.name}" ON "${index.table}" ("${index.columns.join('", "')}")
          `);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop push_tokens table if we created it
    const pushTokensExists = await queryRunner.hasTable('push_tokens');
    if (pushTokensExists) {
      await queryRunner.dropTable('push_tokens');
      await queryRunner.query(`DROP TYPE IF EXISTS "public"."push_tokens_platform_enum"`);
    }

    // We don't drop refresh_tokens or post_comments in down migration
    // since they might have been created by their original migrations
  }
}