import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class AddDummyUsers1751000000000 implements MigrationInterface {
  name = 'AddDummyUsers1751000000000';
  
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Skip if users already exist
    const existingUsers = await queryRunner.query(
      `SELECT COUNT(*) as count FROM users WHERE email LIKE '%example.com'`
    );
    
    if (existingUsers[0].count > 0) {
      console.log('Dummy users already exist, skipping...');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    const users = [
      { email: 'alice.lift@example.com', nickname: 'AliceLift' },
      { email: 'brad.bench@example.com', nickname: 'BenchBrad' },
      { email: 'carla.cardio@example.com', nickname: 'CardioCarla' },
      { email: 'derek.dead@example.com', nickname: 'DeadliftDK' },
      { email: 'erika.squat@example.com', nickname: 'SquatErika' },
      { email: 'felix.flex@example.com', nickname: 'FlexFelix' },
      { email: 'gina.gainz@example.com', nickname: 'GainzGina' },
      { email: 'harry.hiit@example.com', nickname: 'HIITHarry' },
      { email: 'ivana.iron@example.com', nickname: 'IronIvana' },
      { email: 'jack.jump@example.com', nickname: 'JumpingJack' },
    ];

    for (const user of users) {
      const height = 170 + Math.floor(Math.random() * 20);
      const weight = 60 + Math.floor(Math.random() * 30);
      
      await queryRunner.query(`
        INSERT INTO users (
          email, 
          password, 
          nickname, 
          height, 
          initial_weight,
          has_completed_initial_setup,
          email_verified,
          preferred_unit,
          created_at, 
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        )
      `, [
        user.email,
        hashedPassword,
        user.nickname,
        height,
        weight,
        true, // has_completed_initial_setup
        true, // email_verified
        'kg', // preferred_unit
        new Date(),
        new Date()
      ]);
    }

    console.log('Added 10 dummy users successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM users WHERE email LIKE '%example.com'
    `);
  }
}