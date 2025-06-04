#!/bin/bash

# Nuru Learn - Post-Deployment Verification Script
# Run this after setting up your new Supabase project

echo "🚀 Nuru Learn - Post-Deployment Verification"
echo "=============================================="
echo ""

# Check if environment variables are set
echo "📋 Checking Environment Configuration..."

if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    
    # Check for required environment variables
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is missing"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY is set"
    else
        echo "❌ SUPABASE_SERVICE_ROLE_KEY is missing"
    fi
else
    echo "❌ .env.local file not found"
fi

echo ""

# Check if migration file exists
echo "📁 Checking Migration Files..."
if [ -f "supabase/migrations/20250603000000_initial_schema.sql" ]; then
    echo "✅ Initial schema migration exists"
    
    # Get file size to verify it's not empty
    filesize=$(wc -c < "supabase/migrations/20250603000000_initial_schema.sql")
    if [ $filesize -gt 1000 ]; then
        echo "✅ Migration file has content ($filesize bytes)"
    else
        echo "⚠️  Migration file seems small ($filesize bytes)"
    fi
else
    echo "❌ Initial schema migration not found"
fi

echo ""

# Check if key components exist
echo "🧩 Checking Application Components..."

components=(
    "components/onboarding/onboarding-flow.tsx"
    "lib/auth/enhanced-auth.ts"
    "lib/stores/enhanced-learning.ts"
    "app/onboarding/page.tsx"
)

for component in "${components[@]}"; do
    if [ -f "$component" ]; then
        echo "✅ $component exists"
    else
        echo "❌ $component missing"
    fi
done

echo ""

# Check dependencies
echo "📦 Checking Dependencies..."
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    
    # Check for key dependencies
    dependencies=(
        "@supabase/supabase-js"
        "next"
        "react"
        "zustand"
        "lucide-react"
    )
    
    for dep in "${dependencies[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo "✅ $dep is installed"
        else
            echo "⚠️  $dep not found in package.json"
        fi
    done
else
    echo "❌ package.json not found"
fi

echo ""

# Provide next steps
echo "🎯 Next Steps:"
echo "1. Update .env.local with your new Supabase credentials"
echo "2. Deploy database schema: npx supabase db push"
echo "3. Enable email confirmation in Supabase Auth settings"
echo "4. Start development server: npm run dev"
echo "5. Test onboarding flow at http://localhost:3000"

echo ""
echo "📖 For detailed instructions, see: SUPABASE_DEPLOYMENT_GUIDE.md"

# Test basic functionality (if server is running)
echo ""
echo "🔍 Testing Application..."

if command -v curl &> /dev/null; then
    if curl -s http://localhost:3000 &> /dev/null; then
        echo "✅ Development server is running"
        echo "🌐 Visit: http://localhost:3000"
    else
        echo "⚠️  Development server not running"
        echo "💡 Run: npm run dev"
    fi
else
    echo "⚠️  curl not available for testing"
fi

echo ""
echo "🎉 Verification complete!"
echo "📚 Check SUPABASE_DEPLOYMENT_GUIDE.md for detailed setup instructions"
