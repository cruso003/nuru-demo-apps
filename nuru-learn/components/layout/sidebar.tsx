/**
 * Advanced Sidebar Navigation
 * Supports multimodal features, progress tracking, and AI insights
 */

'use client';

import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { useSidebar } from '@/lib/stores/ui';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  Mic,
  BarChart3,
  User,
  Settings,
  Volume2,
  Camera,
  Sparkles,
  GraduationCap,
  Flame,
  Trophy
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const { currentUser, progress } = useLearningStore();
  const pathname = usePathname();
  const router = useRouter();
  const { toggle: toggleSidebar } = useSidebar();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      iconSolid: Home,
      description: 'Overview & quick actions'
    },
    {
      name: 'Lessons',
      href: '/lessons',
      icon: BookOpen,
      iconSolid: BookOpen,
      description: 'Structured learning content'
    },
    {
      name: 'Practice Hub',
      href: '/practice',
      icon: Mic,
      iconSolid: Mic,
      description: 'Access all learning activities'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      iconSolid: BarChart3,
      description: 'Learning progress & insights'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      iconSolid: User,
      description: 'Personal settings & goals'
    },
    {
      name: 'AI Test',
      href: '/ai-test',
      icon: Sparkles,
      iconSolid: Sparkles,
      description: 'Test AI features & integration'
    }
  ];

  const quickActions = [
    {
      name: 'Voice Practice',
      icon: Volume2,
      color: 'bg-blue-500',
      action: () => {
        // Navigate to voice practice
        router.push('/voice-practice');
      }
    },
    {
      name: 'Stories',
      icon: Camera,
      color: 'bg-green-500',
      action: () => {
        // Navigate to stories (visual learning)
        router.push('/stories');
      }
    },
    {
      name: 'AI Chat',
      icon: Sparkles,
      color: 'bg-purple-500',
      action: () => {
        // Navigate to AI chat
        router.push('/ai-chat');
      }
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Nuru Learn
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI-Powered Learning
            </p>
          </div>
        </div>
      </div>

      {/* User Progress Summary */}
      {progress && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Accuracy {Math.round(progress.averageAccuracy)}%
            </span>
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-600 dark:text-orange-400">
                {progress?.currentStreak || 0}
              </span>
            </div>
          </div>
          <Progress 
            value={progress.averageAccuracy} 
            className="h-2 mb-2" 
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{progress?.activitiesCompleted || 0} interactions</span>
            <span>{progress.timeSpentMinutes} min total</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = pathname === item.href ? item.iconSolid : item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`
                w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon className={`
                w-5 h-5 mr-3 flex-shrink-0
                ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
              `} />
              <div className="text-left flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action.name}
              variant="ghost"
              size="sm"
              onClick={action.action}
              className="w-full justify-start h-8 px-2"
            >
              <div className={`w-6 h-6 rounded-md ${action.color} flex items-center justify-center mr-2`}>
                <action.icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs">{action.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* User Profile */}
      {currentUser && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {currentUser.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser.name || 'User'}
              </p>
              <div className="flex items-center space-x-1">
                <Badge variant="secondary" className="text-xs">
                  {'beginner'}
                </Badge>
                {progress?.badges && progress.badges.length > 0 && (
                  <Trophy className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
