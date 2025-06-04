/**
 * AnalyticsView Component
 * Comprehensive progress visualization and learning analytics
 */

'use client';

import { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { nuruAI, type PerformanceAnalysisRequest } from '@/lib/services/enhanced-nuru-ai';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Trophy,
  Star,
  Zap,
  Brain,
  Globe,
  Users,
  BookOpen,
  Mic,
  MessageSquare,
  Image as ImageIcon,
  Award,
  Flame,
  Activity,
  PieChart,
  LineChart,
  MoreHorizontal,
  Download,
  Share2,
  Filter,
  RefreshCw,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import type { LearningAnalytics } from '@/lib/types/education';

export function AnalyticsView() {
  const {
    currentUser,
    isAuthenticated,
    progress,
    currentSubject
  } = useLearningStore();

  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'speaking' | 'listening' | 'reading' | 'writing'>('overall');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<{
    studyTimeInsight: string;
    accuracyInsight: string;
    skillsInsight: string;
    nextSteps: string[];
  } | null>(null);

  // Generate AI-powered analytics insights
  const generateAIInsights = async () => {
    if (!currentUser || !progress?.activitiesCompleted) return;

    setIsLoadingAI(true);
    
    try {
      // Check if Nuru AI service is available
      const isHealthy = await nuruAI.healthCheck();
      
      if (isHealthy) {
        // Create performance analysis request based on user's progress
        const performanceRequest: PerformanceAnalysisRequest = {
          userId: currentUser.id || 'anonymous',
          sessionData: {
            activitiesCompleted: progress.activitiesCompleted,
            totalStudyTime: progress.timeSpentMinutes || 0,
            currentStreak: progress.currentStreak || 0,
            subject: currentSubject || 'language-arts',
            proficiencyLevel: currentUser.proficiencyLevel || 'beginner'
          },
          timeframe: 'month'
        };

        // Get AI analysis
        const analysis = await nuruAI.analyzePerformance(performanceRequest);
        
        // Generate AI recommendations for skills improvement
        const recommendations = [
          ...analysis.recommendations,
          ...analysis.suggestions,
          ...analysis.next_steps
        ].filter(Boolean).slice(0, 3); // Take top 3 recommendations
        
        setAiRecommendations(recommendations);
        
        // Generate contextual insights
        const insights = {
          studyTimeInsight: analysis.feedback || 'Your study pattern shows consistent engagement. Keep maintaining regular practice sessions.',
          accuracyInsight: `Your current performance is at ${analysis.overall_score}% accuracy. ${analysis.overall_score >= 80 ? 'Excellent work!' : analysis.overall_score >= 60 ? 'Good progress - keep practicing!' : 'Focus on fundamental concepts to improve.'}`,
          skillsInsight: analysis.strengths.length > 0 
            ? `Your strongest areas include: ${analysis.strengths.join(', ')}. ${analysis.weaknesses.length > 0 ? `Consider focusing more on: ${analysis.weaknesses.slice(0, 2).join(', ')}.` : ''}`
            : 'Continue practicing to identify your strongest skills.',
          nextSteps: analysis.next_steps.length > 0 ? analysis.next_steps : ['Continue regular practice', 'Review challenging concepts', 'Engage with cultural content']
        };
        
        setAiInsights(insights);
      } else {
        // Fallback recommendations when AI is unavailable
        setAiRecommendations([
          'Practice speaking exercises daily for better pronunciation',
          'Focus on cultural context to deepen understanding',
          'Review vocabulary regularly to improve retention'
        ]);
      }
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      // Fallback recommendations on error
      setAiRecommendations([
        'Maintain consistent daily practice sessions',
        'Focus on areas where you feel less confident',
        'Engage with multimedia content for better retention'
      ]);
    }
    
    setIsLoadingAI(false);
  };

  // Generate AI insights when component mounts or user data changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      generateAIInsights();
    }
  }, [isAuthenticated, currentUser, progress?.activitiesCompleted, currentSubject]);

  // Mock analytics data - in production this would come from the API
  const mockAnalyticsData = {
    // Direct properties for the view
    totalStudyTime: 2340,
    totalLessons: 45,
    totalPractices: 128,
    totalXP: 4250,
    currentStreak: 12,
    longestStreak: 28,
    averageSessionTime: 25,
    completionRate: 87,
    accuracy: 92,
    
    // Weekly activity chart data
    weeklyActivity: [
      { date: '2024-01-01', minutes: 45, day: 'Mon', xp: 90 },
      { date: '2024-01-02', minutes: 60, day: 'Tue', xp: 120 },
      { date: '2024-01-03', minutes: 30, day: 'Wed', xp: 60 },
      { date: '2024-01-04', minutes: 75, day: 'Thu', xp: 150 },
      { date: '2024-01-05', minutes: 50, day: 'Fri', xp: 100 },
      { date: '2024-01-06', minutes: 40, day: 'Sat', xp: 80 },
      { date: '2024-01-07', minutes: 55, day: 'Sun', xp: 110 }
    ],
    
    // Skills progress data
    skillProgress: {
      'speaking': { level: 3, progress: 75, xp: 450 },
      'listening': { level: 4, progress: 82, xp: 680 },
      'reading': { level: 2, progress: 65, xp: 320 },
      'writing': { level: 2, progress: 58, xp: 290 },
      'cultural_understanding': { level: 3, progress: 78, xp: 520 }
    },
    
    // Subject breakdown
    subjectBreakdown: {
      'language-arts': { lessons: 28, time: 1420, xp: 2840, accuracy: 91 },
      'mathematics': { lessons: 12, time: 580, xp: 1160, accuracy: 94 },
      'science': { lessons: 8, time: 340, xp: 680, accuracy: 89 }
    },
    
    // Achievements
    achievements: [
      { id: '1', name: 'First Steps', description: 'Complete your first lesson', earned: true, date: '2024-01-01' },
      { id: '2', name: 'Streak Master', description: 'Maintain a 7-day streak', earned: true, date: '2024-01-08' },
      { id: '3', name: 'Cultural Explorer', description: 'Complete 10 cultural lessons', earned: true, date: '2024-01-15' },
      { id: '4', name: 'Pronunciation Pro', description: 'Score 95% on voice lessons', earned: false, date: null },
      { id: '5', name: 'Polyglot', description: 'Reach level 5 in all skills', earned: false, date: null }
    ],
    
    // Monthly goals
    monthlyGoals: {
      studyTime: { target: 800, current: 567, unit: 'minutes' },
      lessons: { target: 20, current: 15, unit: 'lessons' },
      streak: { target: 30, current: 12, unit: 'days' },
      xp: { target: 2000, current: 1340, unit: 'points' }
    }
  };

  const analytics = mockAnalyticsData;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'speaking': return <Mic className="w-4 h-4" />;
      case 'listening': return <Activity className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      case 'writing': return <MessageSquare className="w-4 h-4" />;
      case 'cultural_understanding': return <Globe className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'speaking': return 'text-blue-500';
      case 'listening': return 'text-green-500';
      case 'reading': return 'text-purple-500';
      case 'writing': return 'text-orange-500';
      case 'cultural_understanding': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-primary-500 mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your learning analytics and progress.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600">Track your progress and insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedTimeRange} onValueChange={(value) => setSelectedTimeRange(value as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateAIInsights}
            disabled={isLoadingAI}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAI ? 'animate-spin' : ''}`} />
            Refresh AI Insights
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(analytics.totalStudyTime)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">XP Earned</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalXP.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.currentStreak} days</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Star className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-sm text-gray-600">Best: {analytics.longestStreak} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.accuracy}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+3% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Weekly Activity</span>
                </CardTitle>
                <CardDescription>Your learning activity over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.weeklyActivity.map((day, index) => {
                    const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                    const maxMinutes = Math.max(...analytics.weeklyActivity.map(d => d.minutes));
                    const width = maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;
                    const progressClass = `progress-${Math.round(width / 10) * 10}`;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{dayName}</span>
                          <div className="flex space-x-4 text-gray-600">
                            <span>{day.minutes}m</span>
                            <span>{day.xp} XP</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-primary-500 h-2 rounded-full transition-all duration-300 ${progressClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>AI Analytics Summary</span>
                </CardTitle>
                <CardDescription>AI-powered insights about your learning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Study Pattern Analysis</h4>
                      <p className="text-sm text-gray-600">{aiInsights.studyTimeInsight}</p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Performance Insight</h4>
                      <p className="text-sm text-gray-600">{aiInsights.accuracyInsight}</p>
                    </div>
                    
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Skills Assessment</h4>
                      <p className="text-sm text-gray-600">{aiInsights.skillsInsight}</p>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="font-medium text-gray-900 mb-2">Recommended Next Steps</h4>
                      <div className="space-y-1">
                        {aiInsights.nextSteps.slice(0, 3).map((step, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <ArrowRight className="w-3 h-3 mr-2 text-blue-500" />
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Fallback content when AI insights are loading or unavailable
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalLessons}</div>
                        <div className="text-sm text-gray-600">Lessons Completed</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.totalPractices}</div>
                        <div className="text-sm text-gray-600">Practice Sessions</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Session</span>
                        <span className="font-medium">{analytics.averageSessionTime} min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="font-medium">{analytics.completionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Best Streak</span>
                        <span className="font-medium">{analytics.longestStreak} days</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Skills Progress</span>
                  {aiInsights && (
                    <Badge variant="outline" className="ml-2">
                      AI Enhanced
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {aiInsights 
                    ? 'AI-analyzed proficiency in different language skills' 
                    : 'Your proficiency in different language skills'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analytics.skillProgress).map(([skill, data]) => (
                  <div key={skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={getSkillColor(skill)}>
                          {getSkillIcon(skill)}
                        </span>
                        <span className="font-medium capitalize">{skill.replace('_', ' ')}</span>
                        <Badge variant="outline">Level {data.level}</Badge>
                      </div>
                      <span className="text-sm text-gray-600">{data.progress}%</span>
                    </div>
                    <Progress value={data.progress} className="h-2" />
                    <div className="text-xs text-gray-600">{data.xp} XP earned</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skill Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>AI Recommendations</span>
                  {isLoadingAI && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2" />
                  )}
                </CardTitle>
                <CardDescription>Personalized suggestions from AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiRecommendations.length > 0 ? (
                    aiRecommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-700">AI Recommendation {index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {recommendation}
                        </p>
                      </div>
                    ))
                  ) : (
                    // Fallback recommendations when AI data is loading or unavailable
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Mic className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-blue-700">Speaking Practice</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Focus on pronunciation exercises to reach Level 4. Try daily voice practice sessions.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-green-700">Writing Skills</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Your writing could improve with more grammar exercises and cultural context practice.
                        </p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-purple-700">Cultural Understanding</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Excellent progress! Continue exploring traditional stories and customs.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          {aiInsights && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-700">AI-Enhanced Subject Analysis</span>
                <Badge variant="secondary">Live</Badge>
              </div>
              <p className="text-sm text-gray-600">
                Subject performance data has been analyzed by AI to provide personalized insights and recommendations.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(analytics.subjectBreakdown).map(([subject, data]) => (
              <Card key={subject}>
                <CardHeader>
                  <CardTitle className="capitalize text-lg">{subject.replace('_', ' ')}</CardTitle>
                  <CardDescription>{data.lessons} lessons completed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary-500">{formatTime(data.time)}</div>
                      <div className="text-xs text-gray-600">Study Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-secondary-500">{data.xp}</div>
                      <div className="text-xs text-gray-600">XP Earned</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Accuracy</span>
                      <span className="font-medium">{data.accuracy}%</span>
                    </div>
                    <Progress value={data.accuracy} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.achievements.map((achievement) => (
              <Card key={achievement.id} className={`${achievement.earned ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-full ${achievement.earned ? 'bg-yellow-100' : 'bg-gray-200'}`}>
                      {achievement.earned ? (
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <Award className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      {achievement.earned && achievement.date && (
                        <p className="text-xs text-yellow-600 font-medium mt-1">
                          Earned on {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(analytics.monthlyGoals).map(([goal, data]) => {
              const progress = (data.current / data.target) * 100;
              
              return (
                <Card key={goal}>
                  <CardHeader>
                    <CardTitle className="capitalize text-lg">{goal.replace('_', ' ')} Goal</CardTitle>
                    <CardDescription>Monthly target for {selectedTimeRange}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-primary-500">
                        {data.current.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-600">
                        / {data.target.toLocaleString()} {data.unit}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {data.target - data.current > 0 ? (
                        <span>{data.target - data.current} {data.unit} remaining</span>
                      ) : (
                        <span className="text-green-600 font-medium">Goal achieved! 🎉</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription>Personalized recommendations based on your learning data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Study Time Analysis</h4>
                      <p className="text-sm text-gray-600">{aiInsights.studyTimeInsight}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Performance Insights</h4>
                      <p className="text-sm text-gray-600">{aiInsights.accuracyInsight}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Skills Assessment</h4>
                      <p className="text-sm text-gray-600">{aiInsights.skillsInsight}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Loading AI insights...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Smart Recommendations</span>
                </CardTitle>
                <CardDescription>AI-generated suggestions to improve your learning</CardDescription>
              </CardHeader>
              <CardContent>
                {aiRecommendations.length > 0 ? (
                  <div className="space-y-3">
                    {aiRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-medium text-primary-600">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Loading recommendations...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
