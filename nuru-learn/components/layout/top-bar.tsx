/**
 * Top Navigation Bar
 * Global actions, search, notifications, and user controls
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { useUIStore } from '@/lib/stores/ui';
import { 
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  Play,
  Pause,
  Square,
  BookOpen,
  Heart,
  Mic,
  User,
  Settings,
  LogOut,
  Volume2,
  MessageSquare,
  Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { currentUser, currentSession, endSession } = useLearningStore();
  const { toggleSidebar } = useUIStore();

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleLanguageSwitch = () => {
    // For now, just show a notification - could implement language switching later
    // TODO: Implement proper language switching when the store functions are available
    console.log('Language switch requested');
  };

  const formatSessionTime = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search lessons, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>

        {/* Current Session Indicator */}
        {currentSession && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {currentSession.subject} • {formatSessionTime(currentSession.startTime.getTime())}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => endSession()}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              <Square className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Center Section - Language Indicator */}
      {currentUser && (
        <div className="hidden md:flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLanguageSwitch}
            className="flex items-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">
              English
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-sm font-medium">
              Kpɛlɛ
            </span>
          </Button>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Quick Learning Start */}
        {!currentSession && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="hidden sm:flex">
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => router.push('/listening')}>
                <Headphones className="w-4 h-4 mr-2" />
                Listening Practice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/stories')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Stories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/voice-practice')}>
                <Mic className="w-4 h-4 mr-2" />
                Voice Practice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/ai-chat')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                AI Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center"
                >
                  {notifications.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className={`text-sm font-medium ${
                    notification.type === 'error' ? 'text-red-600' :
                    notification.type === 'success' ? 'text-green-600' :
                    notification.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThemeToggle}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        {/* User Menu */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {currentUser.name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
