/**
 * Learning State Management Store
 * Manages learning sessions, progress, lessons, and educational content
 */

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { nuruAI, type LessonGenerationRequest, type PerformanceAnalysisRequest } from '@/lib/services/nuru-ai';

// Types
export type Subject = 'mathematics' | 'language-arts' | 'science' | 'social-studies' | 'life-skills';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityType = 'introduction' | 'vocabulary' | 'listening' | 'quiz' | 'conversation' | 'reading';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  proficiencyLevel: ProficiencyLevel;
  preferredSubjects: Subject[];
  progress: UserProgress;
  dailyProgress?: {
    challengeCompleted: boolean;
    streakDays: number;
    todayXP: number;
  };
  settings: UserSettings;
  createdAt: Date;
  lastActive: Date;
  streak?: number
}

export interface UserProgress {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  activitiesCompleted: number;
  averageAccuracy: number;
  timeSpentMinutes: number;
  badges: string[];
  achievements: Achievement[];
  subjectProgress: Record<Subject, SubjectProgress>;
  dailyProgress?: {
    challengeCompleted: boolean;
    lessonsToday: number;
    xpToday: number;
    streakMaintained: boolean;
  };
}

export interface SubjectProgress {
  level: number;
  xp: number;
  lessonsCompleted: number;
  accuracy: number;
  timeSpent: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  xpReward: number;
}

export interface UserSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEnabled: boolean;
  autoplay: boolean;
  difficulty: ProficiencyLevel;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

export interface LearningSession {
  id: string;
  userId: string;
  subject: Subject;
  type: string;
  startTime: Date;
  endTime?: Date;
  activitiesCompleted: number;
  xpEarned: number;
  accuracy: number;
  isActive: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  difficulty: ProficiencyLevel;
  estimatedTime: number;
  culturalContext: CulturalContext;
  activities: Activity[];
  totalActivities: number;
  xpReward: number;
  achievements: string[];
  prerequisites?: string[];
  tags: string[];
}

export interface CulturalContext {
  background: string;
  traditions: string[];
  vocabulary: VocabularyItem[];
  images?: string[];
  audioContext?: string;
}

export interface VocabularyItem {
  kpelle: string;
  english: string;
  context?: string;
  pronunciation?: string;
  audio?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  content: ActivityContent;
  estimatedTime: number;
  xpReward?: number;
  completed?: boolean;
}

export interface ActivityContent {
  text?: string;
  audio?: string;
  image?: string;
  video?: string;
  vocabulary?: VocabularyItem[];
  question?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  hints?: string[];
}

export interface ProgressStats {
  totalInteractions: number;
  averageAccuracy: number;
  timeSpentMinutes: number;
  streakDays: number;
  lessonsCompleted: number;
  xpEarned: number;
}

// Additional types for profile functionality
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  dateOfBirth?: string;
  location?: string;
  bio?: string;
  joinDate: string;
  timezone?: string;
  primaryLanguage: string;
  learningLanguages: string[];
  educationLevel: string;
  goals: string[];
  interests: string[];
  achievements: Array<{
    id: string;
    name: string;
    earnedAt: string;
  }>;
  statistics: {
    totalLessons: number;
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
    studyTime: number;
    accuracy: number;
    level: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoplayAudio: boolean;
  showCulturalNotes: boolean;
  enableVoiceRecognition: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  practiceReminders: boolean;
  studySessionLength: number;
  dailyGoal: number;
  weeklyGoal: number;
  voiceSpeed: 'slow' | 'normal' | 'fast';
  subtitles: boolean;
  keyboardShortcuts: boolean;
  animations: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
}

export interface NotificationSettings {
  practiceReminders: boolean;
  achievementAlerts: boolean;
  streakReminders: boolean;
  weeklyProgress: boolean;
  newContent: boolean;
  socialUpdates: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderTime: string;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Learning Store State
interface LearningState {
  // Authentication & User
  isAuthenticated: boolean;
  currentUser: User | null;
  user: User | null; // Alias for currentUser
  userProfile: UserProfile | null;
  userPreferences: UserPreferences | null;
  
  // Practice Session Data
  currentLanguage: string;
  targetLanguage: string;
  practiceSession: any | null;
  isRecording: boolean;
  audioLevel: number;
  
  // Learning Session
  currentSession: LearningSession | null;
  currentSubject: Subject;
  
