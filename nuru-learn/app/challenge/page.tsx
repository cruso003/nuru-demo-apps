"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Clock, Target, CheckCircle, Star, Flame, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useEnhancedLearningStore } from '@/lib/stores/enhanced-learning';

interface User {
  streak?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'vocabulary' | 'listening' | 'speaking' | 'grammar';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  timeLimit: number; // in minutes
  completed: boolean;
  progress: number;
  tasks: ChallengeTask[];
}

interface ChallengeTask {
  id: string;
  description: string;
  completed: boolean;
  points: number;
}

export default function ChallengePage() {
  const router = useRouter();
  const { currentUser, addNotification } = useEnhancedLearningStore();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);

  // Sample daily challenges - in real app, this would come from API
  const dailyChallenges: Challenge[] = [
    {
      id: 'vocab-master',
      title: 'Vocabulary Master',
      description: 'Learn and practice 10 new Kpelle words',
      type: 'vocabulary',
      difficulty: 'easy',
      points: 100,
      timeLimit: 15,
      completed: false,
      progress: 60,
      tasks: [
        { id: '1', description: 'Learn 5 new words about family', completed: true, points: 25 },
        { id: '2', description: 'Practice pronunciation of learned words', completed: true, points: 25 },
        { id: '3', description: 'Complete vocabulary quiz', completed: false, points: 30 },
        { id: '4', description: 'Use new words in sentences', completed: false, points: 20 }
      ]
    },
    {
      id: 'listening-champion',
      title: 'Listening Champion',
      description: 'Complete 3 listening comprehension exercises',
      type: 'listening',
      difficulty: 'medium',
      points: 150,
      timeLimit: 20,
      completed: false,
      progress: 33,
      tasks: [
        { id: '1', description: 'Listen to a traditional story', completed: true, points: 50 },
        { id: '2', description: 'Answer comprehension questions', completed: false, points: 50 },
        { id: '3', description: 'Practice active listening skills', completed: false, points: 50 }
      ]
    },
    {
      id: 'grammar-guru',
      title: 'Grammar Guru',
      description: 'Master Kpelle sentence structure patterns',
      type: 'grammar',
      difficulty: 'hard',
      points: 200,
      timeLimit: 30,
      completed: false,
      progress: 0,
      tasks: [
        { id: '1', description: 'Study verb conjugation patterns', completed: false, points: 60 },
        { id: '2', description: 'Practice sentence construction', completed: false, points: 70 },
        { id: '3', description: 'Complete grammar assessment', completed: false, points: 70 }
      ]
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsActive(false);
            addNotification({ message: 'Time\'s up! Challenge ended.', type: 'info' });
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining, addNotification]);

  const startChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setTimeRemaining(challenge.timeLimit * 60); // Convert to seconds
    setIsActive(true);
    addNotification({ message: `Started ${challenge.title}! Good luck!`, type: 'success' });
  };

  const completeTask = (challengeId: string, taskId: string) => {
    // In real app, this would update the backend
    addNotification({ message: 'Task completed! Great work!', type: 'success' });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vocabulary': return Target;
      case 'listening': return Clock;
      case 'speaking': return Zap;
      case 'grammar': return Star;
      default: return Target;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPoints = dailyChallenges.reduce((sum, challenge) => sum + (challenge.completed ? challenge.points : 0), 0);
  const completedChallenges = dailyChallenges.filter(c => c.completed).length;

  if (selectedChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedChallenge(null);
                setIsActive(false);
                setTimeRemaining(0);
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Challenges
            </Button>
            
            <div className="flex items-center gap-4">
              {isActive && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span className="font-mono font-bold text-red-600">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Developer Feature
              </Badge>
            </div>
          </div>

          {/* Challenge Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedChallenge.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedChallenge.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-yellow-600">
                  {selectedChallenge.points} pts
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm text-gray-500">
                  {selectedChallenge.progress}%
                </span>
              </div>
              <Progress value={selectedChallenge.progress} className="w-full" />
            </div>
          </motion.div>

          {/* Tasks */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Challenge Tasks
            </h2>
            
            {selectedChallenge.tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${task.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-yellow-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${task.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }
                    `}>
                      {task.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        task.completed 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {task.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.points} points
                      </p>
                    </div>
                  </div>
                  
                  {!task.completed && isActive && (
                    <Button
                      onClick={() => completeTask(selectedChallenge.id, task.id)}
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Button */}
          {!isActive && selectedChallenge.progress < 100 && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => startChallenge(selectedChallenge)}
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
              >
                <Flame className="w-5 h-5 mr-2" />
                Continue Challenge
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Daily Challenge
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Complete challenges to earn points and improve your skills
              </p>
            </div>
          </div>
          
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Developer Feature
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center"
          >
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalPoints}
            </p>
            <p className="text-gray-600 dark:text-gray-300">Points Earned</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedChallenges}
            </p>
            <p className="text-gray-600 dark:text-gray-300">Challenges Completed</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center"
          >
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentUser?.streak || 0}
            </p>
            <p className="text-gray-600 dark:text-gray-300">Day Streak</p>
          </motion.div>
        </div>

        {/* Available Challenges */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Today's Challenges
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dailyChallenges.map((challenge, index) => {
              const TypeIcon = getTypeIcon(challenge.type);
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all duration-200 cursor-pointer
                    ${challenge.completed 
                      ? 'border-green-300 dark:border-green-600' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 hover:shadow-xl'
                    }
                  `}
                  onClick={() => !challenge.completed && startChallenge(challenge)}
                  whileHover={!challenge.completed ? { scale: 1.02 } : {}}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${challenge.completed 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                        }
                      `}>
                        {challenge.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <TypeIcon className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                    
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm text-gray-500">
                        {challenge.progress}%
                      </span>
                    </div>
                    <Progress value={challenge.progress} className="w-full" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {challenge.timeLimit}min
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        {challenge.points} pts
                      </div>
                    </div>
                    
                    {challenge.completed ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        Completed
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium text-yellow-600">
                        Start Challenge →
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <Trophy className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                About Daily Challenges
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                Daily challenges are <strong>developer-implemented features</strong> that provide 
                gamification and structured learning goals. These challenges combine various 
                learning activities into focused sessions with time limits, point rewards, and 
                progress tracking to enhance user engagement and motivation.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
