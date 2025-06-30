import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeeksToRoutines1752000000000 implements MigrationInterface {
    name = 'AddWeeksToRoutines1752000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "routines" ADD COLUMN IF NOT EXISTS "weeks" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "routines" DROP COLUMN IF EXISTS "weeks"`);
    }
}