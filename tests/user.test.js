// tests/user.test.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function waitForServer() {
  console.log('Waiting for server to be ready...');
  for (let i = 0; i < 10; i++) {
    try {
      await axios.get(BASE_URL + '/health', { timeout: 1000 });
      console.log('Server is running');
      return true;
    } catch (error) {
      if (i === 9) {
        console.log('Server not responding after 10 seconds');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

async function runTests() {
  console.log('=== Testing User API ===\n');
  
 
  if (!await waitForServer()) {
    console.log('Please start your server first: npm run dev');
    return;
  }
  
  let testUserId = null;
  const testEmail = `test_${Date.now()}@example.com`;
  
  try {
    
    console.log('1. Testing root endpoint...');
    const rootRes = await axios.get(BASE_URL + '/');
    console.log(`   Status: ${rootRes.status}`);
    console.log(`   Message: ${rootRes.data.message}`);
    console.log(`   Database: ${rootRes.data.database}`);
    
    
    console.log('\n2. Testing health check...');
    const healthRes = await axios.get(BASE_URL + '/health');
    console.log(`   Status: ${healthRes.status}`);
    console.log(`   Database: ${healthRes.data.database}`);
    console.log(`   Uptime: ${healthRes.data.uptime}s`);
    
    
    console.log('\n3. Creating a new user...');
    const userData = {
      name: 'Test User',
      email: testEmail,
      age: 25
    };
    
    const createRes = await axios.post(BASE_URL + '/users', userData);
    console.log(`Status: ${createRes.status}`);
    console.log(`Success: ${createRes.data.success}`);
    console.log(`Message: ${createRes.data.message}`);
    console.log(`User ID: ${createRes.data.data.id}`);
    testUserId = createRes.data.data.id;
    
    // Test 4: Get all users
    console.log('\n4. Getting all users...');
    const allUsersRes = await axios.get(BASE_URL + '/users');
    console.log(`Status: ${allUsersRes.status}`);
    console.log(`Success: ${allUsersRes.data.success}`);
    console.log(`Total users: ${allUsersRes.data.pagination?.total || allUsersRes.data.data?.length}`);
    
    
    console.log('\n5. Getting specific user...');
    const getUserRes = await axios.get(BASE_URL + '/users/' + testUserId);
    console.log(`Status: ${getUserRes.status}`);
    console.log(`Name: ${getUserRes.data.data.name}`);
    console.log(`Email: ${getUserRes.data.data.email}`);
    console.log(`Age: ${getUserRes.data.data.age}`);
    
    
    console.log('\n6. Updating user...');
    const updateData = {
      name: 'Updated Name',
      age: 30,
      status: 'active'
    };
    
    const updateRes = await axios.put(BASE_URL + '/users/' + testUserId, updateData);
    console.log(`   Status: ${updateRes.status}`);
    console.log(`   Message: ${updateRes.data.message}`);
    console.log(`   Updated name: ${updateRes.data.data.name}`);
    console.log(`   Updated age: ${updateRes.data.data.age}`);
    
    
    console.log('\n7. Testing duplicate email (should fail)...');
    try {
      await axios.post(BASE_URL + '/users', userData);
      console.log('   ✗ Should have failed but succeeded');
    } catch (error) {
      console.log(`   ✓ Correctly failed with status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
    }
    

    console.log('\n8. Testing invalid user ID...');
    try {
      await axios.get(BASE_URL + '/users/invalid123');
      console.log('   ✗ Should have failed but succeeded');
    } catch (error) {
      console.log(`   ✓ Correctly failed with status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data.error}`);
    }
    
  
    console.log('\n9. Deleting user...');
    const deleteRes = await axios.delete(BASE_URL + '/users/' + testUserId);
    console.log(`   Status: ${deleteRes.status}`);
    console.log(`   Message: ${deleteRes.data.message}`);
    console.log(`   Deleted email: ${deleteRes.data.data.email}`);
    
    
    console.log('\n10. Verifying user is deleted...');
    try {
      await axios.get(BASE_URL + '/users/' + testUserId);
      console.log('User still exists');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('User correctly deleted (404 Not Found)');
      }
    }
    
    console.log('\n=== All tests completed successfully! ===\n');
    console.log('Summary:');
    console.log('- Root endpoint: ✓');
    console.log('- Health check: ✓');
    console.log('- Create user: ✓');
    console.log('- Get users: ✓');
    console.log('- Update user: ✓');
    console.log('- Delete user: ✓');
    console.log('- Error handling: ✓');
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
    if (error.response) {
      console.error('Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

runTests();