  // Lessons & Activities
  currentLesson: Lesson | null;
  currentActivity: Activity | null;
  completedActivities: Set<string>;
  lessonProgress: Record<string, number>;
  
  // Audio & Media
  isAudioPlaying: boolean;
  currentAudioUrl: string | null;
  audioElement: HTMLAudioElement | null;
  
  // Progress & Analytics
  progress: ProgressStats;
  recentAchievements: Achievement[];
  
  // Notifications
  notifications: Notification[];
  
  // Loading States
  isLoadingLesson: boolean;
  isSubmittingAnswer: boolean;
  
  // Error States
  error: string | null;
}

// Learning Store Actions
interface LearningActions {
  // Authentication
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  setUser: (user: User) => void;
  
  // Learning Sessions
  startSession: (subject: Subject) => void;
  endSession: () => void;
  updateSessionProgress: (xp: number, accuracy: number) => void;
  
  // Lessons
  loadLesson: (lessonId: string) => Promise<void>;
  startLesson: (lessonId: string) => void;
  completeLesson: () => void;
  
  // Activities
  startActivity: (activityId: string) => void;
  completeActivity: (activityId: string) => void;
  submitAnswer: (activityId: string, answer: string, isCorrect: boolean) => void;
  
  // Audio & Media
  playAudio: (audioUrl: string) => void;
  pauseAudio: () => void;
  toggleAudio: (audioUrl?: string) => void;
  setAudioElement: (element: HTMLAudioElement) => void;
  
  // Progress
  updateProgress: (stats: Partial<ProgressStats>) => void;
  awardAchievement: (achievement: Achievement) => void;
  increaseXP: (amount: number) => void;
  
