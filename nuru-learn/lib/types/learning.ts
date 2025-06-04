// Type definitions for Nuru Learn application

// Core language types
export type Language = 'english' | 'kpelle';

// Educational subjects
export type Subject = 'mathematics' | 'language-arts' | 'science' | 'social-studies' | 'life-skills';

// Difficulty levels (1-10 scale)
export type DifficultyLevel = number;

// Learning session interaction types
export type InteractionType = 'translation' | 'voice-input' | 'voice-output' | 'explanation' | 'assessment' | 'cultural-context';

export type ExplanationStyle = 'simple' | 'detailed' | 'step-by-step' | 'cultural-focused';

// Core data structures
export interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: Language;
  learningLanguages: Language[];
  progress: ProgressMetrics;
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface Interaction {
  id: string;
  sessionId: string;
  type: InteractionType;
  timestamp: Date;
  input: {
    text?: string;
    audio?: string;
    language: Language;
  };
  output: {
    text?: string;
    audio?: string;
    language: Language;
    culturalContext?: string;
    confidence?: number;
  };
  feedback?: {
    accuracy: number;
    improvementSuggestions: string[];
  };
}

export interface LearningSession {
  id: string;
  userId: string;
  subject: Subject;
  primaryLanguage: Language;
  targetLanguage: Language;
  adaptiveLevel: DifficultyLevel;
  interactions: Interaction[];
  progress: ProgressMetrics;
  startTime: Date;
  endTime?: Date;
}

export interface ProgressMetrics {
  totalInteractions: number;
  correctTranslations: number;
  averageAccuracy: number;
  strongLanguage: Language;
  improvementAreas: string[];
  streakDays: number;
  timeSpentMinutes: number;
  levelProgression: Record<Subject, number>;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  subject: Subject;
  targetLanguage: Language;
  progress: number; // 0-100
  completed: boolean;
  createdAt: Date;
  targetDate?: Date;
}

// Cultural context data
export interface CulturalContext {
  id: string;
  concept: string;
  language: Language;
  explanation: string;
  examples: string[];
  culturalNotes: string[];
  appropriateUsage: string[];
}

// Voice/Audio types
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  format: string;
}

export interface VoiceProfile {
  id: string;
  language: Language;
  gender: 'male' | 'female';
  accent?: string;
  description: string;
}