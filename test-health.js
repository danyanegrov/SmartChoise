// Test script for health endpoint
import fetch from 'node-fetch';

const testHealth = async () => {
  try {
    console.log('🧪 Testing health endpoint...');
    
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    
    console.log('✅ Health check successful!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
};

// Run test
testHealth();
