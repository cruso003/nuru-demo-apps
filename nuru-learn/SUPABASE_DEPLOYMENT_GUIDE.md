# Supabase Fresh Deployment Guide

## Overview
This guide will walk you through deploying your Nuru Learn application with a fresh Supabase project and the comprehensive database schema.

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Access to your current Supabase project dashboard
- Environment file backup

## Step 1: Backup Current Environment
```bash
cp .env.local .env.local.backup
```

## Step 2: Delete Current Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your current project: `ndhsbdlkhuaoprwtyual`
3. Go to Settings → General → Delete Project
4. Follow the deletion process

## Step 3: Create New Supabase Project
1. Click "New Project" in Supabase Dashboard
2. Choose your organization
3. Name: `nuru-learn` (or your preferred name)
4. Database Password: **Save this securely**
5. Region: Choose closest to your users
6. Pricing Plan: Choose appropriate plan
7. Click "Create new project"
8. Wait for project initialization (2-3 minutes)

## Step 4: Get New Project Credentials
From your new project dashboard:
1. Go to Settings → API
2. Copy the following values:
   - **Project URL**: `https://your-new-ref.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 5: Update Environment Variables
Edit your `.env.local` file:

```bash
# Update these with your new project values
NEXT_PUBLIC_SUPABASE_URL="https://your-new-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_new_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_new_service_role_key"

# Keep existing values
NEXT_PUBLIC_NURU_AI_URL=http://18.206.91.76:8000
NURU_AI_API_KEY=not_applicable_at_the_moment
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 6: Initialize Supabase CLI (Optional)
If you want to use Supabase CLI for future migrations:

```bash
# In your project root
npx supabase init

# Link to your new project
npx supabase link --project-ref your-new-ref
```

## Step 7: Deploy Database Schema
You have two options:

### Option A: Using Supabase CLI (Recommended)
```bash
# Deploy the migration
npx supabase db push
```

### Option B: Manual SQL Execution
1. Go to your Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/20250603000000_initial_schema.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"

## Step 8: Configure Authentication Settings
1. Go to Authentication → Settings in your Supabase dashboard
2. **Enable Email Confirmations**:
   - Check "Enable email confirmations"
   - Set "Confirm email" redirect URL to: `http://localhost:3000/onboarding`
3. **Configure Email Templates** (Optional):
   - Customize the confirmation email template
   - Add your app branding

## Step 9: Test the Deployment
```bash
# Start your development server
npm run dev

# Open http://localhost:3000
# Try the onboarding flow:
# 1. Sign up with a real email
# 2. Check for verification email
# 3. Complete verification process
```

## Step 10: Verify Database Structure
Check that all tables were created:
```sql
-- Run this in Supabase SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

Expected tables:
- `users`
- `user_progress`
- `daily_progress`
- `user_achievements`
- `learning_sessions`
- `ai_response_cache`
- `generated_lessons`

## Step 11: Test Email Verification
1. Sign up with a real email address
2. Check your email for verification code
3. Enter the code in the onboarding flow
4. Verify successful account creation

## Database Schema Features
Your new database includes:

### 🔐 Security
- **Row Level Security (RLS)** enabled on all tables
- **Proper access policies** for user data isolation
- **CASCADE deletions** for data consistency

### 📊 Progress Tracking
- **User progress** with XP, streaks, and statistics
- **Daily progress** tracking with goal completion
- **Learning sessions** for detailed activity logs

### 🏆 Gamification
- **Achievement system** with automatic badge awards
- **Streak logic** with grace periods
- **Leaderboard support** through user stats view

### ⚡ Performance
- **Optimized indexes** for fast queries
- **AI response caching** for cost optimization
- **Automatic cleanup** functions for maintenance

### 🎯 AI Integration
- **Lesson generation** and storage
- **Response caching** with expiration
- **Multi-language support** for Kpelle learning

## Troubleshooting

### Migration Fails
```bash
# Check migration status
npx supabase db status

# Reset if needed (CAUTION: This deletes all data)
npx supabase db reset
```

### Authentication Issues
- Verify email confirmation is enabled
- Check redirect URLs match your domain
- Ensure service role key has proper permissions

### RLS Policy Errors
- Tables have RLS enabled with proper policies
- Users can only access their own data
- Service role can bypass RLS for admin operations

### Performance Issues
- All necessary indexes are created
- Cache cleanup runs automatically
- Monitor query performance in Supabase dashboard

## Production Deployment Notes

### Environment Variables for Production
```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_production_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_production_service_key"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV=production
```

### Security Considerations
- Never expose service role key in client-side code
- Use row-level security for all sensitive data
- Regular backup your database
- Monitor authentication logs

### Scaling Considerations
- Monitor database performance metrics
- Consider connection pooling for high traffic
- Cache frequently accessed data
- Use CDN for static assets

## Support
If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify all environment variables
3. Test database connectivity
4. Review RLS policies
5. Check authentication settings

## Next Steps
After successful deployment:
1. ✅ Test complete onboarding flow
2. ✅ Verify email verification works
3. ✅ Test user data creation
4. ✅ Test learning session tracking
5. ✅ Implement additional features

Your Nuru Learn application is now ready with a robust, scalable database foundation!
