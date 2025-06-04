'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/lib/stores/learning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Volume2, 
  BookOpen, 
  MessageSquare,
  Mic,
  Play,
  ArrowRight,
  Target,
  Trophy,
  Clock,
  Zap,
  Globe,
  Heart,
  Star
} from 'lucide-react';

export function PracticeHubView() {
  const router = useRouter();
  const { 
    user, 
    currentLanguage, 
    targetLanguage, 
    currentSubject,
    practiceSession 
  } = useLearningStore();

  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  // Core learning activities that connect to our main service pages
  const coreActivities = [
    {
      id: 'listening',
      title: 'Listening Practice',
      description: 'Improve comprehension with audio exercises and conversations',
      icon: Volume2,
      route: '/listening',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      skills: ['Audio Comprehension', 'Native Pronunciation', 'Context Understanding'],
      duration: '10-15 min',
      difficulty: 'Beginner to Advanced',
      xpReward: 15,
      completedToday: false
    },
    {
      id: 'stories',
      title: 'Interactive Stories',
      description: 'Learn through engaging cultural stories and narratives',
      icon: BookOpen,
      route: '/stories',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
      skills: ['Reading Comprehension', 'Cultural Context', 'Vocabulary Building'],
      duration: '15-20 min',
      difficulty: 'All Levels',
      xpReward: 20,
      completedToday: true
    },
    {
      id: 'voice-practice',
      title: 'Voice Practice',
      description: 'Perfect your pronunciation with AI-powered feedback',
      icon: Mic,
      route: '/voice-practice',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
      skills: ['Pronunciation', 'Speaking Confidence', 'Accent Training'],
      duration: '5-10 min',
      difficulty: 'Beginner to Intermediate',
      xpReward: 12,
      completedToday: false
    },
    {
      id: 'ai-chat',
      title: 'AI Conversation',
      description: 'Chat with AI tutors in both languages for real practice',
      icon: MessageSquare,
      route: '/ai-chat',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
      skills: ['Conversation Practice', 'Real-time Feedback', 'Cultural Etiquette'],
      duration: '10-30 min',
      difficulty: 'Intermediate to Advanced',
      xpReward: 25,
      completedToday: false
    }
  ];

  // Language information
  const languageInfo = {
    current: currentLanguage === 'en' ? '🇺🇸 English' : '🇱🇷 Kpelle',
    target: targetLanguage === 'kpe' ? '🇱🇷 Kpelle' : '🇺🇸 English',
    direction: currentLanguage === 'en' ? 'Learning Kpelle' : 'Learning English'
  };

  // Today's progress
  const todayProgress = {
    activitiesCompleted: coreActivities.filter(a => a.completedToday).length,
    totalActivities: coreActivities.length,
    xpEarned: 20,
    streakDays: user?.progress?.currentStreak || 0,
    timeSpent: 25 // minutes
  };

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity.id);
    router.push(activity.route);
  };

  const handleQuickStart = () => {
    // Start with the first incomplete activity
    const nextActivity = coreActivities.find(a => !a.completedToday) || coreActivities[0];
    router.push(nextActivity.route);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Practice Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {languageInfo.direction} • Choose your learning activity
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium">
              {languageInfo.current} → {languageInfo.target}
            </span>
          </div>
          <Button onClick={handleQuickStart} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Play className="w-4 h-4 mr-2" />
            Quick Start
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{todayProgress.activitiesCompleted}/{todayProgress.totalActivities}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{todayProgress.xpEarned}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{todayProgress.streakDays}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{todayProgress.timeSpent}m</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
            </div>
          </div>
          <Progress 
            value={(todayProgress.activitiesCompleted / todayProgress.totalActivities) * 100} 
            className="mt-4"
          />
        </CardContent>
      </Card>

      {/* Core Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {coreActivities.map((activity) => {
          const Icon = activity.icon;
          return (
            <Card 
              key={activity.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2 ${
                selectedActivity === activity.id 
                  ? 'border-blue-500 shadow-lg scale-[1.02]' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleActivitySelect(activity)}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${activity.gradient}`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${activity.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {activity.description}
                      </CardDescription>
                    </div>
                  </div>
                  {activity.completedToday && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <Star className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Skills */}
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Skills You'll Practice:</div>
                  <div className="flex flex-wrap gap-1">
                    {activity.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Activity Details */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{activity.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{activity.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Zap className="w-4 h-4" />
                    <span>{activity.xpReward} XP</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-4"
                  variant={activity.completedToday ? "outline" : "default"}
                >
                  {activity.completedToday ? 'Practice Again' : 'Start Practice'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cultural Learning Note */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <CardContent className="flex items-center gap-4 pt-6">
          <Heart className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">Cultural Bridge Learning</h3>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Each activity respects Kpelle traditions while building English skills. 
              Learn language with cultural context and community values.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
