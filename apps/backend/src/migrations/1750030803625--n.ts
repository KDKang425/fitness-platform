import { MigrationInterface, QueryRunner } from "typeorm";

export class  N1750030803625 implements MigrationInterface {
    name = ' N1750030803625'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_sets" ADD "is_completed" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_sets" DROP COLUMN "is_completed"`);
    }

}
