const axios = require('axios');

async function testAPI() {
  try {
    // Register user
    console.log('1. Registering user...');
    const registerResponse = await axios.post('http://localhost:3001/api/v1/auth/register', {
      email: 'test@example.com',
      password: 'Test1234@',
      nickname: 'TestUser'
    });
    console.log('Registration response:', registerResponse.data);
  } catch (error) {
    if (error.response) {
      console.error('Registration error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }

  try {
    // Login
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'Test1234@'
    });
    console.log('Login response:', loginResponse.data);
    
    const token = loginResponse.data.data.accessToken;
    
    // Get exercises
    console.log('\n3. Getting exercises...');
    const exercisesResponse = await axios.get('http://localhost:3001/api/v1/exercises', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Exercises count:', exercisesResponse.data.data.length);
    
  } catch (error) {
    if (error.response) {
      console.error('Login/exercises error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPI();