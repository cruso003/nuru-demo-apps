"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Mic, 
  Camera, 
  MessageCircle, 
  BookOpen,
  Headphones,
  Trophy,
  TrendingUp,
  Play,
  MoreHorizontal,
  ArrowUpRight,
  Star,
  Volume2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLearningStore } from '@/lib/stores/enhanced-learning';

interface ActivityItem {
  id: string;
  type: 'voice_practice' | 'conversation' | 'image_analysis' | 'story_listening' | 'listening_comprehension' | 'daily_challenge';
  title: string;
  description: string;
  timestamp: Date;
  duration: number; // in minutes
  score?: number;
  badge?: string;
  progress?: number;
  isCompleted: boolean;
}

export function RecentActivity() {
  const { currentUser } = useLearningStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Generate recent activities based on user progress (simplified for now)
  useEffect(() => {
    const generateActivities = (): ActivityItem[] => {
      const now = new Date();
      const activities: ActivityItem[] = [];

      // Add some sample recent activities
      const sampleActivities: Partial<ActivityItem>[] = [
        {
          type: 'voice_practice',
          title: 'Pronunciation Practice',
          description: 'Practiced basic greetings in Kpelle',
          duration: 15,
          score: 92,
          badge: 'Perfect Pronunciation',
          isCompleted: true
        },
        {
          type: 'conversation',
          title: 'AI Conversation',
          description: 'Chat about daily activities',
          duration: 12,
          score: 88,
          isCompleted: true
        },
        {
          type: 'image_analysis',
          title: 'Visual Learning',
          description: 'Learned about traditional Kpelle items',
          duration: 8,
          score: 95,
          badge: 'Culture Explorer',
          isCompleted: true
        },
        {
          type: 'story_listening',
          title: 'Story Time',
          description: 'Listened to "The Clever Spider"',
          duration: 20,
          score: 90,
          isCompleted: true
        },
        {
          type: 'daily_challenge',
          title: 'Daily Challenge',
          description: 'Complete 5 vocabulary exercises',
          duration: 0,
          progress: 60,
          isCompleted: false
        }
      ];

      sampleActivities.forEach((activity, index) => {
        const timestamp = new Date(now);
        timestamp.setHours(timestamp.getHours() - index * 2);
        
        activities.push({
          id: `activity-${index}`,
          timestamp,
          ...activity
        } as ActivityItem);
      });

      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    setActivities(generateActivities());
  }, [currentUser, selectedTimeframe]);

  const getSessionTitle = (type: string): string => {
    const titles = {
      voice_practice: 'Voice Practice',
      conversation: 'AI Conversation',
      image_analysis: 'Visual Learning',
      story_listening: 'Story Time',
      listening_comprehension: 'Listening Practice',
      daily_challenge: 'Daily Challenge'
    };
    return titles[type as keyof typeof titles] || 'Learning Session';
  };

  const getSessionDescription = (session: any): string => {
    if (session.stats?.wordsLearned) {
      return `Learned ${session.stats.wordsLearned} new words`;
    }
    if (session.stats?.messagesExchanged) {
      return `${session.stats.messagesExchanged} messages exchanged`;
    }
    return 'Completed learning session';
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      voice_practice: Mic,
      conversation: MessageCircle,
      image_analysis: Camera,
      story_listening: BookOpen,
      listening_comprehension: Headphones,
      daily_challenge: Trophy
    };
    return icons[type as keyof typeof icons] || Play;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      voice_practice: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      conversation: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      image_analysis: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      story_listening: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      listening_comprehension: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
      daily_challenge: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredActivities = activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    const now = new Date();
    
    switch (selectedTimeframe) {
      case 'today':
        return activityDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return activityDate >= monthAgo;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <Badge variant="outline" className="text-xs">
                Developer Feature
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your learning journey
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-all duration-200
                ${selectedTimeframe === timeframe
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredActivities.filter(a => a.isCompleted).length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completed
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {filteredActivities.reduce((total, activity) => total + activity.duration, 0)}m
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Time spent
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.round(
                  filteredActivities
                    .filter(a => a.score)
                    .reduce((total, activity) => total + (activity.score || 0), 0) /
                  filteredActivities.filter(a => a.score).length || 0
                )}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Avg score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3">
                      {activity.duration > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {activity.duration}m
                        </div>
                      )}

                      {activity.score && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${getScoreColor(activity.score)}`}>
                          <Star className="w-3 h-3" />
                          {activity.score}%
                        </div>
                      )}

                      {activity.badge && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full">
                          <Trophy className="w-3 h-3" />
                          {activity.badge}
                        </div>
                      )}

                      {!activity.isCompleted && activity.progress !== undefined && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative overflow-hidden">
                            <div 
                              className={`bg-blue-500 h-2 rounded-full transition-all duration-200 ${
                                (activity.progress || 0) >= 100 ? 'w-full' :
                                (activity.progress || 0) >= 75 ? 'w-3/4' :
                                (activity.progress || 0) >= 50 ? 'w-1/2' :
                                (activity.progress || 0) >= 25 ? 'w-1/4' : 'w-0'
                              }`}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {activity.progress}%
                          </span>
                        </div>
                      )}

                      {activity.isCompleted && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          Complete
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <button 
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
                    title="More options"
                    aria-label="More options for this activity"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No recent activity
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start a learning session to see your activity here
            </p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
              Start Learning
            </button>
          </div>
        )}
      </div>

      {/* Show more button */}
      {filteredActivities.length > 5 && (
        <div className="text-center">
          <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm">
            View all activity
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
