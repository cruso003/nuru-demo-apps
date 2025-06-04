#!/usr/bin/env node

/**
 * Test script to verify Nuru AI integration
 */

const { default: fetch } = require('node-fetch');

const BACKEND_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzNzIzOGYxNS1iYmNiLTRlYjYtODUxNy03MzYxMjRmN2ExM2QiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NDkwNzE4MTMsImV4cCI6MTc0OTY3NjYxM30.mTIDWsY8Hhu_jEV9nCg7b6kfVZ4QfM5ZMQDcuRRgkEk';

async function testAIIntegration() {
  console.log('🧪 Testing Nuru AI Integration...\n');

  try {
    // Test 1: Simple chat
    console.log('1️⃣ Testing chat endpoint...');
    const chatResponse = await fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        message: 'Hello! Can you help me learn?',
        context: {
          language: 'en',
          subject: 'language-arts'
        }
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat endpoint working!');
      console.log('Response preview:', chatData.response?.substring(0, 100) + '...');
    } else {
      console.log('❌ Chat endpoint failed:', chatResponse.status, chatResponse.statusText);
      const errorText = await chatResponse.text();
      console.log('Error details:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAIIntegration().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);
