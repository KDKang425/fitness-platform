const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'integration@test.com',
  password: 'Test1234@',
  nickname: 'IntegrationTest'
};

let accessToken = '';
let userId = 0;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runIntegrationTest() {
  console.log('🚀 Starting Integration Test...\n');

  try {
    // 1. Test Authentication Flow
    console.log('1. Testing Authentication Flow');
    console.log('   - Registering user...');
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, TEST_USER);
      console.log('   ✅ Registration successful');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('   ⚠️  User already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    console.log('   - Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    accessToken = loginRes.data.data.accessToken;
    userId = loginRes.data.data.user.id;
    console.log('   ✅ Login successful\n');

    // Set authorization header for all subsequent requests
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // 2. Test Profile Setup
    console.log('2. Testing Profile Setup');
    console.log('   - Setting initial profile...');
    try {
      await authAxios.post('/users/profile/initial', {
        height: 180,
        weight: 75,
        preferredUnit: 'kg',
        benchPress1RM: 100,
        squat1RM: 140,
        deadlift1RM: 160
      });
      console.log('   ✅ Profile setup complete\n');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ⚠️  Profile already set up\n');
      } else {
        throw error;
      }
    }

    // 3. Test Exercise Endpoints
    console.log('3. Testing Exercise Endpoints');
    console.log('   - Fetching exercises...');
    const exercisesRes = await authAxios.get('/exercises');
    const exercises = exercisesRes.data.data || exercisesRes.data;
    console.log(`   ✅ Found ${exercises.length} exercises`);
    
    if (exercises.length > 0) {
      const exercise = exercises[0];
      console.log(`   - Getting details for exercise: ${exercise.name}...`);
      const exerciseDetailRes = await authAxios.get(`/exercises/${exercise.id}`);
      console.log('   ✅ Exercise details retrieved\n');
    }

    // 4. Test Workout Session
    console.log('4. Testing Workout Session');
    console.log('   - Starting workout session...');
    const startWorkoutRes = await authAxios.post('/workouts/start');
    const sessionId = startWorkoutRes.data.data.id;
    console.log(`   ✅ Session started (ID: ${sessionId})`);

    if (exercises.length > 0) {
      console.log('   - Adding sets to workout...');
      const exerciseId = exercises[0].id;
      
      // Add 3 sets
      for (let i = 1; i <= 3; i++) {
        await authAxios.post(`/workouts/${sessionId}/sets`, {
          exerciseId,
          weight: 60 + (i * 5),
          reps: 12 - i
        });
        console.log(`   ✅ Added set ${i}`);
      }
    }

    console.log('   - Finishing workout session...');
    await authAxios.patch(`/workouts/${sessionId}/finish`);
    console.log('   ✅ Workout completed\n');

    // 5. Test Stats
    console.log('5. Testing Stats Endpoints');
    console.log('   - Fetching weekly stats...');
    const weeklyStatsRes = await authAxios.get('/stats/weekly');
    console.log('   ✅ Weekly stats retrieved');

    console.log('   - Fetching monthly stats...');
    const monthlyStatsRes = await authAxios.get('/stats/monthly');
    console.log('   ✅ Monthly stats retrieved\n');

    // 6. Test Social Features
    console.log('6. Testing Social Features');
    console.log('   - Creating a post...');
    const createPostRes = await authAxios.post('/posts', {
      content: 'Just finished an awesome workout! 💪',
      imageUrl: 'https://example.com/workout.jpg'
    });
    const postId = createPostRes.data.data.id;
    console.log(`   ✅ Post created (ID: ${postId})`);

    console.log('   - Fetching feed...');
    const feedRes = await authAxios.get('/posts/feed');
    console.log(`   ✅ Feed retrieved (${feedRes.data.data.length || 0} posts)`);

    console.log('   - Liking a post...');
    await authAxios.post(`/posts/${postId}/like`);
    console.log('   ✅ Post liked\n');

    // 7. Test Routines
    console.log('7. Testing Routines');
    console.log('   - Creating a routine...');
    const createRoutineRes = await authAxios.post('/routines', {
      title: 'Integration Test Routine',
      description: 'A routine created during integration testing',
      weeks: 4,
      daysPerWeek: 3,
      exercises: exercises.slice(0, 3).map(ex => ({
        exerciseId: ex.id,
        sets: 3,
        reps: '8-12',
        order: 1
      }))
    });
    const routineId = createRoutineRes.data.data.id;
    console.log(`   ✅ Routine created (ID: ${routineId})`);

    console.log('   - Fetching user routines...');
    const userRoutinesRes = await authAxios.get('/routines/my-routines');
    console.log(`   ✅ Found ${userRoutinesRes.data.data.length || 0} user routines\n`);

    // 8. Test Body Records
    console.log('8. Testing Body Records');
    console.log('   - Adding body record...');
    const bodyRecordRes = await authAxios.post('/body-records', {
      weight: 74.5,
      bodyFat: 15.2
    });
    console.log('   ✅ Body record added');

    console.log('   - Fetching body records...');
    const bodyRecordsRes = await authAxios.get('/body-records');
    console.log(`   ✅ Found ${bodyRecordsRes.data.data.length || 0} body records\n`);

    console.log('✅ INTEGRATION TEST COMPLETED SUCCESSFULLY! ✅\n');
    console.log('Summary:');
    console.log('- Authentication: ✅');
    console.log('- Profile Setup: ✅');
    console.log('- Exercises: ✅');
    console.log('- Workout Sessions: ✅');
    console.log('- Stats: ✅');
    console.log('- Social Features: ✅');
    console.log('- Routines: ✅');
    console.log('- Body Records: ✅');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED ❌');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const res = await axios.get('http://localhost:3001/api/v1');
    return res.data.success === true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Checking if backend is running...');
  const isRunning = await checkBackend();
  
  if (!isRunning) {
    console.error('❌ Backend is not running at', API_URL);
    console.error('Please start the backend first with: docker-compose up');
    process.exit(1);
  }

  console.log('✅ Backend is running\n');
  await delay(1000);
  await runIntegrationTest();
}

main();