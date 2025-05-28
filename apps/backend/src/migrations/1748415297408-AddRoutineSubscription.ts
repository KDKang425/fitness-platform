import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class AddRoutineSubscription1685600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'routine_subscriptions',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'int' },
          { name: 'routineId', type: 'int' },
          { name: 'subscribedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
    );
    await queryRunner.createUniqueConstraint(
      'routine_subscriptions',
      new TableUnique({ name: 'UQ_user_routine', columnNames: ['userId', 'routineId'] }),
    );
    await queryRunner.query(
      `ALTER TABLE routine_subscriptions
       ADD CONSTRAINT FK_sub_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE routine_subscriptions
       ADD CONSTRAINT FK_sub_routine FOREIGN KEY ("routineId") REFERENCES routines(id) ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('routine_subscriptions');
  }
}
