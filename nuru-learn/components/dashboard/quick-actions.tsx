"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  Mic, 
  Camera, 
  BookOpen, 
  Headphones,
  MessageCircle,
  Trophy,
  Clock,
  Zap,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLearningStore } from '@/lib/stores/enhanced-learning';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  route: string;
  nuruFeature: boolean;
  disabled?: boolean;
}

export function QuickActions() {
  const router = useRouter();
  const { 
    currentUser, 
    currentSession,
    startSession,
    addNotification
  } = useLearningStore();

  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'voice-lesson',
      title: 'Voice Practice',
      description: 'AI-powered Kpelle pronunciation',
      icon: Mic,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      route: '/voice-practice',
      nuruFeature: true
    },
    {
      id: 'ai-chat',
      title: 'AI Conversation',
      description: 'Chat with Kpelle tutor',
      icon: MessageCircle,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      route: '/ai-chat',
      nuruFeature: true
    },
    {
      id: 'image-learning',
      title: 'Visual Learning',
      description: 'AI image analysis in Kpelle',
      icon: Camera,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      route: '/image-learning',
      nuruFeature: true
    },
    {
      id: 'story-time',
      title: 'Story Time',
      description: 'Listen to Kpelle stories',
      icon: BookOpen,
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      route: '/stories',
      nuruFeature: false
    },
    {
      id: 'listening-practice',
      title: 'Listening Practice',
      description: 'Improve comprehension skills',
      icon: Headphones,
      color: 'bg-gradient-to-br from-pink-500 to-pink-600',
      route: '/listening',
      nuruFeature: true
    },
    {
      id: 'daily-challenge',
      title: 'Daily Challenge',
      description: 'Complete today\'s learning goal',
      icon: Trophy,
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      route: '/challenge',
      nuruFeature: false,
      disabled: currentUser?.dailyProgress?.challengeCompleted
    }
  ];

  const navigateToFeature = (action: QuickAction) => {
    if (action.disabled) return;
    
    setIsNavigating(action.id);
    
    // Start a session if needed for Nuru AI features
    if (action.nuruFeature && !currentSession) {
      startSession('language-arts');
    }
    
    // Navigate to the dedicated page
    router.push(action.route);
    
    // Show appropriate message
    addNotification({
      type: 'success',
      title: action.title,
      message: `Opening ${action.title}${action.nuruFeature ? ' - Experience Nuru AI!' : ''}`
    });
    
    setTimeout(() => setIsNavigating(null), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <Badge variant="outline" className="text-xs">
            Core Nuru Features
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Zap className="w-4 h-4" />
          Start Learning
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const isLoading = isNavigating === action.id;
          
          return (
            <motion.button
              key={action.id}
              onClick={() => navigateToFeature(action)}
              disabled={action.disabled || isLoading}
              className={`
                group relative p-4 rounded-xl text-left transition-all duration-200
                ${action.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105 hover:shadow-lg cursor-pointer'
                }
                ${action.color}
                text-white
              `}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={!action.disabled ? { scale: 1.02 } : {}}
              whileTap={!action.disabled ? { scale: 0.98 } : {}}
            >
              {/* Background gradient overlay */}
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    {action.nuruFeature && (
                      <Badge variant="secondary" className="bg-white/20 border-white/30 text-white text-xs">
                        Nuru AI
                      </Badge>
                    )}
                    {action.disabled && (
                      <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                        <Trophy className="w-3 h-3" />
                        Done
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="font-semibold mb-1">{action.title}</h4>
                <p className="text-sm text-white/80">{action.description}</p>

                {/* Nuru AI feature indicator */}
                {action.nuruFeature && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-white/90">
                    <Zap className="w-3 h-3" />
                    Multimodal AI Experience
                  </div>
                )}
              </div>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                  <div className="text-white text-sm">Opening...</div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Session status */}
      {currentSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Active Session
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Ready for Nuru AI experiences
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-auto">
            <Clock className="w-3 h-3" />
            {Math.floor((Date.now() - new Date(currentSession.startTime).getTime()) / 60000)}m
          </div>
        </motion.div>
      )}

      {/* Feature Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Experience Nuru AI's Power
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Click any "Nuru AI" feature above to experience multimodal African language AI. 
              Voice Practice, AI Chat, and Visual Learning showcase real-time Kpelle processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
