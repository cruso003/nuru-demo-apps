"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Calendar, 
  Target, 
  TrendingUp,
  Star,
  Clock,
  Award,
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLearningStore, useProgress } from '@/lib/stores/enhanced-learning';

export function LearningStreak() {
  const { currentUser, updateProgress } = useLearningStore();
  const progress = useProgress();
  const [showMotivation, setShowMotivation] = useState(false);

  const streak = progress?.currentStreak || 0;
  const dailyGoal = 30; // Default 30 minutes daily goal
  const todayMinutes = progress?.timeSpentMinutes || 0;
  const goalProgress = Math.min((todayMinutes / dailyGoal) * 100, 100);

  // Generate streak calendar for last 7 days
  const getStreakCalendar = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simulate activity data (in real app, this would come from user data)
      const hasActivity = i === 0 ? todayMinutes > 0 : Math.random() > 0.3;
      const intensity = hasActivity ? Math.random() * 100 : 0;
      
      days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date,
        hasActivity,
        intensity,
        isToday: i === 0
      });
    }
    
    return days;
  };

  const streakCalendar = getStreakCalendar();

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: 'Master', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (streak >= 14) return { level: 'Champion', color: 'text-gold-600', bg: 'bg-yellow-100' };
    if (streak >= 7) return { level: 'Warrior', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (streak >= 3) return { level: 'Explorer', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { level: 'Beginner', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const streakLevel = getStreakLevel(streak);

  const motivationalMessages = [
    "You're on fire! Keep the momentum going! 🔥",
    "Consistency is key to mastering Kpelle! ✨",
    "Every day counts in your language journey! 🌟",
    "Your dedication is building fluency! 💪",
    "Small steps, big progress! Keep going! 🚀"
  ];

  useEffect(() => {
    if (streak > 0 && streak % 7 === 0) {
      setShowMotivation(true);
      setTimeout(() => setShowMotivation(false), 5000);
    }
  }, [streak]);

  return (
    <div className="space-y-6">
      {/* Main Streak Display */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">Learning Streak</h3>
                  <Badge variant="outline" className="text-xs bg-white/20 border-white/30 text-white">
                    Developer Feature
                  </Badge>
                </div>
                <p className="text-white/80 text-sm">Keep the fire burning!</p>
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${streakLevel.bg} ${streakLevel.color} bg-white text-orange-600`}>
              {streakLevel.level}
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold">{streak}</span>
            <span className="text-white/80">day{streak !== 1 ? 's' : ''}</span>
          </div>

          {/* Streak milestones */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              <span>Next milestone: {Math.ceil((streak + 1) / 7) * 7} days</span>
            </div>
          </div>
        </div>

        {/* Animated flame particles */}
        {streak > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  top: '70%'
                }}
                animate={{
                  y: [-10, -30, -10],
                  opacity: [0.8, 0.4, 0.8],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Daily Goal Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Today's Goal</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {todayMinutes} / {dailyGoal} minutes
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(goalProgress)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${goalProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {goalProgress >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium"
          >
            <Star className="w-4 h-4" />
            Goal achieved! Great work today!
          </motion.div>
        )}
      </div>

      {/* Weekly Activity Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Activity</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 days</p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {streakCalendar.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {day.date}
              </div>
              <motion.div
                className={`
                  w-8 h-8 rounded-lg mx-auto relative
                  ${day.hasActivity 
                    ? day.intensity > 70 
                      ? 'bg-green-500' 
                      : day.intensity > 40 
                        ? 'bg-green-400' 
                        : 'bg-green-300'
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                  ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
                `}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                {day.isToday && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              No activity
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded" />
              Some
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              Lots
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Streak Achievements</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { days: 3, name: "Explorer", earned: streak >= 3 },
            { days: 7, name: "Warrior", earned: streak >= 7 },
            { days: 14, name: "Champion", earned: streak >= 14 },
            { days: 30, name: "Master", earned: streak >= 30 }
          ].map((achievement) => (
            <div
              key={achievement.days}
              className={`
                text-center p-3 rounded-lg border-2 transition-all duration-200
                ${achievement.earned 
                  ? 'border-yellow-300 bg-yellow-100 dark:bg-yellow-900/30' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }
              `}
            >
              <div className={`
                w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center
                ${achievement.earned 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }
              `}>
                {achievement.earned ? (
                  <Star className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full" />
                )}
              </div>
              <div className={`text-xs font-medium ${achievement.earned ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-500 dark:text-gray-400'}`}>
                {achievement.days} days
              </div>
              <div className={`text-xs ${achievement.earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {achievement.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      {showMotivation && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg max-w-sm z-50"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6" />
            <p className="text-sm font-medium">
              {motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
