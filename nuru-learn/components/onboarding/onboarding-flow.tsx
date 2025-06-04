/**
 * Full-Screen Onboarding Flow
 * Immersive, responsive onboarding experience for Nuru Learn
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { AuthService } from '@/lib/auth/enhanced-auth';
import { Language } from '@/lib/types/education';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight,
  ArrowLeft,
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
  Languages,
  UserCheck,
  Headphones,
  Users,
  CheckCircle,
  Play
} from 'lucide-react';

type OnboardingStep = 'welcome' | 'features' | 'language-setup' | 'auth-choice' | 'signup' | 'signin' | 'verify-email' | 'complete';

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    password: '',
    verificationCode: '',
    primaryLanguage: 'en' as Language,
    targetLanguage: 'kpe' as Language,
    learningLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    culturalRegion: ''
  });

  const { initializeUser, initializeSession, addNotification } = useLearningStore();

  // Auto-advance welcome step
  useEffect(() => {
    if (step === 'welcome') {
      const timer = setTimeout(() => setStep('features'), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'features', 'language-setup', 'auth-choice'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: OnboardingStep[] = ['welcome', 'features', 'language-setup', 'auth-choice'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleTryAsGuest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const guestUser = await AuthService.createGuestSession();
      await initializeUser(guestUser as any);
      
      // Skip problematic database operations for guest users
      await initializeSession();
      
      addNotification({
        type: 'success',
        title: 'Welcome to Nuru Learn!',
        message: 'Your guest session is ready. Start exploring AI-powered education!'
      });
      
      router.push('/');
      
    } catch (err) {
      console.error('Guest login error:', err);
      setError('Failed to create guest session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { user } = await AuthService.signUp(userInfo.email, userInfo.password, {
        name: userInfo.name
      });

      if (user) {
        // Check if email confirmation is required
        if (!user.email_confirmed_at) {
          addNotification({
            type: 'info',
            title: 'Verify Your Email',
            message: 'Please check your email and enter the verification code.'
          });
          setStep('verify-email');
        } else {
          // Email already confirmed, proceed with initialization
          try {
            await initializeUser(user);
            await initializeSession();
            
            addNotification({
              type: 'success',
              title: 'Account Created!',
              message: `Welcome to Nuru Learn, ${userInfo.name}! Your learning journey begins now.`
            });
            
            setStep('complete');
            setTimeout(() => router.push('/'), 2000);
          } catch (dbError) {
            console.warn('Database initialization failed:', dbError);
            setError('Account created but there was an issue setting up your profile. Please try signing in.');
          }
        }
      }

    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { user } = await AuthService.signIn(userInfo.email, userInfo.password);

      if (user) {
        await initializeUser(user);
        await initializeSession();
        
        addNotification({
          type: 'success',
          title: 'Welcome Back!',
          message: 'Successfully signed in. Continuing your learning journey...'
        });
        
        router.push('/');
      }

    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { user } = await AuthService.verifyEmail(userInfo.email, userInfo.verificationCode);

      if (user) {
        // Initialize user data after successful verification
        try {
          await initializeUser(user);
          await initializeSession();
          
          addNotification({
            type: 'success',
            title: 'Email Verified!',
            message: `Welcome to Nuru Learn, ${userInfo.name}! Your learning journey begins now.`
          });
          
          setStep('complete');
          setTimeout(() => router.push('/'), 2000);
        } catch (dbError) {
          console.warn('Database initialization failed:', dbError);
          setError('Email verified but there was an issue setting up your profile. Please try signing in.');
        }
      }

    } catch (err: any) {
      console.error('Email verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.resendVerificationEmail(userInfo.email);
      
      addNotification({
        type: 'success',
        title: 'Code Resent',
        message: 'A new verification code has been sent to your email.'
      });

    } catch (err: any) {
      console.error('Resend verification error:', err);
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Welcome Step */}
      {step === 'welcome' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nuru Learn
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                AI-Powered Education for Kpelle Heritage
              </p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-4 py-2 text-lg">
                <Zap className="h-5 w-5 mr-2" />
                Powered by Nuru AI
              </Badge>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={() => setStep('features')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Features Showcase */}
      {step === 'features' && (
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Experience AI-Powered Learning
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Cutting-edge AI that understands both languages and cultures. Learn through voice, 
                image, and interactive conversations while preserving Kpelle traditions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mic className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Voice Intelligence</h3>
                  <p className="text-sm text-blue-700">
                    Natural speech recognition in both Kpelle and English with cultural context understanding.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Eye className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900 mb-2">Visual Learning</h3>
                  <p className="text-sm text-green-700">
                    Upload images to learn vocabulary, analyze scenes, and connect visual concepts to language.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-900 mb-2">AI Conversations</h3>
                  <p className="text-sm text-purple-700">
                    Interactive AI tutors that adapt to your learning style and provide cultural insights.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <HeartIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2">Cultural Bridge</h3>
                  <p className="text-sm text-orange-700">
                    Deep respect for Kpelle traditions, stories, and community values in every lesson.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-center space-x-8 text-gray-600 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5" />
                  <span>Voice Recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Languages className="h-5 w-5" />
                  <span>Real-time Translation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Headphones className="h-5 w-5" />
                  <span>Audio Generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Adaptive Learning</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-12 space-x-4">
              <Button variant="outline" onClick={handleBack} className="px-6 py-3">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Language Setup */}
      {step === 'language-setup' && (
        <div className="min-h-screen p-4 md:p-8 flex items-center">
          <div className="max-w-4xl mx-auto w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Choose Your Learning Path
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Nuru Learn adapts to your language preferences, creating a personalized bilingual experience.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Primary Language */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-transparent hover:border-blue-200 transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <UserCheck className="h-6 w-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold">Primary Language</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">The language you're most comfortable with</p>
                  
                  <div className="space-y-3">
                    {[
                      { value: 'en', label: 'English', flag: '🇺🇸', desc: 'Global communication and academic language' },
                      { value: 'kpe', label: 'Kpelle', flag: '🇱🇷', desc: 'Indigenous Liberian language rich in oral tradition' }
                    ].map((lang) => (
                      <Card
                        key={lang.value}
                        className={`cursor-pointer transition-all ${
                          userInfo.primaryLanguage === lang.value
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setUserInfo(prev => ({ 
                          ...prev, 
                          primaryLanguage: lang.value as Language,
                          targetLanguage: lang.value === 'en' ? 'kpe' : 'en'
                        }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{lang.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium">{lang.label}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{lang.desc}</div>
                            </div>
                            {userInfo.primaryLanguage === lang.value && (
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Target Language */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-transparent hover:border-green-200 transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Languages className="h-6 w-6 text-green-600 mr-3" />
                    <h3 className="text-xl font-semibold">Target Language</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">The language you want to learn</p>
                  
                  <Card className="ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {userInfo.targetLanguage === 'en' ? '🇺🇸' : '🇱🇷'}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">
                            {userInfo.targetLanguage === 'en' ? 'English' : 'Kpelle'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {userInfo.targetLanguage === 'en' 
                              ? 'Global communication and academic language'
                              : 'Indigenous Liberian language rich in oral tradition'
                            }
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-8">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <SparklesIcon className="h-6 w-6 text-amber-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">AI Adaptation</h4>
                    <p className="text-amber-700 dark:text-amber-300">
                      Our system will automatically adjust content difficulty, provide translations when needed, 
                      and offer cultural context to enhance your learning experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={handleBack} className="px-6 py-3">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 px-8 py-3">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Choice */}
      {step === 'auth-choice' && (
        <div className="min-h-screen p-4 md:p-8 flex items-center">
          <div className="max-w-2xl mx-auto w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Begin?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Create an account to save your progress, or explore as a guest
              </p>
            </div>

            {error && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
                <CardContent className="p-4">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4 mb-8">
              <Button 
                onClick={() => setStep('signup')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg"
                disabled={isLoading}
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                Create Account & Start Learning
              </Button>

              <Button 
                onClick={() => setStep('signin')}
                variant="outline"
                className="w-full py-4 text-lg"
                disabled={isLoading}
              >
                Sign In to Existing Account
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-white dark:bg-gray-900 px-3 text-gray-500">Or</span>
                </div>
              </div>

              <Button 
                onClick={handleTryAsGuest}
                variant="ghost"
                className="w-full py-4 text-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={isLoading}
              >
                <Play className="mr-2 h-5 w-5" />
                {isLoading ? 'Creating guest session...' : 'Try as Guest'}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Join thousands learning Kpelle and English with AI
            </div>

            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={handleBack} className="px-6 py-3">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Up */}
      {step === 'signup' && (
        <div className="min-h-screen p-4 md:p-8 flex items-center">
          <div className="max-w-lg mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Join the Nuru Learn community
              </p>
            </div>

            {error && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
                <CardContent className="p-4">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
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
                    placeholder="Create a secure password"
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
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  onClick={handleSignUp}
                  disabled={!userInfo.name.trim() || !userInfo.email.trim() || !userInfo.password.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3"
                >
                  {isLoading ? 'Creating account...' : 'Create Account & Start Learning'}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-4">
              <Button variant="outline" onClick={() => setStep('auth-choice')} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sign In */}
      {step === 'signin' && (
        <div className="min-h-screen p-4 md:p-8 flex items-center">
          <div className="max-w-lg mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Continue your learning journey
              </p>
            </div>

            {error && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
                <CardContent className="p-4">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={userInfo.password}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  onClick={handleSignIn}
                  disabled={!userInfo.email.trim() || !userInfo.password.trim() || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-4">
              <Button variant="outline" onClick={() => setStep('auth-choice')} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification */}
      {step === 'verify-email' && (
        <div className="min-h-screen p-4 md:p-8 flex items-center">
          <div className="max-w-lg mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verify Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We've sent a verification code to <strong>{userInfo.email}</strong>
              </p>
            </div>

            {error && (
              <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 mb-6">
                <CardContent className="p-4">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={userInfo.verificationCode || ''}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, verificationCode: e.target.value }))}
                    disabled={isLoading}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <Button 
                  onClick={handleVerifyEmail}
                  disabled={!userInfo.verificationCode?.trim() || userInfo.verificationCode.length !== 6 || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3"
                >
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Didn't receive the code?
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Resend Code
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 space-x-4">
              <Button variant="outline" onClick={() => setStep('signup')} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completion */}
      {step === 'complete' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Welcome to Nuru Learn!
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Your account has been created successfully. You'll be redirected to your learning dashboard shortly.
              </p>
              <div className="flex justify-center">
                <Badge variant="secondary" className="bg-green-100 text-green-800 px-4 py-2">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Ready to Learn
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
