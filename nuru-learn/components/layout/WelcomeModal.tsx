'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { type Subject } from '@/lib/stores/enhanced-learning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Users, 
  Heart,
  X,
  ArrowRight,
  Languages,
  Mic,
  MessageCircle,
  Headphones,
  Brain,
  Star,
  Zap,
  Volume2,
  Eye,
  UserCheck,
  Sparkles
} from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
  onStartLearning?: () => void;
}

export function WelcomeModal({ onClose, onStartLearning }: WelcomeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<string>('kpe');
  const [selectedSubject, setSelectedSubject] = useState<Subject>('language-arts');
  
  const { addNotification, initializeUser, startSession, initializeSession } = useLearningStore();

  const languages: { value: string; label: string; flag: string; description: string }[] = [
    { 
      value: 'en', 
      label: 'English', 
      flag: '🇺🇸',
      description: 'Global communication and academic language'
    },
    { 
      value: 'kpe', 
      label: 'Kpelle', 
      flag: '🇱🇷',
      description: 'Indigenous Liberian language rich in oral tradition'
    },
  ];

  const subjects: { value: Subject; label: string; icon: any; description: string; features: string[] }[] = [
    { 
      value: 'language-arts', 
      label: 'Language Arts', 
      icon: Languages,
      description: 'Master reading, writing, and cross-cultural communication',
      features: ['Voice Recognition', 'Cultural Context', 'Interactive Stories']
    },
    { 
      value: 'mathematics', 
      label: 'Mathematics', 
      icon: Brain,
      description: 'Solve problems with AI-guided learning paths',
      features: ['Step-by-step Solutions', 'Visual Learning', 'Real-world Applications']
    },
    { 
      value: 'science', 
      label: 'Science', 
      icon: Sparkles,
      description: 'Explore natural phenomena through multimodal experiences',
      features: ['Interactive Experiments', 'Image Analysis', 'Discovery Learning']
    },
    { 
      value: 'social-studies', 
      label: 'Social Studies', 
      icon: Users,
      description: 'Connect with Kpelle heritage and global perspectives',
      features: ['Cultural Immersion', 'Historical Context', 'Community Stories']
    },
    { 
      value: 'life-skills', 
      label: 'Life Skills', 
      icon: Heart,
      description: 'Practical knowledge for daily life and community engagement',
      features: ['Real-world Scenarios', 'Community Integration', 'Practical Applications']
    },
  ];

  const handleComplete = async () => {
    try {
      // Create a comprehensive user profile for enhanced learning
      const newUser = {
        id: `user_${Date.now()}`,
        name: 'New Learner',
        email: '',
        avatar: undefined,
        proficiencyLevel: 'beginner' as const,
        preferredSubjects: [selectedSubject],
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
            'life-skills': { level: 1, xp: 0, lessonsCompleted: 0, accuracy: 0, timeSpent: 0 },
          },
        },
        dailyProgress: {
          challengeCompleted: false,
          streakDays: 0,
          todayXP: 0,
        },
        settings: {
          language: selectedLanguage,
          targetLanguage: selectedTargetLanguage,
          theme: 'light' as const,
          notifications: true,
          soundEnabled: true,
          autoplay: false,
          difficulty: 'beginner' as const,
        },
        createdAt: new Date(),
        lastActive: new Date(),
      };

      // Initialize user in the enhanced store
      await initializeUser(newUser);
      
      // Start a learning session for the selected subject
      await startSession(selectedSubject);
      
      // Initialize the session context
      await initializeSession();
      
      // Show success notification
      addNotification({
        type: 'success',
        title: 'Welcome to Nuru Learn!',
        message: `Your ${selectedSubject.replace('-', ' ')} learning journey begins now. Experience AI-powered education that bridges ${selectedLanguage === 'en' ? 'English' : 'Kpelle'} and ${selectedTargetLanguage === 'en' ? 'English' : 'Kpelle'}.`
      });
      
      // Navigate to the appropriate learning experience based on subject
      const subjectRoutes: Record<Subject, string> = {
        'language-arts': '/listening',
        'mathematics': '/ai-chat',
        'science': '/stories', 
        'social-studies': '/voice-practice',
        'life-skills': '/ai-chat'
      };
      
      // Small delay to ensure store updates are processed
      setTimeout(() => {
        router.push(subjectRoutes[selectedSubject]);
        
        // Call onStartLearning callback if provided
        if (onStartLearning) {
          onStartLearning();
        }
        
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Error setting up learning session:', error);
      addNotification({
        type: 'error',
        title: 'Setup Error',
        message: 'There was an issue setting up your learning session. Please try again.'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-blue-600" />
              <span>Welcome to Nuru Learn</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  AI-Powered Education for Kpelle Heritage
                </h2>
                <p className="text-gray-600 mb-4">
                  Experience cutting-edge AI that understands both languages and cultures. 
                  Learn through voice, image, and interactive conversations while preserving Kpelle traditions.
                </p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                  <Zap className="h-4 w-4 mr-1" />
                  Powered by Nuru AI
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Mic className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Voice Intelligence</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Speak naturally in either language. Our AI understands pronunciation, context, and cultural nuances.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Eye className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Visual Learning</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Upload images to learn vocabulary, analyze scenes, and connect visual concepts to language.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="h-6 w-6 text-purple-600 mr-2" />
                    <h3 className="font-semibold text-purple-900">AI Conversations</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    Chat with AI tutors who adapt to your learning style and provide cultural context.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Heart className="h-6 w-6 text-orange-600 mr-2" />
                    <h3 className="font-semibold text-orange-900">Cultural Bridge</h3>
                  </div>
                  <p className="text-sm text-orange-700">
                    Learn with deep respect for Kpelle traditions, stories, and community values.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-1" />
                    <span>Voice Recognition</span>
                  </div>
                  <div className="flex items-center">
                    <Headphones className="h-4 w-4 mr-1" />
                    <span>Audio Generation</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    <span>Adaptive Learning</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Begin Your Journey <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Choose Your Learning Path
                </h2>
                <p className="text-gray-600 mb-4">
                  Nuru Learn adapts to your language preferences, creating a personalized bilingual experience.
                </p>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                    Primary Language (Most Comfortable)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <Card
                        key={lang.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedLanguage === lang.value
                            ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedLanguage(lang.value)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{lang.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium">{lang.label}</div>
                              <div className="text-sm text-gray-600 mt-1">{lang.description}</div>
                            </div>
                            {selectedLanguage === lang.value && (
                              <div className="text-blue-600">
                                <Star className="h-4 w-4 fill-current" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Languages className="h-5 w-5 mr-2 text-green-600" />
                    Target Language (Learning Goal)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {languages.filter(lang => lang.value !== selectedLanguage).map((lang) => (
                      <Card
                        key={lang.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTargetLanguage === lang.value
                            ? 'ring-2 ring-green-500 border-green-200 bg-green-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedTargetLanguage(lang.value)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{lang.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium">{lang.label}</div>
                              <div className="text-sm text-gray-600 mt-1">{lang.description}</div>
                            </div>
                            {selectedTargetLanguage === lang.value && (
                              <div className="text-green-600">
                                <Star className="h-4 w-4 fill-current" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Sparkles className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800">
                        <strong>AI Adaptation:</strong> Our system will automatically adjust content difficulty, 
                        provide translations when needed, and offer cultural context to enhance your learning experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Choose Your Learning Focus
                </h2>
                <p className="text-gray-600 mb-4">
                  Each subject integrates AI-powered multimodal learning with cultural context. 
                  Start with one area and explore others anytime.
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  {subjects.map((subject) => {
                    const Icon = subject.icon;
                    return (
                      <Card
                        key={subject.value}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedSubject === subject.value
                            ? 'ring-2 ring-purple-500 border-purple-200 bg-purple-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedSubject(subject.value)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              selectedSubject === subject.value 
                                ? 'bg-purple-100' 
                                : 'bg-gray-100'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                selectedSubject === subject.value 
                                  ? 'text-purple-600' 
                                  : 'text-gray-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">{subject.label}</h3>
                                {selectedSubject === subject.value && (
                                  <div className="text-purple-600">
                                    <Star className="h-5 w-5 fill-current" />
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3">{subject.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {subject.features.map((feature, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className={`text-xs ${
                                      selectedSubject === subject.value
                                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Adaptive AI Learning</h4>
                      <p className="text-sm text-blue-800">
                        Your chosen subject will be enhanced with voice recognition, image analysis, 
                        cultural storytelling, and personalized AI tutoring that adapts to your progress.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Start Learning Journey! <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
