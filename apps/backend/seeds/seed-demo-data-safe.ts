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

  console.log('Seeding demo data...')
  
  // Check if demo data already exists
  const existingDemoUser = await userRepo.findOne({ where: { email: 'user1@demo.com' } })
  if (existingDemoUser) {
    console.log('Demo data already exists. Skipping seed.')
    await dataSource.destroy()
    return
  }

  // Create demo users
  const users: User[] = []
  for (let i = 0; i < 10; i++) {
    const user = userRepo.create({
      email: `user${i + 1}@demo.com`,
      password: await bcrypt.hash('password', 10),
      nickname: `DemoUser${i + 1}_${faker.person.firstName()}`,
      profileImageUrl: faker.image.avatar(),
      height: faker.number.int({ min: 160, max: 190 }),
      initialWeight: faker.number.int({ min: 55, max: 95 }),
      benchPress1RM: faker.number.int({ min: 60, max: 130 }),
      squat1RM: faker.number.int({ min: 80, max: 180 }),
      deadlift1RM: faker.number.int({ min: 90, max: 200 }),
      role: UserRole.USER,
      hasCompletedInitialSetup: true,
      emailVerified: true,
    })
    users.push(user)
  }
  
  try {
    await userRepo.save(users)
    console.log(`Created ${users.length} demo users`)
  } catch (error) {
    console.error('Error creating demo users:', error instanceof Error ? error.message : String(error))
    await dataSource.destroy()
    return
  }

  // Create demo routines
  const routineSeeds = [
    { name: 'PHUL 4주 프로그램 (Demo)', description: '상·하 분할 4일 루틴' },
    { name: 'nSuns 5/3/1 6주 (Demo)', description: '파워빌딩 고중량 루틴' },
    { name: 'TSA 중급 파워리프팅 (Demo)', description: '9주 중급자 프로그램' },
    { name: 'Push/Pull/Legs 6일 (Demo)', description: '고빈도 PPL 루틴' },
    { name: 'Full Body 3일 (Demo)', description: '전신 초급 루틴' },
  ]
  
  const routines = routineSeeds.map((r) =>
    routineRepo.create({ ...r, isPublic: true, creator: users[0] }),
  )
  
  try {
    await routineRepo.save(routines)
    console.log(`Created ${routines.length} demo routines`)
  } catch (error) {
    console.error('Error creating demo routines:', error instanceof Error ? error.message : String(error))
  }

  // Create demo posts
  const postSeeds = [
    { content: '오늘도 운동 완료! 💪', user: users[0] },
    { content: '새로운 PR 달성했어요!', user: users[1] },
    { content: '운동 전 스트레칭은 필수!', user: users[2] },
    { content: '건강한 식단도 중요해요', user: users[3] },
    { content: '꾸준함이 답이다', user: users[4] },
  ]
  
  const posts = postSeeds.map((p) => postRepo.create(p))
  
  try {
    await postRepo.save(posts)
    console.log(`Created ${posts.length} demo posts`)
  } catch (error) {
    console.error('Error creating demo posts:', error instanceof Error ? error.message : String(error))
  }

  console.log('Demo data seeding completed!')
  await dataSource.destroy()
}

run().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})