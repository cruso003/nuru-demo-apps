/**
 * Enhanced Learning Store with Database Integration
 * Replaces mock data with real Supabase operations
 */

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { AuthService } from '@/lib/auth/enhanced-auth';
import { 
  UserService, 
  ProgressService, 
  DailyProgressService,
  AchievementService,
  SessionService,
  LessonService,
  AnalyticsService 
} from '@/lib/services/database';
import { EnhancedNuruAI } from '@/lib/services/enhanced-nuru-ai';
import type { User, Session } from '@supabase/supabase-js';

// Import existing types from learning store
import type { 
  User as AppUser, 
  UserProgress, 
  Subject, 
  LearningSession,
  Lesson,
  Achievement,
  Notification,
  ProficiencyLevel,
  ActivityType 
} from '@/lib/stores/learning';

// Enhanced state interface with real-time data
interface EnhancedLearningState {
  // Authentication & User
  isAuthenticated: boolean;
  currentUser: AppUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Real-time progress data
  progress: UserProgress | null;
  dailyProgress: any | null;
  achievements: Achievement[];
  
  // Current session
  currentSession: LearningSession | null;
  currentLesson: Lesson | null;
  currentSubject: Subject | null;
  
  // Notifications
  notifications: Notification[];
  
  // Cache status for monitoring
  cacheStats: {
    hitRate: number;
    costSavings: number;
  };
}

interface EnhancedLearningActions {
  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  initializeUser: (user: User | AppUser) => Promise<void>;
  initializeSession: () => Promise<void>;
  
  // Progress Management
  updateProgress: (progressData: Partial<UserProgress>) => Promise<void>;
  addXP: (amount: number, subject?: Subject) => Promise<void>;
  completeActivity: (activityId: string, score: number) => Promise<void>;
  completeLesson: (lessonId: string, results: Record<string, unknown>) => Promise<void>;
  
  // Session Management
  startSession: (subject: Subject) => Promise<void>;
  endSession: (results?: Record<string, unknown>) => Promise<void>;
  recordActivity: (activityData: Record<string, unknown>) => Promise<void>;
  
  // Content Generation with Caching
  generateLesson: (params: Record<string, unknown>) => Promise<Lesson>;
  generateQuiz: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
  getCulturalContext: (topic: string) => Promise<string>;
  getRecommendations: () => Promise<Record<string, unknown>>;
  
  // Real-time Analytics
  getUserAnalytics: (days?: number) => Promise<Record<string, unknown> | null>;
  getLeaderboard: () => Promise<Record<string, unknown>[]>;
  getCacheStats: () => Promise<void>;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

type EnhancedLearningStore = EnhancedLearningState & EnhancedLearningActions;

// Initial State
const initialState: EnhancedLearningState = {
  isAuthenticated: false,
  currentUser: null,
  supabaseUser: null,
  isLoading: false,
  error: null,
  
  progress: null,
  dailyProgress: null,
  achievements: [],
  
  currentSession: null,
  currentLesson: null,
  currentSubject: null,
  
  notifications: [],
  
  cacheStats: {
    hitRate: 0,
    costSavings: 0
  }
};

export const useEnhancedLearningStore = create<EnhancedLearningStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,

