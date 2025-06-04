/**
 * Advanced Dashboard with Multimodal Features
 * Main hub for learning activities, progress, and AI interactions
 */

'use client';

import { useEffect, useState } from 'react';
import { useLearningStore, useProgress } from '@/lib/stores/enhanced-learning';
import { nuruAI } from '@/lib/services/enhanced-nuru-ai';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  BookOpenIcon,
  MicIcon,
  CameraIcon,
  ChartBarIcon,
  FlameIcon,
  TrophyIcon,
  SparklesIcon,
  PlayIcon,
  ClockIcon,
  Globe,
  Volume2,
  ChevronDown
} from 'lucide-react';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { LearningStreak } from '@/components/dashboard/learning-streak';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export function Dashboard() {
  const { currentUser } = useLearningStore();
  const progress = useProgress();
  const { 
    currentSession, 
    generateLesson, 
    isLoading  } = useLearningStore();
  const [showAIFeatures, setShowAIFeatures] = useState(false);
  const [isHealthy, setIsHealthy] = useState(false);
  const router = useRouter();
  
  // Check Nuru AI health status
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthStatus = await nuruAI.healthCheck();
        setIsHealthy(healthStatus.status === 'healthy');
      } catch (error) {
        setIsHealthy(false);
      }
    };
    
    checkHealth();
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Local state for lesson generation
  const [localGeneratedLessons, setLocalGeneratedLessons] = useState<any[]>([]);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  // Generate a new lesson using enhanced service
  const generateNewLesson = async (topic: string, subject: 'language-arts' | 'mathematics' | 'culture') => {
    if (!isHealthy) {
      return;
    }

    try {
      setIsGeneratingLesson(true);
      
      const lessonRequest = {
        subject: subject,
        topic: topic,
        difficulty: 'beginner' as const,
        language: 'en' as const,
        duration_minutes: 20,
        learning_objectives: [
          `Learn essential concepts about ${topic}`,
          'Understand cultural context',
          'Practice pronunciation and usage'
        ]
      };

      // Use the enhanced store's generateLesson method
      const generatedLesson = await generateLesson(lessonRequest);
      
      // Add to local state for immediate display
      if (generatedLesson) {
        setLocalGeneratedLessons(prev => [generatedLesson, ...prev]);
      }
      
    } catch (error) {
      console.error('Failed to generate lesson:', error);
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  useEffect(() => {
    // This effect would normally load lessons
    // We're using mock data instead
  }, [currentUser]);

  useEffect(() => {
    // This effect would normally get AI insights
    // We're not implementing this for now
  }, [currentUser, progress]);

  // Create a mock todayProgress object based on the actual ProgressMetrics fields
  const todayProgress = progress ? {
    timeToday: progress.timeSpentMinutes || 0,
    dailyGoal: 30, // 30 minutes daily goal
    streak: progress.currentStreak || 0,
    level: 1, // Mock value since we don't have level in ProgressMetrics
    nextLevelXP: 1000 // Mock value
  } : null;

  // Use the mock lessons directly
  const allLessons = [...localGeneratedLessons];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {currentUser?.name?.split(' ')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Ready to continue your Kpɛlɛ learning journey?
          </p>
        </div>
        {!currentSession && (
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => router.push('/listening')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Start Learning
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Choose Activity
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/listening')}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">Listening Practice</div>
                    <div className="text-xs text-gray-500">Audio comprehension</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/stories')}>
                  <BookOpenIcon className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">Story Reading</div>
                    <div className="text-xs text-gray-500">Interactive stories</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/voice-practice')}>
                  <MicIcon className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">Voice Practice</div>
                    <div className="text-xs text-gray-500">Speech recognition</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ai-chat')}>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  <div>
                    <div className="font-medium">AI Chat</div>
                    <div className="text-xs text-gray-500">Conversation practice</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Nuru AI Status Indicator */}
      <Card className={`border-2 transition-all duration-300 ${
        isHealthy 
          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800' 
          : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isLoading 
                  ? 'bg-blue-500 animate-pulse' 
                  : isHealthy 
                    ? 'bg-green-500' 
                    : 'bg-amber-500'
              }`} />
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${
                    isHealthy 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    Nuru AI: {isLoading ? 'Connecting...' : isHealthy ? 'Online' : 'Limited Mode'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Core Service
                  </Badge>
                </div>
                <p className={`text-sm ${
                  isHealthy 
                    ? 'text-green-600 dark:text-green-300' 
                    : 'text-amber-600 dark:text-amber-300'
                }`}>
                  {isHealthy 
                    ? 'Full multimodal AI features: Kpelle speech recognition, translation, and cultural context generation' 
                    : 'Demo mode - shows how developers would integrate AI features when service is unavailable'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAIFeatures(!showAIFeatures)}
              className={
                isHealthy 
                  ? 'border-green-300 text-green-700 hover:bg-green-100' 
                  : 'border-amber-300 text-amber-700 hover:bg-amber-100'
              }
            >
              {showAIFeatures ? 'Hide' : 'Show'} AI Features
            </Button>
          </div>
          
          {/* AI Features Panel */}
          {showAIFeatures && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Nuru AI Multimodal Capabilities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <MicIcon className={`w-4 h-4 ${isHealthy ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <span className={`text-sm ${isHealthy ? 'text-green-700' : 'text-gray-500'}`}>
                      Kpelle Speech Recognition
                    </span>
                    <p className="text-xs text-gray-500">Convert Kpelle audio to text</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CameraIcon className={`w-4 h-4 ${isHealthy ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <span className={`text-sm ${isHealthy ? 'text-green-700' : 'text-gray-500'}`}>
                      Cultural Image Analysis
                    </span>
                    <p className="text-xs text-gray-500">Understand cultural contexts</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <SparklesIcon className={`w-4 h-4 ${isHealthy ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <span className={`text-sm ${isHealthy ? 'text-green-700' : 'text-gray-500'}`}>
                      Intelligent Content Generation
                    </span>
                    <p className="text-xs text-gray-500">Create culturally-aware lessons</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>First-of-its-kind:</strong> Nuru AI is the first multimodal AI service 
                  specifically designed for African languages, starting with Kpelle.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Session Alert */}
      {currentSession && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Session in progress: {currentSession.subject}
                </span>
                <Badge variant="secondary">
                  {Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 60000)} min
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/lessons')}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">Developer Feature</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayProgress?.timeToday || 0} min
            </div>
            <p className="text-xs text-muted-foreground">
              of {todayProgress?.dailyGoal || 30} min goal
            </p>
            <Progress 
              value={todayProgress ? (todayProgress.timeToday / todayProgress.dailyGoal) * 100 : 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <div className="flex items-center space-x-1">
              <FlameIcon className="w-4 h-4 text-orange-500" />
              <Badge variant="outline" className="text-xs">Developer Feature</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {todayProgress?.streak || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              days in a row
            </p>
          </CardContent>
        </Card>

        {/* Current Level */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level</CardTitle>
            <div className="flex items-center space-x-1">
              <TrophyIcon className="w-4 h-4 text-yellow-500" />
              <Badge variant="outline" className="text-xs">Developer Feature</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {todayProgress?.level || 1}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayProgress?.nextLevelXP || 1000} XP to next level
            </p>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
            <div className="flex items-center space-x-1">
              <SparklesIcon className="w-4 h-4 text-purple-500" />
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Nuru AI</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-purple-600 font-medium">
              {isHealthy ? 'Voice Practice' : 'AI Unavailable'}
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {isHealthy ? 'Focus area today' : 'Reconnect for insights'}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/analytics')}
              className="w-full text-xs"
              disabled={!isHealthy}
            >
              {isHealthy ? 'View Full Insights' : 'Connect Nuru AI'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Start Lessons */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpenIcon className="w-5 h-5" />
                <span>Generate Learning Content with Nuru AI</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Core Feature
                </Badge>
              </CardTitle>
              <CardDescription>
                Experience Nuru's unique Kpelle-English AI capabilities by generating personalized lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Nuru AI Generation Options */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={() => generateNewLesson('Basic Greetings in Kpelle', 'language-arts')}
                    disabled={!isHealthy || isGeneratingLesson}
                    className="flex flex-col items-center p-4 h-auto"
                    variant="outline"
                  >
                    <MicIcon className="w-5 h-5 mb-2" />
                    <span className="text-sm font-medium">Kpelle Greetings</span>
                    <span className="text-xs text-muted-foreground">Language Arts</span>
                  </Button>
                  
                  <Button
                    onClick={() => generateNewLesson('Counting in Kpelle', 'mathematics')}
                    disabled={!isHealthy || isGeneratingLesson}
                    className="flex flex-col items-center p-4 h-auto"
                    variant="outline"
                  >
                    <ChartBarIcon className="w-5 h-5 mb-2" />
                    <span className="text-sm font-medium">Kpelle Numbers</span>
                    <span className="text-xs text-muted-foreground">Mathematics</span>
                  </Button>
                  
                  <Button
                    onClick={() => generateNewLesson('Family & Relationships', 'culture')}
                    disabled={!isHealthy || isGeneratingLesson}
                    className="flex flex-col items-center p-4 h-auto"
                    variant="outline"
                  >
                    <SparklesIcon className="w-5 h-5 mb-2" />
                    <span className="text-sm font-medium">Family Terms</span>
                    <span className="text-xs text-muted-foreground">Cultural Context</span>
                  </Button>
                </div>
                
                {isGeneratingLesson && (
                  <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-blue-700 dark:text-blue-300">
                      Nuru AI is generating your personalized lesson...
                    </span>
                  </div>
                )}
                
                {!isHealthy && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">
                      <strong>AI Service Unavailable:</strong> Connect to Nuru AI to experience dynamic lesson generation. 
                      These buttons demonstrate how developers would integrate real-time content creation.
                    </p>
                  </div>
                )}
              </div>

              {/* Generated Lessons Display */}
              {allLessons.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Your Generated Lessons</h4>
                    <Badge variant="outline" className="text-xs">
                      {allLessons.length} AI-Generated
                    </Badge>
                  </div>
                  {allLessons.map((lesson: any) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                      onClick={() => router.push('/lessons')}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {lesson.title.en}
                          </h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            AI-Generated
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {lesson.description.en}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Level {lesson.difficulty}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {lesson.estimatedDuration} min
                          </span>
                          <span className="text-xs text-gray-400">
                            Generated {new Date(lesson.generatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <PlayIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <BookOpenIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    No lessons generated yet
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Click the buttons above to generate personalized Kpelle learning content with Nuru AI
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Developer Feature: Content would be stored in your backend
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <RecentActivity />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          {/* Learning Streak */}
          <LearningStreak />

          {/* Cultural Spotlight Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Cultural Heritage</span>
                <Badge variant="outline" className="text-xs">
                  Developer Feature
                </Badge>
              </CardTitle>
              <CardDescription>
                Explore Kpelle traditions and stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                  <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Discover Kpelle Culture
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Learn about traditions, stories, and wisdom of the Kpelle people
                </p>
                <Button 
                  onClick={() => router.push('/culture')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Explore Culture
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
