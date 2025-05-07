import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
    TableUnique,
  } from 'typeorm';
  
  export class CreateUsers1746240987394 implements MigrationInterface {
    name = 'CreateUsers1746240987394';
  
    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            /* ── 기본 키 ──────────────────────── */
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'uuid',
            },
  
            /* ── 계정 정보 ─────────────────────── */
            { name: 'email', type: 'varchar', isUnique: true },
            { name: 'password', type: 'varchar' }, // 해시
  
            /* ── 프로필 정보 (추가) ─────────────── */
            { name: 'name', type: 'varchar', length: '40' },
            { name: 'phone', type: 'varchar', length: '20', isNullable: true },
            {
              name: 'profile_image_url',
              type: 'varchar',
              isNullable: true,
              comment: 'AWS S3 URL',
            },
  
            /* ── 메타 데이터 ───────────────────── */
            { name: 'created_at', type: 'timestamptz', default: 'now()' },
            {
              name: 'updated_at',
              type: 'timestamptz',
              default: 'now()',
              onUpdate: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
  
      /* (선택) 인덱스·유니크 제약을 따로 만들 수도 있다 */
      await queryRunner.createIndex(
        'users',
        new TableIndex({
          name: 'IDX_users_phone',
          columnNames: ['phone'],
        }),
      );
  
      await queryRunner.createUniqueConstraint(
        'users',
        new TableUnique({
          name: 'UQ_users_name',
          columnNames: ['name'],
        }),
      );
    }
  
    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropTable('users');
    }
  }
  