const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin(email, password) {
  try {
    console.log(`Testing login with ${email} / ${password}`);
    
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('Error testing login:', error.message);
    return { success: false, error: error.message };
  }
}

// Test with the known user accounts
async function runTests() {
  // Test case 1: Correct credentials
  await testLogin('ahirushan629@gmail.com', 'password123');
  console.log('--------------------------');
  
  // Test case 2: Another user
  await testLogin('Nisal@gmail.com', 'password123');
  console.log('--------------------------');
  
  // Test case 3: Wrong password
  await testLogin('ahirushan629@gmail.com', 'wrongpassword');
  console.log('--------------------------');
}

runTests().catch(console.error);