        // Authentication Actions
        signIn: async (email: string, password: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const { user } = await AuthService.signIn(email, password);
            
            if (user) {
              // Get user profile and progress from database
              const userData = await AuthService.getUserProfile(user.id);
              
              set({
                isAuthenticated: true,
                supabaseUser: user,
                currentUser: userData.profile ? {
                  id: user.id,
                  email: user.email!,
                  name: userData.profile.name,
                  avatar: userData.profile.avatar_url,
                  proficiencyLevel: userData.profile.proficiency_level as ProficiencyLevel,
                  preferredSubjects: userData.profile.preferred_subjects || [],
                  progress: userData.progress || {},
                  settings: userData.profile.settings || {},
                  createdAt: new Date(userData.profile.created_at),
                  lastActive: new Date(userData.profile.last_active)
                } : null,
                progress: userData.progress,
                isLoading: false
              });
              
              // Load daily progress and achievements
              get().refreshUserData();
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Authentication failed',
              isLoading: false 
            });
            throw error;
          }
        },

        signUp: async (email: string, password: string, name: string) => {
          set({ isLoading: true, error: null });
          
          try {
            await AuthService.signUp(email, password, { name });
            set({ isLoading: false });
            
            get().addNotification({
              type: 'success',
              title: 'Account Created',
              message: 'Please check your email to verify your account.'
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Sign up failed',
              isLoading: false 
            });
            throw error;
          }
        },

        signInAsGuest: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const guestUser = await AuthService.createGuestSession();
            
            set({
              isAuthenticated: true,
              currentUser: {
                id: guestUser.id,
                email: guestUser.email,
                name: guestUser.name!,
                proficiencyLevel: 'beginner',
                preferredSubjects: ['language-arts'],
                progress: {
                  totalXP: 0,
                  currentStreak: 0,
                  longestStreak: 0,
                  lessonsCompleted: 0,
                  activitiesCompleted: 0,
                  averageAccuracy: 0,
                  timeSpentMinutes: 0,
                  badges: [],
                  achievements: [],
                  subjectProgress: {
                    'mathematics': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
                    'language-arts': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
                    'science': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
                    'social-studies': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
                    'life-skills': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 }
                  }
                },
                settings: {
                  language: 'en',
                  theme: 'light',
                  notifications: true,
                  soundEnabled: true,
                  autoplay: false,
                  difficulty: 'beginner'
                },
                createdAt: new Date(),
                lastActive: new Date()
              },
              isLoading: false
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Guest sign in failed',
              isLoading: false 
            });
            throw error;
          }
        },

        signOut: async () => {
          try {
            await AuthService.signOut();
            set(initialState);
          } catch (error) {
            console.error('Sign out error:', error);
            // Force reset even if sign out fails
            set(initialState);
          }
        },

        refreshUserData: async () => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          try {
            const [dailyProgress, achievements] = await Promise.all([
              DailyProgressService.getTodayProgress(currentUser.id),
              AchievementService.getUserAchievements(currentUser.id)
            ]);
            
            set({ 
              dailyProgress,
              achievements: achievements || []
            });
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        },

        initializeUser: async (user: User | AppUser) => {
          try {
            set({ 
              currentUser: user as AppUser,
              supabaseUser: 'email' in user ? user as User : null,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // Refresh additional user data
            await get().refreshUserData();
          } catch (error) {
            console.error('Error initializing user:', error);
            set({ error: 'Failed to initialize user data' });
          }
        },

        initializeSession: async () => {
          try {
            const { currentUser } = get();
            if (!currentUser) return;
            
            // Initialize a basic learning session
            const session: LearningSession = {
              id: `session-${Date.now()}`,
              type: 'practice',
              userId: currentUser.id,
              subject: 'language-arts',
              startTime: new Date(),
              endTime: undefined,
              activitiesCompleted: 0,
              xpEarned: 0,
              accuracy: 0,
              isActive: true
            };
            
            set({ currentSession: session });
          } catch (error) {
            console.error('Error initializing session:', error);
          }
        },

        // Progress Management
        updateProgress: async (progressData: Partial<UserProgress>) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          try {
            const updatedProgress = await ProgressService.updateUserProgress(
              currentUser.id,
              progressData
            );
            
            set({ progress: updatedProgress });
          } catch (error) {
            console.error('Error updating progress:', error);
            get().setError('Failed to update progress');
          }
        },

        addXP: async (amount: number, subject?: Subject) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          try {
            const updatedProgress = await ProgressService.addXP(
              currentUser.id,
              amount,
              subject
            );
            
            set({ progress: updatedProgress });
            
            get().addNotification({
              type: 'success',
              title: 'XP Earned!',
              message: `You earned ${amount} XP!`
            });
          } catch (error) {
            console.error('Error adding XP:', error);
          }
        },

        completeActivity: async (activityId: string, score: number) => {
          const { currentUser, currentSession } = get();
          if (!currentUser) return;
          
          try {
            // Update daily progress
            await DailyProgressService.updateDailyProgress(currentUser.id, {
              activities_completed: 1,
              xp_earned: score * 10 // Example XP calculation
            });
            
            // Add XP
            await get().addXP(score * 10);
            
            get().addNotification({
              type: 'success',
              title: 'Activity Complete!',
              message: `Great work! Score: ${score}`
            });
          } catch (error) {
            console.error('Error completing activity:', error);
          }
        },

        completeLesson: async (lessonId: string, results: any) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          try {
            // Update progress
            await DailyProgressService.updateDailyProgress(currentUser.id, {
              lessons_completed: 1,
              xp_earned: results.xp || 50,
              time_spent_minutes: results.timeSpent || 0
            });
            
            // Add XP
            await get().addXP(results.xp || 50);
            
            get().addNotification({
              type: 'success',
              title: 'Lesson Complete!',
              message: 'Keep up the great work!'
            });
          } catch (error) {
            console.error('Error completing lesson:', error);
          }
        },

        // Session Management
        startSession: async (subject: Subject) => {
          const { currentUser } = get();
          if (!currentUser) return;
          
          try {
            const session = await SessionService.startSession({
              userId: currentUser.id,
              subject,
              type: 'practice',
              title: `${subject} Practice Session`
            });
            
            set({ 
              currentSession: session,
              currentSubject: subject 
            });
          } catch (error) {
            console.error('Error starting session:', error);
            get().setError('Failed to start session');
          }
        },

        endSession: async (results?: any) => {
          const { currentSession } = get();
          if (!currentSession) return;
          
          try {
            await SessionService.endSession(currentSession.id, {
              activities_completed: results?.activitiesCompleted || 0,
              xp_earned: results?.xpEarned || 0,
              accuracy_score: results?.accuracy || 0,
              time_spent_minutes: results?.timeSpent || 0
            });
            
            set({ currentSession: null });
          } catch (error) {
            console.error('Error ending session:', error);
          }
        },

        recordActivity: async (activityData: any) => {
          // Record activity details for analytics
          console.log('Activity recorded:', activityData);
        },

        // Content Generation with Caching
        generateLesson: async (params: any) => {
          set({ isLoading: true });
          
          try {
            const lessonContent = await EnhancedNuruAI.generateLesson(params);
            
            // Save to database for future use
            const savedLesson = await LessonService.saveLesson({
              title: lessonContent.title,
              subject: params.subject,
              level: params.level,
              language: params.language || 'en',
              content: lessonContent
            });
            
            set({ isLoading: false });
            return savedLesson;
          } catch (error) {
            set({ isLoading: false });
            console.error('Error generating lesson:', error);
            throw error;
          }
        },

        generateQuiz: async (params: any) => {
          try {
            return await EnhancedNuruAI.generateQuiz(params);
          } catch (error) {
            console.error('Error generating quiz:', error);
            throw error;
          }
        },

        getCulturalContext: async (topic: string) => {
          try {
            return await EnhancedNuruAI.getCulturalContext(topic);
          } catch (error) {
            console.error('Error getting cultural context:', error);
            return 'Cultural context not available.';
          }
        },

        getRecommendations: async () => {
          const { currentUser, progress } = get();
          if (!currentUser || !progress) return [];
          
          try {
            return await EnhancedNuruAI.getRecommendations(progress, currentUser.settings);
          } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
          }
        },

        // Analytics
        getUserAnalytics: async (days = 30) => {
          const { currentUser } = get();
          if (!currentUser) return null;
          
          try {
            const analytics = await AnalyticsService.getUserAnalytics(currentUser.id, days);
            return analytics as unknown as Record<string, unknown>;
          } catch (error) {
            console.error('Error getting analytics:', error);
            return null;
          }
        },

        getLeaderboard: async () => {
          try {
            const leaderboard = await AnalyticsService.getLeaderboard();
            return Array.isArray(leaderboard) ? leaderboard : [];
          } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
          }
        },

        getCacheStats: async () => {
          try {
            const stats = await EnhancedNuruAI.getCacheStats();
            set({ cacheStats: stats });
          } catch (error) {
            console.error('Error getting cache stats:', error);
          }
        },

        // Notifications
        addNotification: (notification: Omit<Notification, 'id'>) => {
          const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2)}`;
          set(state => ({
            notifications: [...state.notifications, { ...notification, id }]
          }));
        },

        removeNotification: (id: string) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Utility
        setError: (error: string | null) => {
          set({ error });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        reset: () => {
          set(initialState);
        }
      }),
      {
        name: 'nuru-learn-enhanced-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist essential data for offline capability
          isAuthenticated: state.isAuthenticated,
          currentUser: state.currentUser,
          currentSubject: state.currentSubject,
          cacheStats: state.cacheStats
        })
      }
    )
  )
);

// Convenience hooks for common data access
export const useAuthState = () => useEnhancedLearningStore(state => ({
  isAuthenticated: state.isAuthenticated,
  currentUser: state.currentUser,
  isLoading: state.isLoading,
  error: state.error
}));

export const useProgress = () => useEnhancedLearningStore(state => state.progress);

export const useCurrentSession = () => useEnhancedLearningStore(state => state.currentSession);

export const useDailyProgress = () => useEnhancedLearningStore(state => state.dailyProgress);

export const useAchievements = () => useEnhancedLearningStore(state => state.achievements);

export const useNotifications = () => useEnhancedLearningStore(state => state.notifications);

export const useCacheStats = () => useEnhancedLearningStore(state => state.cacheStats);

// Export types for external components
export type {
  Subject,
  ProficiencyLevel,
  ActivityType,
  User,
  UserProgress,
  Achievement,
  LearningSession,
  Lesson,
  Notification,
  UserSettings,
  CulturalContext,
  VocabularyItem,
  Activity,
  ActivityContent
} from '@/lib/stores/learning';

// Export the store for backward compatibility
export const useLearningStore = useEnhancedLearningStore;
