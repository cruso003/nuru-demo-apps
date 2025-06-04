// Quick script to create a test user profile
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestProfile() {
  const userId = '1d95f3c8-bbed-47c7-87c1-db6a567f9328';
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: 'ai-test@example.com',
        username: 'testuser',
        full_name: 'Test User',
        preferred_language: 'en',
        daily_goal_minutes: 30,
        difficulty_preference: 'beginner',
        role: 'user'
      })
      .select();

    if (error) {
      console.error('Error creating profile:', error);
    } else {
      console.log('Profile created successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
  
  process.exit(0);
}

createTestProfile();
