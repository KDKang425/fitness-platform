import 'reflect-metadata'
import dataSource from '../data-source'
import { fakerKO as faker } from '@faker-js/faker'
import * as bcrypt from 'bcrypt'
import { User, UserRole } from '../src/users/entities/user.entity'
import { Routine } from '../src/routines/entities/routine.entity'
import { Post } from '../src/posts/entities/post.entity'

async function run() {
  await dataSource.initialize()

  const userRepo = dataSource.getRepository(User)
  const routineRepo = dataSource.getRepository(Routine)
  const postRepo = dataSource.getRepository(Post)

  await postRepo.delete({})
  await routineRepo.delete({})
  await userRepo.delete({})

  const users: User[] = []
  for (let i = 0; i < 10; i++) {
    users.push(
      userRepo.create({
        email: `user${i + 1}@demo.com`,
        password: await bcrypt.hash('password', 10),
        nickname: faker.person.firstName(),
        profileImageUrl: faker.image.avatar(),
        height: faker.number.int({ min: 160, max: 190 }),
        initialWeight: faker.number.int({ min: 55, max: 95 }),
        benchPress1RM: faker.number.int({ min: 60, max: 130 }),
        squat1RM: faker.number.int({ min: 80, max: 180 }),
        deadlift1RM: faker.number.int({ min: 90, max: 200 }),
        role: UserRole.USER,
        hasCompletedInitialSetup: true,
      }),
    )
  }
  await userRepo.save(users)

  const routineSeeds = [
    { name: 'PHUL 4주 프로그램', description: '상·하 분할 4일 루틴' },
    { name: 'nSuns 5/3/1 6주', description: '파워빌딩 고중량 루틴' },
    { name: 'TSA 중급 파워리프팅', description: '9주 중급자 프로그램' },
    { name: 'Push/Pull/Legs 6일', description: '고빈도 PPL 루틴' },
    { name: 'Full Body 3일', description: '전신 초급 루틴' },
  ]
  const routines = routineSeeds.map((r) =>
    routineRepo.create({ ...r, isPublic: true, creator: users[0] }),
  )
  await routineRepo.save(routines)

  const posts: Post[] = []
  for (let i = 0; i < 20; i++) {
    posts.push(
      postRepo.create({
        user: users[faker.number.int({ min: 0, max: 9 })],
        imageUrl: `https://picsum.photos/seed/post${i + 1}/600/600`,
        content: faker.lorem.sentence(),
        likesCount: faker.number.int({ min: 0, max: 50 }),
      }),
    )
  }
  await postRepo.save(posts)

  console.log('✅  demo data seeded')
  await dataSource.destroy()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