  // Subject Management
  setCurrentSubject: (subject: Subject) => void;
  updateSubjectProgress: (subject: Subject, progress: Partial<SubjectProgress>) => void;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Special Actions for Quick Actions Component
  activateVoiceMode: () => void;
  activateImageAnalysis: () => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  
  // Profile & Preferences Management
  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  exportUserData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  
  // Practice Session Management
  startPractice: (language: string, targetLanguage: string) => void;
  submitPracticeAnswer: (answer: string) => void;
  generatePracticeContent: () => void;
  analyzeUserPerformance: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  
  // Notification Management
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

type LearningStore = LearningState & LearningActions;

// Initial State
const initialState: LearningState = {
  // Authentication & User
  isAuthenticated: false,
  currentUser: null,
  user: null,
  userProfile: null,
  userPreferences: null,
  
  // Practice Session Data
  currentLanguage: 'en',
  targetLanguage: 'kpe',
  practiceSession: null,
  isRecording: false,
  audioLevel: 0,
  
  // Learning Session
  currentSession: null,
  currentSubject: 'language-arts',
  
  // Lessons & Activities
  currentLesson: null,
  currentActivity: null,
  completedActivities: new Set(),
  lessonProgress: {},
  
  // Audio & Media
  isAudioPlaying: false,
  currentAudioUrl: null,
  audioElement: null,
  
  // Progress & Analytics
  progress: {
    totalInteractions: 0,
    averageAccuracy: 0,
    timeSpentMinutes: 0,
    streakDays: 0,
    lessonsCompleted: 0,
    xpEarned: 0,
  },
  recentAchievements: [],
  
  // Notifications
  notifications: [],
  
  // Loading States
  isLoadingLesson: false,
  isSubmittingAnswer: false,
  
  // Error States
  error: null,
};

// Create the store
export const useLearningStore = create<LearningStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Authentication
        signIn: async (email: string, password: string) => {
          try {
            // Mock authentication - replace with actual API call
            const mockUser: User = {
              id: 'user-001',
              name: 'John Doe',
              email,
              proficiencyLevel: 'beginner',
              preferredSubjects: ['language-arts'],
              progress: {
                totalXP: 150,
                currentStreak: 3,
                longestStreak: 7,
                lessonsCompleted: 5,
                activitiesCompleted: 23,
                averageAccuracy: 85,
                timeSpentMinutes: 120,
                badges: ['First Steps', 'Quick Learner'],
                achievements: [],
                subjectProgress: {
                  'language-arts': { level: 2, xp: 150, lessonsCompleted: 5, accuracy: 85, timeSpent: 120 },
                  'mathematics': { level: 1, xp: 50, lessonsCompleted: 2, accuracy: 78, timeSpent: 60 },
                  'science': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
                  'social-studies': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
                  'life-skills': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
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
            };
            
            set({ 
              isAuthenticated: true, 
              currentUser: mockUser,
              progress: {
                totalInteractions: mockUser.progress.activitiesCompleted,
                averageAccuracy: mockUser.progress.averageAccuracy,
                timeSpentMinutes: mockUser.progress.timeSpentMinutes,
                streakDays: mockUser.progress.currentStreak,
                lessonsCompleted: mockUser.progress.lessonsCompleted,
                xpEarned: mockUser.progress.totalXP,
              }
            });
          } catch (error) {
            set({ error: 'Authentication failed' });
          }
        },
        
        signOut: () => {
          set({ 
            isAuthenticated: false, 
            currentUser: null,
            currentSession: null,
            currentLesson: null 
          });
        },
        
        setUser: (user: User) => {
          set({ currentUser: user, isAuthenticated: true });
        },
        
        // Learning Sessions
        startSession: (subject: Subject) => {
          const session: LearningSession = {
            id: `session-${Date.now()}`,
            userId: get().currentUser?.id || 'anonymous',
            subject,
            type: 'practice', // Default session type
            startTime: new Date(),
            activitiesCompleted: 0,
            xpEarned: 0,
            accuracy: 0,
            isActive: true
          };
          
          set({ 
            currentSession: session, 
            currentSubject: subject 
          });
        },
        
        endSession: () => {
          const session = get().currentSession;
          if (session) {
            set({ 
              currentSession: { 
                ...session, 
                endTime: new Date(), 
                isActive: false 
              } 
            });
          }
        },
        
        updateSessionProgress: (xp: number, accuracy: number) => {
          const session = get().currentSession;
          if (session) {
            set({
              currentSession: {
                ...session,
                xpEarned: session.xpEarned + xp,
                accuracy: (session.accuracy + accuracy) / 2,
                activitiesCompleted: session.activitiesCompleted + 1
              }
            });
          }
        },
        
        // Lessons
        loadLesson: async (lessonId: string) => {
          set({ isLoadingLesson: true, error: null });
          try {
            // Check if Nuru AI is available
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              // Generate lesson content using Nuru AI
              const currentSubject = get().currentSubject;
              const user = get().currentUser;
              
              const lessonRequest: LessonGenerationRequest = {
                subject: currentSubject,
                topic: `Lesson ${lessonId}`,
                difficulty: user?.proficiencyLevel || 'beginner',
                language: 'en',
                duration_minutes: 30,
                learning_objectives: [`Master key concepts in ${currentSubject}`]
              };
              
              const aiLessonContent = await nuruAI.generateLessonContent(lessonRequest);
              
              // Convert AI lesson content to our Lesson format
              const lesson: Lesson = {
                id: lessonId,
                title: aiLessonContent.title,
                description: aiLessonContent.description,
                subject: currentSubject,
                difficulty: user?.proficiencyLevel || 'beginner',
                estimatedTime: 30,
                culturalContext: {
                  background: 'Generated lesson content',
                  traditions: aiLessonContent.cultural_notes || [],
                  vocabulary: aiLessonContent.vocabulary?.map((vocab: any) => ({
                    kpelle: vocab.term,
                    english: vocab.definition,
                    pronunciation: vocab.pronunciation
                  })) || []
                },
                activities: aiLessonContent.activities.map((activity: any, index: number) => ({
                  id: `${lessonId}-activity-${index}`,
                  type: activity.type as ActivityType,
                  title: `Activity ${index + 1}`,
                  content: {
                    text: activity.content,
                    question: activity.instructions,
                    correctAnswer: activity.expected_answer
                  },
                  estimatedTime: 5,
                  xpReward: 10
                })),
                totalActivities: aiLessonContent.activities.length,
                xpReward: 50,
                achievements: ['AI-Generated Lesson'],
                prerequisites: [],
                tags: [currentSubject, 'ai-generated']
              };
              
              set({ 
                currentLesson: lesson,
                isLoadingLesson: false 
              });
              
              get().showNotification(`Lesson "${lesson.title}" loaded successfully with AI assistance!`, 'success');
            } else {
              // Fallback to mock lesson if AI is not available
              const mockLesson: Lesson = {
                id: lessonId,
                title: `Sample Lesson ${lessonId}`,
                description: 'A sample lesson for demonstration purposes',
                subject: get().currentSubject,
                difficulty: get().currentUser?.proficiencyLevel || 'beginner',
                estimatedTime: 20,
                culturalContext: {
                  background: 'Sample cultural context',
                  traditions: [],
                  vocabulary: []
                },
                activities: [],
                totalActivities: 0,
                xpReward: 30,
                achievements: [],
                prerequisites: [],
                tags: ['sample']
              };
              
              set({ 
                currentLesson: mockLesson,
                isLoadingLesson: false 
              });
              
              get().showNotification('Lesson loaded (AI unavailable - using sample content)', 'info');
            }
          } catch (error) {
            console.error('Failed to load lesson:', error);
            set({ error: 'Failed to load lesson', isLoadingLesson: false });
            get().showNotification('Failed to load lesson. Please try again.', 'error');
          }
        },
        
        startLesson: (lessonId: string) => {
          // If no session is active, start one
          if (!get().currentSession) {
            get().startSession(get().currentSubject);
          }
          
          set({ 
            completedActivities: new Set(),
            lessonProgress: { ...get().lessonProgress, [lessonId]: 0 }
          });
        },
        
        completeLesson: () => {
          const currentLesson = get().currentLesson;
          const currentUser = get().currentUser;
          
          if (currentLesson && currentUser) {
            // Update progress
            const newProgress = {
              ...get().progress,
              lessonsCompleted: get().progress.lessonsCompleted + 1,
              xpEarned: get().progress.xpEarned + currentLesson.xpReward
            };
            
            set({ progress: newProgress });
            
            // Award achievements
            currentLesson.achievements.forEach((achievementTitle: string) => {
              const achievement: Achievement = {
                id: `achievement-${Date.now()}`,
                title: achievementTitle,
                description: `Earned by completing ${currentLesson.title}`,
                icon: 'trophy',
                unlockedAt: new Date(),
                xpReward: 10
              };
              get().awardAchievement(achievement);
            });
          }
        },
        
        // Activities
        startActivity: (activityId: string) => {
          // Implementation for starting an activity
        },
        
        completeActivity: (activityId: string) => {
          const completedActivities = new Set(get().completedActivities);
          completedActivities.add(activityId);
          
          set({ 
            completedActivities,
            progress: {
              ...get().progress,
              totalInteractions: get().progress.totalInteractions + 1
            }
          });
        },
        
        submitAnswer: (activityId: string, answer: string, isCorrect: boolean) => {
          set({ isSubmittingAnswer: true });
          
          // Update accuracy
          const currentAccuracy = get().progress.averageAccuracy;
          const totalInteractions = get().progress.totalInteractions;
          const newAccuracy = ((currentAccuracy * totalInteractions) + (isCorrect ? 100 : 0)) / (totalInteractions + 1);
          
          // Award XP for correct answers
          const xpReward = isCorrect ? 10 : 5;
          
          setTimeout(() => {
            set({ 
              isSubmittingAnswer: false,
              progress: {
                ...get().progress,
                averageAccuracy: newAccuracy,
                xpEarned: get().progress.xpEarned + xpReward
              }
            });
            
            // Update session progress
            get().updateSessionProgress(xpReward, isCorrect ? 100 : 0);
          }, 500);
        },
        
        // Audio & Media
        playAudio: (audioUrl: string) => {
          const audioElement = get().audioElement;
          if (audioElement) {
            audioElement.src = audioUrl;
            audioElement.play();
            set({ 
              isAudioPlaying: true, 
              currentAudioUrl: audioUrl 
            });
          }
        },
        
        pauseAudio: () => {
          const audioElement = get().audioElement;
          if (audioElement) {
            audioElement.pause();
            set({ isAudioPlaying: false });
          }
        },
        
        toggleAudio: (audioUrl?: string) => {
          const isPlaying = get().isAudioPlaying;
          const currentUrl = get().currentAudioUrl;
          
          if (isPlaying && (!audioUrl || audioUrl === currentUrl)) {
            get().pauseAudio();
          } else {
            get().playAudio(audioUrl || currentUrl || '');
          }
        },
        
        setAudioElement: (element: HTMLAudioElement) => {
          set({ audioElement: element });
        },
        
        // Progress
        updateProgress: (stats: Partial<ProgressStats>) => {
          set({ 
            progress: { ...get().progress, ...stats } 
          });
        },
        
        awardAchievement: (achievement: Achievement) => {
          const recentAchievements = [...get().recentAchievements, achievement];
          set({ 
            recentAchievements,
            progress: {
              ...get().progress,
              xpEarned: get().progress.xpEarned + achievement.xpReward
            }
          });
        },
        
        increaseXP: (amount: number) => {
          set({
            progress: {
              ...get().progress,
              xpEarned: get().progress.xpEarned + amount
            }
          });
        },
        
        // Subject Management
        setCurrentSubject: (subject: Subject) => {
          set({ currentSubject: subject });
        },
        
        updateSubjectProgress: (subject: Subject, progress: Partial<SubjectProgress>) => {
          const currentUser = get().currentUser;
          if (currentUser) {
            const updatedProgress = {
              ...currentUser.progress.subjectProgress[subject],
              ...progress
            };
            
            set({
              currentUser: {
                ...currentUser,
                progress: {
                  ...currentUser.progress,
                  subjectProgress: {
                    ...currentUser.progress.subjectProgress,
                    [subject]: updatedProgress
                  }
                }
              }
            });
          }
        },
        
        // Error Handling
        setError: (error: string | null) => {
          set({ error });
        },
        
        clearError: () => {
          set({ error: null });
        },
        
        // Special Actions for Quick Actions Component
        activateVoiceMode: async () => {
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            // Set voice mode state
            set({
              currentSubject: 'language-arts',
              currentSession: {
                id: `voice-${Date.now()}`,
                userId: get().currentUser?.id || 'guest',
                subject: 'language-arts',
                type: 'voice_practice',
                startTime: new Date(),
                activitiesCompleted: 0,
                xpEarned: 0,
                accuracy: 0,
                isActive: true
              }
            });
            
            if (isHealthy) {
              get().showNotification('Voice mode activated! AI-powered speech recognition ready.', 'success');
              
              // Get Kpelle cultural context for voice practice
              try {
                const culturalContext = await nuruAI.getKpelleCulturalContext('pronunciation and speaking');
                console.log('Kpelle cultural context for voice practice:', culturalContext);
              } catch (error) {
                console.warn('Could not load cultural context:', error);
              }
            } else {
              get().showNotification('Voice mode activated (AI features limited - service offline)', 'info');
            }
          } catch (error) {
            console.error('Voice mode activation error:', error);
            get().showNotification('Voice mode activated with basic features only', 'warning');
          }
        },
        
