// seeds/20250601-AddDummyUsers.ts
import { MigrationInterface, QueryRunner } from 'typeorm'
import * as bcrypt from 'bcrypt'

export class AddDummyUsers1685587200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const salt = await bcrypt.genSalt(10)

    const users = [
      { email: 'alice.lift@example.com',    nickname: 'AliceLift'    },
      { email: 'brad.bench@example.com',    nickname: 'BenchBrad'    },
      { email: 'carla.cardio@example.com',  nickname: 'CardioCarla'  },
      { email: 'derek.dead@example.com',    nickname: 'DeadliftDK'   },
      { email: 'erika.squat@example.com',   nickname: 'SquatErika'   },
      { email: 'felix.flex@example.com',    nickname: 'FlexFelix'    },
      { email: 'gina.gainz@example.com',    nickname: 'GainzGina'    },
      { email: 'harry.hiit@example.com',    nickname: 'HIITHarry'    },
      { email: 'ivana.iron@example.com',    nickname: 'IronIvana'    },
      { email: 'jack.jump@example.com',     nickname: 'JumpingJack'  },
    ]

    for (const u of users) {
      await queryRunner.manager.insert('users', {
        email: u.email,
        nickname: u.nickname,
        password: await bcrypt.hash('Password123!', salt), // 개발용 공통 PW
        created_at: new Date(),
        updated_at: new Date(),
        // 선택 필드(키·몸무게·1RM 등)… 필요 시 null 또는 기본값
        height_cm: 170 + Math.floor(Math.random() * 20),
        weight_kg: 60 + Math.floor(Math.random() * 25),
        bench_1rm: 60 + Math.floor(Math.random() * 40),
        squat_1rm: 80 + Math.floor(Math.random() * 60),
        deadlift_1rm: 90 + Math.floor(Math.random() * 70),
      })
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete('users', {})
  }
}
