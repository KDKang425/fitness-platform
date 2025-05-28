import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class AddPersonalRecordsTable1685610000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.createTable(
      new Table({
        name: 'personal_records',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'int' },
          { name: 'exerciseId', type: 'int' },
          { name: 'bestWeight', type: 'int' },
          { name: 'bestReps', type: 'int' },
          { name: 'estimated1RM', type: 'int' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await q.createUniqueConstraint(
      'personal_records',
      new TableUnique({ name: 'UQ_user_exercise', columnNames: ['userId', 'exerciseId'] }),
    );
    await q.query(
      `ALTER TABLE personal_records
       ADD CONSTRAINT FK_pr_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await q.query(
      `ALTER TABLE personal_records
       ADD CONSTRAINT FK_pr_ex FOREIGN KEY ("exerciseId") REFERENCES exercises(id) ON DELETE CASCADE`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.dropTable('personal_records');
  }
}