        activateImageAnalysis: async () => {
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            // Set image analysis mode
            set({
              currentSubject: 'language-arts',
              currentSession: {
                id: `image-${Date.now()}`,
                userId: get().currentUser?.id || 'guest',
                subject: 'language-arts',
                type: 'image_analysis',
                startTime: new Date(),
                activitiesCompleted: 0,
                xpEarned: 0,
                accuracy: 0,
                isActive: true
              }
            });
            
            if (isHealthy) {
              get().showNotification('Image analysis mode activated! AI-powered image recognition ready.', 'success');
            } else {
              get().showNotification('Image analysis mode activated (AI features limited - service offline)', 'info');
            }
          } catch (error) {
            console.error('Image analysis activation error:', error);
            get().showNotification('Image analysis mode activated with basic features only', 'warning');
          }
        },
        
        showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
          const notification: Notification = {
            id: `notification-${Date.now()}`,
            type,
            message,
            duration: 5000
          };
          
          get().addNotification(notification);
        },
        
        // Notification Management
        addNotification: (notification: Omit<Notification, 'id'>) => {
          const newNotification: Notification = {
            ...notification,
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          set({
            notifications: [...get().notifications, newNotification]
          });
          
          // Auto-remove notification after duration
          if (!notification.persistent && notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, notification.duration || 5000);
          }
        },
        
        removeNotification: (id: string) => {
          set({
            notifications: get().notifications.filter((n: Notification) => n.id !== id)
          });
        },
        
        clearNotifications: () => {
          set({ notifications: [] });
        },
        
        // Profile & Preferences Management
        updateProfile: (profile: Partial<UserProfile>) => {
          const currentProfile = get().userProfile;
          if (currentProfile) {
            set({
              userProfile: { ...currentProfile, ...profile }
            });
          }
          get().showNotification('Profile updated successfully!', 'success');
        },
        
        updatePreferences: (preferences: Partial<UserPreferences>) => {
          const currentPrefs = get().userPreferences;
          if (currentPrefs) {
            set({
              userPreferences: { ...currentPrefs, ...preferences }
            });
          }
          get().showNotification('Preferences updated successfully!', 'success');
        },
        
        updateNotificationSettings: (settings: Partial<NotificationSettings>) => {
          // Mock implementation - would integrate with actual notification system
          get().showNotification('Notification settings updated successfully!', 'success');
        },
        
        exportUserData: async () => {
          // Mock implementation - would export user data
          await new Promise(resolve => setTimeout(resolve, 1000));
          get().showNotification('User data export initiated!', 'info');
        },
        
        deleteAccount: async () => {
          // Mock implementation - would delete account
          await new Promise(resolve => setTimeout(resolve, 1000));
          get().showNotification('Account deletion initiated!', 'info');
        },
        
        uploadAvatar: async (file: File) => {
          // Mock implementation - would upload avatar
          await new Promise(resolve => setTimeout(resolve, 1000));
          get().showNotification('Avatar uploaded successfully!', 'success');
        },
        
        // Practice Session Management
        startPractice: (language: string, targetLanguage: string) => {
          set({
            currentLanguage: language,
            targetLanguage: targetLanguage,
            practiceSession: {
              id: `practice-${Date.now()}`,
              startTime: new Date(),
              currentExercise: 0,
              score: 0,
              exercises: []
            }
          });
          get().showNotification('Practice session started!', 'success');
        },
        
        submitPracticeAnswer: (answer: string) => {
          // Mock implementation - would submit and evaluate answer
          get().showNotification('Answer submitted!', 'info');
        },
        
        generatePracticeContent: async () => {
          set({ isLoadingLesson: true });
          
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              const currentSubject = get().currentSubject;
              const user = get().currentUser;
              const difficulty = user?.proficiencyLevel || 'beginner';
              
              // Generate practice exercises using Nuru AI
              const exercises = await nuruAI.generatePracticeExercises(
                currentSubject,
                difficulty,
                5 // Generate 5 exercises
              );
              
              // Update practice session with AI-generated content
              const currentPractice = get().practiceSession;
              if (currentPractice) {
                set({
                  practiceSession: {
                    ...currentPractice,
                    exercises: exercises.map((exercise: any, index: number) => ({
                      id: `exercise-${index}`,
                      question: exercise.question,
                      options: exercise.options || [],
                      correctAnswer: exercise.correct_answer,
                      explanation: exercise.explanation,
                      type: exercise.type,
                      completed: false
                    }))
                  }
                });
              }
              
              set({ isLoadingLesson: false });
              get().showNotification('New AI-generated practice content ready!', 'success');
            } else {
              // Fallback to mock content
              set({ isLoadingLesson: false });
              get().showNotification('Generated sample practice content (AI unavailable)', 'info');
            }
          } catch (error) {
            console.error('Failed to generate practice content:', error);
            set({ isLoadingLesson: false });
            get().showNotification('Failed to generate practice content', 'error');
          }
        },
        
        analyzeUserPerformance: async () => {
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              const currentSubject = get().currentSubject;
              const user = get().currentUser;
              const practiceSession = get().practiceSession;
              
              if (practiceSession && practiceSession.exercises) {
                // Prepare performance data for AI analysis
                const performanceRequest: PerformanceAnalysisRequest = {
                  user_responses: practiceSession.exercises
                    .filter((ex: any) => ex.completed)
                    .map((exercise: any) => ({
                      question: exercise.question,
                      user_answer: exercise.userAnswer || '',
                      correct_answer: exercise.correctAnswer,
                      response_time: exercise.responseTime || 5000
                    })),
                  subject: currentSubject,
                  difficulty: user?.proficiencyLevel || 'beginner'
                };
                
                if (performanceRequest.user_responses.length > 0) {
                  const analysis = await nuruAI.analyzePerformance(performanceRequest);
                  
                  // Show analysis results to user
                  get().showNotification(
                    `Performance Analysis: ${analysis.overall_score}% score. ${analysis.recommendations[0] || 'Keep practicing!'}`,
                    analysis.overall_score >= 70 ? 'success' : 'info'
                  );
                  
                  // Store analysis results (could be added to state if needed)
                  console.log('AI Performance Analysis:', analysis);
                } else {
                  get().showNotification('Complete some exercises first to get performance analysis', 'info');
                }
              } else {
                get().showNotification('No practice session data available for analysis', 'info');
              }
            } else {
              get().showNotification('Performance analysis unavailable (AI service offline)', 'warning');
            }
          } catch (error) {
            console.error('Performance analysis error:', error);
            get().showNotification('Failed to analyze performance', 'error');
          }
        },
        
        startRecording: () => {
          set({ isRecording: true, audioLevel: 0 });
          get().showNotification('Recording started! Speak clearly for best AI transcription.', 'success');
        },
        
        stopRecording: async () => {
          set({ isRecording: false, audioLevel: 0 });
          
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              get().showNotification('Recording stopped! Processing with AI transcription...', 'info');
              
              // Here you would typically have the actual audio file/blob from the recording
              // For now, we'll simulate the process
              // In a real implementation, you'd pass the recorded audio to transcribe()
              
              // Simulate AI transcription process
              setTimeout(() => {
                get().showNotification('AI transcription complete! Check your pronunciation feedback.', 'success');
              }, 2000);
            } else {
              get().showNotification('Recording stopped (AI transcription unavailable)', 'info');
            }
          } catch (error) {
            console.error('Recording processing error:', error);
            get().showNotification('Recording stopped with limited processing', 'warning');
          }
        },
        
        // Nuru AI Integration Functions
        translateToKpelle: async (text: string) => {
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              const translation = await nuruAI.translateToKpelle({
                text,
                target_language: 'kpe',
                context: 'educational_content'
              });
              
              get().showNotification(`Translation: "${translation.translated_text}"`, 'success');
              return translation.translated_text;
            } else {
              get().showNotification('Translation unavailable (AI service offline)', 'warning');
              return text; // Return original text as fallback
            }
          } catch (error) {
            console.error('Translation error:', error);
            get().showNotification('Translation failed', 'error');
            return text;
          }
        },
        
        processWithAI: async (content: { text?: string; image?: File; audio?: File }, mode: 'text' | 'image' | 'audio' | 'multimodal') => {
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              const result = await nuruAI.process({
                text: content.text,
                image: content.image,
                audio: content.audio,
                mode,
                language: 'kpe',
                task: 'educational_analysis'
              });
              
              get().showNotification('AI processing complete!', 'success');
              return result;
            } else {
              get().showNotification('AI processing unavailable (service offline)', 'warning');
              return null;
            }
          } catch (error) {
            console.error('AI processing error:', error);
            get().showNotification('AI processing failed', 'error');
            return null;
          }
        },
        
        getCulturalContext: async (topic: string) => {
          try {
            const isHealthy = await nuruAI.checkHealth();
            
            if (isHealthy) {
              const context = await nuruAI.getKpelleCulturalContext(topic);
              get().showNotification('Cultural context loaded!', 'success');
              return context;
            } else {
              get().showNotification('Cultural context unavailable (AI service offline)', 'warning');
              return `Cultural context for "${topic}" is not available at the moment.`;
            }
          } catch (error) {
            console.error('Cultural context error:', error);
            get().showNotification('Failed to load cultural context', 'error');
            return `Cultural context for "${topic}" is not available at the moment.`;
          }
        },
        
        // Utility
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'nuru-learn-learning-storage',
        storage: createJSONStorage(() => localStorage),
        // Only persist essential data
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          currentUser: state.currentUser,
          currentSubject: state.currentSubject,
          progress: state.progress,
          lessonProgress: state.lessonProgress,
          completedActivities: Array.from(state.completedActivities), // Convert Set to Array for serialization
        }),
        // Handle Set deserialization
        onRehydrateStorage: () => (state) => {
          if (state?.completedActivities && Array.isArray(state.completedActivities)) {
            state.completedActivities = new Set(state.completedActivities);
          }
        }
      }
    )
  )
);

// Convenience hooks
export const useUser = () => useLearningStore((state) => state.currentUser);
export const useProgress = () => useLearningStore((state) => state.progress);
export const useCurrentSession = () => useLearningStore((state) => state.currentSession);
export const useIsAuthenticated = () => useLearningStore((state) => state.isAuthenticated);
export const useCurrentLesson = () => useLearningStore((state) => state.currentLesson);
export const useAudioPlayer = () => ({
  isPlaying: useLearningStore((state) => state.isAudioPlaying),
  currentUrl: useLearningStore((state) => state.currentAudioUrl),
  play: useLearningStore((state) => state.playAudio),
  pause: useLearningStore((state) => state.pauseAudio),
  toggle: useLearningStore((state) => state.toggleAudio),
});
