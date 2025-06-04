/**
 * Advanced Educational Types for Nuru Learn Platform
 * Leveraging Nuru AI's full multimodal capabilities
 */

export type Language = "en" | "kpe";

export type LearningMode = 
  | "immersion"      // Full language immersion
  | "guided"         // Step-by-step guided learning
  | "conversation"   // AI conversation practice
  | "visual"         // Image-based learning
  | "cultural";      // Cultural context learning

export type Subject = 
  | "language-arts"  // Reading, writing, grammar
  | "mathematics"    // Numbers, calculations, problem solving
  | "science"        // Natural sciences, experiments
  | "social-studies" // History, geography, civics
  | "life-skills"    // Practical daily skills
  | "culture";       // Kpelle cultural knowledge

export interface MultimodalContent {
  id: string;
  text?: {
    en: string;
    kpe: string;
  };
  audio?: {
    en?: string; // URL or base64
    kpe?: string;
  };
  image?: string; // URL or base64
  video?: string;
  culturalContext?: {
    background: string;
    significance: string;
    modernRelevance: string;
  };
}

export interface LearningSession {
  id: string;
  userId: string;
  subject: Subject;
  mode: LearningMode;
  primaryLanguage: Language;
  targetLanguage: Language;
  startTime: number;
  endTime?: number;
  content: MultimodalContent[];
  interactions: LearningInteraction[];
  progress: SessionProgress;
  aiInsights: AIInsights;
}

export interface LearningInteraction {
  id: string;
  timestamp: number;
  type: 'speech' | 'text' | 'image' | 'quiz' | 'conversation';
  input: {
    modality: 'audio' | 'text' | 'image' | 'multimodal';
    content: any;
    language: Language;
  };
  response: {
    modality: 'audio' | 'text' | 'image' | 'multimodal';
    content: any;
    language: Language;
    processingTime: number;
  };
  feedback: {
    accuracy: number;
    culturalRelevance: number;
    suggestions: string[];
  };
}

export interface SessionProgress {
  completionPercentage: number;
  conceptsMastered: string[];
  areasForImprovement: string[];
  timeSpent: number;
  interactionCount: number;
  accuracyScore: number;
  culturalContextScore: number;
}

export interface AIInsights {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  strengths: string[];
  recommendations: string[];
  nextLessonSuggestions: string[];
  culturalConnectionPoints: string[];
}

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
  nativeLanguage: Language;
  learningLanguage: Language;
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
  preferredSubjects: Subject[];
  learningGoals: string[];
  culturalBackground: {
    region?: string;
    interests: string[];
  };
  preferences: {
    voiceEnabled: boolean;
    imageRecognition: boolean;
    culturalContextLevel: 'basic' | 'detailed' | 'immersive';
    learningPace: 'slow' | 'normal' | 'fast';
  };
  progress: {
    totalSessions: number;
    totalTimeSpent: number;
    overallAccuracy: number;
    skillLevels: Record<Subject, number>; // 0-100
    badges: Badge[];
    streak: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
  category: 'accuracy' | 'consistency' | 'cultural' | 'multimodal' | 'social';
}

export interface Lesson {
  id: string;
  title: {
    en: string;
    kpe: string;
  };
  description: {
    en: string;
    kpe: string;
  };
  subject: Subject;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedDuration: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  content: MultimodalContent[];
  activities: LearningActivity[];
  culturalNotes: {
    context: string;
    significance: string;
    modernApplication: string;
  };
}

export interface LearningActivity {
  id: string;
  type: 'translation' | 'pronunciation' | 'comprehension' | 'cultural-quiz' | 'conversation' | 'image-description';
  instruction: {
    en: string;
    kpe: string;
  };
  content: MultimodalContent;
  expectedResponse: {
    type: 'text' | 'audio' | 'selection' | 'multimodal';
    validation: any;
  };
  hints: string[];
  culturalContext?: string;
}

// API Types for Nuru Integration
export interface NuruAPIRequest {
  text?: string;
  audio?: Blob | string;
  image?: Blob | string;
  language: Language;
  mode: 'translation' | 'conversation' | 'analysis' | 'synthesis';
  context?: {
    subject: Subject;
    culturalLevel: string;
    learningObjective: string;
  };
}

export interface NuruAPIResponse {
  success: boolean;
  data: {
    text?: {
      content: string;
      language: Language;
      confidence: number;
    };
    audio?: {
      url: string;
      duration: number;
      quality: number;
    };
    analysis?: {
      accuracy: number;
      pronunciation: number;
      fluency: number;
      culturalRelevance: number;
    };
    suggestions?: string[];
    culturalInsights?: {
      context: string;
      modernRelevance: string;
      relatedConcepts: string[];
    };
  };
  processingTime: number;
  error?: string;
}

export interface LearningAnalytics {
  userId: string;
  timeframe: 'day' | 'week' | 'month' | 'all';
  metrics: {
    sessionsCompleted: number;
    totalTimeSpent: number;
    averageAccuracy: number;
    conceptsMastered: number;
    culturalConceptsLearned: number;
    languagePairProgress: {
      [key: string]: number; // "en-kpe": 75
    };
    modalityPreferences: {
      audio: number;
      visual: number;
      text: number;
      multimodal: number;
    };
    subjectProgress: Record<Subject, {
      level: number;
      accuracy: number;
      timeSpent: number;
    }>;
  };
  insights: {
    strongestSkills: string[];
    improvementAreas: string[];
    recommendedFocus: string[];
    culturalConnectionStrength: number;
  };
}

export interface RealTimeSession {
  sessionId: string;
  participants: UserProfile[];
  mode: 'solo' | 'ai-tutor' | 'peer-practice';
  currentActivity: LearningActivity;
  realTimeData: {
    audioStream?: MediaStream;
    videoStream?: MediaStream;
    sharedScreen?: MediaStream;
  };
  feedback: {
    live: boolean;
    aiInsights: AIInsights;
    performance: SessionProgress;
  };
}

// Store State Types
export interface LearningStore {
  // User
  user: UserProfile | null;
  
  // Current Session
  currentSession: LearningSession | null;
  activeLessons: Lesson[];
  
  // Real-time Features
  isRecording: boolean;
  audioLevel: number;
  currentAudio: HTMLAudioElement | null;
  
  // Analytics
  analytics: LearningAnalytics | null;
  
  // UI State
  selectedLanguage: Language;
  selectedSubject: Subject;
  learningMode: LearningMode;
  showCulturalContext: boolean;
  
  // Actions
  setUser: (user: UserProfile) => void;
  startSession: (config: Partial<LearningSession>) => void;
  endSession: () => void;
  addInteraction: (interaction: LearningInteraction) => void;
  updateProgress: (progress: Partial<SessionProgress>) => void;
  
  // Multimodal Actions
  processAudio: (audio: Blob, language: Language) => Promise<NuruAPIResponse>;
  processImage: (image: Blob, context: string) => Promise<NuruAPIResponse>;
  synthesizeSpeech: (text: string, language: Language) => Promise<NuruAPIResponse>;
  translateText: (text: string, from: Language, to: Language) => Promise<NuruAPIResponse>;
  
  // Analytics Actions
  updateAnalytics: () => void;
  generateInsights: () => Promise<AIInsights>;
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
