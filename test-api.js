// Quick API test script
const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080/api';

async function testAPI() {
    console.log('Testing API endpoints...\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing health check...');
        const healthResponse = await axios.get(`${API_BASE_URL}/auth/test`);
        console.log('✅ Health check:', healthResponse.data);
        
        // Test 2: Try to register a new user
        console.log('\n2. Testing user registration...');
        const testUser = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
            age: 25,
            isAssistant: false
        };
        
        try {
            const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
            console.log('✅ Registration successful:', registerResponse.data);
            
            // Test 3: Try to login with the new user
            console.log('\n3. Testing user login...');
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: testUser.username,
                password: testUser.password
            });
            console.log('✅ Login successful:', loginResponse.data);
            
            // If we have user data, test teams endpoint
            if (loginResponse.data.user) {
                console.log('\n4. Testing teams endpoint...');
                const teamsResponse = await axios.get(`${API_BASE_URL}/teams/user/${loginResponse.data.user.id}`);
                console.log('✅ Teams data:', teamsResponse.data);
                
                if (teamsResponse.data.teams && teamsResponse.data.teams.length > 0) {
                    const teamId = teamsResponse.data.teams[0].teamId;
                    console.log('\n5. Testing players endpoint...');
                    const playersResponse = await axios.get(`${API_BASE_URL}/players/team/${teamId}`);
                    console.log('✅ Players data:', playersResponse.data);
                }
            }
            
        } catch (regError) {
            if (regError.response && regError.response.status === 400) {
                console.log('⚠️ User might already exist, trying to login...');
                const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                    username: testUser.username,
                    password: testUser.password
                });
                console.log('✅ Login successful:', loginResponse.data);
            } else {
                throw regError;
            }
        }
        
    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testAPI();
