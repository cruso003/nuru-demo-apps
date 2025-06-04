/**
 * Authentication Modal
 * Simple user authentication with cultural preferences setup
 */

'use client';

import { useState } from 'react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { AuthService } from '@/lib/auth/enhanced-auth';
import { Language } from '@/lib/types/education';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  GlobeIcon, 
  GraduationCap, 
  HeartIcon, 
  SparklesIcon,
  Mic,
  MessageCircle,
  Eye,
  Volume2,
  Brain,
  Zap,
  Star,
  Languages
} from 'lucide-react';

export function AuthModal() {
  const [step, setStep] = useState<'welcome' | 'profile' | 'preferences' | 'auth-choice' | 'login' | 'signup'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    password: '',
    primaryLanguage: 'en' as Language,
    targetLanguage: 'kpe' as Language,
    learningLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    culturalRegion: '',
    learningGoals: [] as string[]
  });

  const { initializeUser, initializeSession } = useLearningStore();

  const handleGetStarted = () => {
    setStep('auth-choice');
  };

  const handleTryAsGuest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create guest user with enhanced auth
      const guestUser = await AuthService.createGuestSession();
      
      // Initialize user in store
      await initializeUser(guestUser as any);
      
      // Initialize session
      await initializeSession();
      
    } catch (err) {
      console.error('Guest login error:', err);
      setError('Failed to create guest session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    setStep('profile');
  };

  const handleSignIn = () => {
    setStep('login');
  };

  const handleProfileSubmit = () => {
    if (userInfo.name.trim()) {
      setStep('preferences');
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign up with enhanced auth
      const { user } = await AuthService.signUp(
        userInfo.email,
        userInfo.password,
        {
          name: userInfo.name
        }
      );

      // Initialize user in store
      if (user) {
        await initializeUser(user);
      }
      
      // Initialize session
      await initializeSession();

    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Sign in with enhanced auth
      const { user } = await AuthService.signIn(userInfo.email, userInfo.password);

      // Initialize user in store
      if (user) {
        await initializeUser(user);
      }
      
      // Initialize session
      await initializeSession();

    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const learningGoals = [
    'Improve conversation skills',
    'Learn cultural traditions',
    'Master pronunciation',
    'Understand formal language',
    'Practice daily interactions',
    'Explore storytelling'
  ];

  const toggleGoal = (goal: string) => {
    setUserInfo(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter(g => g !== goal)
        : [...prev.learningGoals, goal]
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        {step === 'welcome' && (
          <>
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Nuru Learn
              </CardTitle>
              <CardDescription className="text-base">
                AI-Powered Education for Kpelle Heritage
              </CardDescription>
              <div className="flex justify-center">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                  <Zap className="h-4 w-4 mr-1" />
                  Powered by Nuru AI
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Experience cutting-edge AI that understands both languages and cultures. 
                  Learn through voice, image, and interactive conversations while preserving Kpelle traditions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Mic className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Voice Intelligence</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Speak naturally in either language. Our AI understands pronunciation, context, and cultural nuances.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Eye className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Visual Learning</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Upload images to learn vocabulary, analyze scenes, and connect visual concepts to language.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="font-semibold text-purple-900">AI Conversations</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    Chat with AI tutors who adapt to your learning style and provide cultural context.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <HeartIcon className="h-6 w-6 text-orange-600 mr-2" />
                    <h3 className="font-semibold text-orange-900">Cultural Bridge</h3>
                  </div>
                  <p className="text-sm text-orange-700">
                    Learn with deep respect for Kpelle traditions, stories, and community values.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-1" />
                    <span>Voice Recognition</span>
                  </div>
                  <div className="flex items-center">
                    <Languages className="h-4 w-4 mr-1" />
                    <span>Real-time Translation</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    <span>Adaptive Learning</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Starting...' : 'Begin Your Journey'}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Join thousands learning Kpelle and English with AI
                  </p>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Authentication Choice Step */}
        {step === 'auth-choice' && (
          <>
            <CardHeader className="text-center space-y-4">
              <CardTitle className="text-xl font-bold">Choose How to Continue</CardTitle>
              <CardDescription>
                Create an account to save your progress, or try as a guest
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button 
                  onClick={handleSignUp}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  Create Account
                </Button>

                <Button 
                  onClick={handleSignIn}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Sign In
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button 
                  onClick={handleTryAsGuest}
                  variant="ghost"
                  className="w-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating guest session...' : 'Try as Guest'}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Login Step */}
        {step === 'login' && (
          <>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={userInfo.password}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  onClick={handleLogin}
                  disabled={!userInfo.email.trim() || !userInfo.password.trim() || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Button 
                  onClick={() => setStep('auth-choice')}
                  variant="ghost"
                  className="w-full"
                  disabled={isLoading}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 'profile' && (
          <>
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>
                Help us personalize your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={userInfo.password}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Cultural Region (optional)</Label>
                <Input
                  id="region"
                  placeholder="e.g., Nimba County, Liberia"
                  value={userInfo.culturalRegion}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, culturalRegion: e.target.value }))}
                />
              </div>
              <Button 
                onClick={handleProfileSubmit}
                disabled={!userInfo.name.trim() || !userInfo.email.trim() || !userInfo.password.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Continuing...' : 'Continue'}
              </Button>

              <Button 
                onClick={() => setStep('auth-choice')}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
            </CardContent>
          </>
        )}

        {step === 'preferences' && (
          <>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
              <CardDescription>
                Customize your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Language</Label>
                  <Select
                    value={userInfo.primaryLanguage}
                    onValueChange={(value: Language) => 
                      setUserInfo(prev => ({ ...prev, primaryLanguage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="kpe">Kpɛlɛ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Learning</Label>
                  <Select
                    value={userInfo.targetLanguage}
                    onValueChange={(value: Language) => 
                      setUserInfo(prev => ({ ...prev, targetLanguage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kpe">Kpɛlɛ</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Learning Level</Label>
                <Select
                  value={userInfo.learningLevel}
                  onValueChange={(value: typeof userInfo.learningLevel) => 
                    setUserInfo(prev => ({ ...prev, learningLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Learning Goals (optional)</Label>
                <div className="grid grid-cols-1 gap-2">
                  {learningGoals.map(goal => (
                    <label
                      key={goal}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={userInfo.learningGoals.includes(goal)}
                        onChange={() => toggleGoal(goal)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Start Learning'}
              </Button>

              <Button 
                onClick={() => setStep('profile')}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
