/**
 * ProfileView Component
 * User profile management with preferences, settings, and account information
 */

'use client';

import { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User,
  Settings,
  Bell,
  Globe,
  Shield,
  Palette,
  Download,
  Trash2,
  Edit3,
  Camera,
  Save,
  Undo,
  Star,
  Trophy,
  Target,
  Calendar,
  Clock,
  BookOpen,
  Zap,
  MapPin,
  Languages,
  GraduationCap,
  Award} from 'lucide-react';
import type { UserProfile, UserPreferences, NotificationSettings } from '@/lib/types/education';

export function ProfileView() {
  const {
    currentUser,
    isAuthenticated
  } = useLearningStore();

  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize state with proper defaults to prevent controlled/uncontrolled issues
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    goals: [],
    primaryLanguage: 'kpelle',
    educationLevel: 'middle_school'
  });
  
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    difficulty: 'adaptive',
    studySessionLength: 25,
    voiceSpeed: 'normal',
    theme: 'light'
  });
  
  const [notifications, setNotifications] = useState<Partial<NotificationSettings>>({
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    reminderTime: '18:00'
  });
  
  const [isSaving, setIsSaving] = useState(false);

  // Mock user profile - in production this would come from the API
  const mockProfile: UserProfile = {
    id: 'user-001',
    name: 'Kpelle Learner',
    email: 'student@example.com',
    firstName: 'Kpelle',
    lastName: 'Learner',
    displayName: 'Kpelle Learner',
    avatar: '/avatars/student.jpg',
    dateOfBirth: '2010-05-15',
    location: 'Monrovia, Liberia',
    primaryLanguage: 'kpelle',
    learningLanguages: ['english'],
    nativeLanguage: 'kpe' as const,
    learningLanguage: 'en' as const,
    preferredSubjects: ['language-arts' as const],
    learningGoals: ['fluent_bilingual', 'cultural_ambassador', 'academic_excellence'],
    culturalBackground: {
      region: 'Liberia',
      interests: ['traditional_stories', 'mathematics', 'science', 'cultural_preservation']
    },
    preferences: {
      voiceEnabled: true,
      imageRecognition: true,
      culturalContextLevel: 'detailed' as const,
      learningPace: 'normal' as const
    },
    progress: {
      totalSessions: 45,
      totalTimeSpent: 2340,
      overallAccuracy: 92,
      skillLevels: {
        'language-arts': 80,
        'mathematics': 60,
        'science': 40,
        'social-studies': 30,
        'life-skills': 70,
        'culture': 85
      },
      badges: [],
      streak: 12
    },
    bio: 'Passionate about learning and preserving Kpelle culture while mastering English.',
    joinDate: '2024-03-15',
    timezone: 'Africa/Monrovia',
    educationLevel: 'middle_school',
    interests: ['traditional_stories', 'mathematics', 'science', 'cultural_preservation'],
    goals: ['fluent_bilingual', 'cultural_ambassador', 'academic_excellence'],
    achievements: [
      { id: 'first_lesson', name: 'First Steps', earnedAt: '2024-03-15' },
      { id: 'week_streak', name: 'Week Warrior', earnedAt: '2024-03-22' },
      { id: 'cultural_explorer', name: 'Cultural Explorer', earnedAt: '2024-04-10' }
    ],
    statistics: {
      totalLessons: 45,
      totalXP: 4250,
      currentStreak: 12,
      longestStreak: 28,
      studyTime: 2340,
      accuracy: 92,
      level: 8
    }
  };

  const mockPreferences: UserPreferences = {
    theme: 'light',
    language: 'kpelle',
    autoplayAudio: true,
    showCulturalNotes: true,
    enableVoiceRecognition: true,
    difficulty: 'adaptive',
    practiceReminders: true,
    studySessionLength: 25,
    dailyGoal: 30,
    weeklyGoal: 210,
    voiceSpeed: 'normal',
    subtitles: true,
    keyboardShortcuts: true,
    animations: true,
    soundEffects: true,
    hapticFeedback: true
  };

  const mockNotifications: NotificationSettings = {
    practiceReminders: true,
    achievementAlerts: true,
    streakReminders: true,
    weeklyProgress: true,
    newContent: false,
    socialUpdates: false,
    marketingEmails: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    reminderTime: '18:00',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00'
    }
  };

  const profile = mockProfile;
  const userPrefs = mockPreferences;

  // Initialize state only when component mounts
  useEffect(() => {
    setFormData({
      ...mockProfile,
      goals: mockProfile.goals || []
    });
  }, []);

  useEffect(() => {
    setPreferences(mockPreferences);
  }, []);

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Mock save - in production this would call the API
      console.log('Saving profile:', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      // Mock save - in production this would call the API
      console.log('Saving preferences:', preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // Mock save - in production this would call the API
      console.log('Saving notifications:', notifications);
    } catch (error) {
      console.error('Failed to update notifications:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="w-12 h-12 mx-auto text-primary-500 mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view and manage your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar} alt={profile.displayName} />
                <AvatarFallback className="text-2xl">{profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full p-2"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className="w-4 h-4" />
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                aria-label="Upload avatar image"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) console.log('Avatar upload:', file.name);
                }}
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Star className="w-3 h-3" />
                  <span>Level {profile.statistics.level}</span>
                </Badge>
              </div>
              <p className="text-gray-600 mb-3">{profile.bio}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Languages className="w-4 h-4" />
                  <span>{profile.primaryLanguage} → {profile.learningLanguages.join(', ')}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Button
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditing ? 'Save' : 'Edit Profile'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.statistics.totalLessons}</div>
            <div className="text-xs text-gray-600">Lessons</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.statistics.totalXP}</div>
            <div className="text-xs text-gray-600">XP</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.statistics.accuracy}%</div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.statistics.currentStreak}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{Math.round(profile.statistics.studyTime / 60)}h</div>
            <div className="text-xs text-gray-600">Study Time</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{profile.achievements.length}</div>
            <div className="text-xs text-gray-600">Achievements</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Profile Content */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>Update your basic profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName || ''}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName || ''}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {isEditing && (
                  <div className="flex space-x-3">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      <Undo className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Learning Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Learning Profile</span>
                </CardTitle>
                <CardDescription>Your learning preferences and goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryLanguage">Primary Language</Label>
                  <Select 
                    value={formData.primaryLanguage || 'kpelle'} 
                    onValueChange={(value) => setFormData({...formData, primaryLanguage: value})} 
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kpelle">Kpelle</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="educationLevel">Education Level</Label>
                  <Select 
                    value={formData.educationLevel || 'middle_school'} 
                    onValueChange={(value) => setFormData({...formData, educationLevel: value})} 
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elementary">Elementary</SelectItem>
                      <SelectItem value="middle_school">Middle School</SelectItem>
                      <SelectItem value="high_school">High School</SelectItem>
                      <SelectItem value="adult_learner">Adult Learner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Learning Goals</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {['fluent_bilingual', 'cultural_ambassador', 'academic_excellence', 'career_preparation'].map((goal) => (
                      <div key={goal} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={goal}
                          checked={formData.goals?.includes(goal) || false}
                          onChange={(e) => {
                            const newGoals = e.target.checked 
                              ? [...(formData.goals || []), goal]
                              : (formData.goals || []).filter(g => g !== goal);
                            setFormData({...formData, goals: newGoals});
                          }}
                          disabled={!isEditing}
                          className="rounded"
                          aria-label={`${goal.replace('_', ' ')} learning goal`}
                        />
                        <Label htmlFor={goal} className="text-sm capitalize">{goal.replace('_', ' ')}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.interests.map((interest: string, index: number) => (
                      <Badge key={index} variant="secondary" className="capitalize">
                        {interest.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Recent Achievements</span>
              </CardTitle>
              <CardDescription>Your latest learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.achievements.map((achievement: any) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                    <div>
                      <div className="font-medium text-gray-900">{achievement.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Learning Preferences</span>
                </CardTitle>
                <CardDescription>Customize your learning experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Mode</Label>
                  <Select 
                    value={preferences.difficulty || 'adaptive'} 
                    onValueChange={(value: 'easy' | 'medium' | 'hard' | 'adaptive') => setPreferences({...preferences, difficulty: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="adaptive">Adaptive (AI-powered)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="sessionLength">Default Session Length (minutes)</Label>
                  <Select 
                    value={preferences.studySessionLength?.toString() || '25'} 
                    onValueChange={(value) => setPreferences({...preferences, studySessionLength: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="25">25 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="voiceSpeed">Voice Playback Speed</Label>
                  <Select 
                    value={preferences.voiceSpeed || 'normal'} 
                    onValueChange={(value: 'slow' | 'normal' | 'fast') => setPreferences({...preferences, voiceSpeed: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoplay">Autoplay Audio</Label>
                      <p className="text-sm text-gray-600">Automatically play audio in lessons</p>
                    </div>
                    <Switch
                      id="autoplay"
                      checked={preferences.autoplayAudio || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, autoplayAudio: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cultural">Show Cultural Notes</Label>
                      <p className="text-sm text-gray-600">Display cultural context information</p>
                    </div>
                    <Switch
                      id="cultural"
                      checked={preferences.showCulturalNotes || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, showCulturalNotes: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice">Voice Recognition</Label>
                      <p className="text-sm text-gray-600">Enable microphone for pronunciation</p>
                    </div>
                    <Switch
                      id="voice"
                      checked={preferences.enableVoiceRecognition || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, enableVoiceRecognition: checked})}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>

            {/* App Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>App Preferences</span>
                </CardTitle>
                <CardDescription>Customize the app interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={preferences.theme || 'light'} 
                    onValueChange={(value: 'light' | 'dark' | 'system') => setPreferences({...preferences, theme: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="subtitles">Subtitles</Label>
                      <p className="text-sm text-gray-600">Show text during audio playback</p>
                    </div>
                    <Switch
                      id="subtitles"
                      checked={preferences.subtitles || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, subtitles: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations">Animations</Label>
                      <p className="text-sm text-gray-600">Enable smooth transitions and effects</p>
                    </div>
                    <Switch
                      id="animations"
                      checked={preferences.animations || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, animations: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sounds">Sound Effects</Label>
                      <p className="text-sm text-gray-600">Play feedback sounds</p>
                    </div>
                    <Switch
                      id="sounds"
                      checked={preferences.soundEffects || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, soundEffects: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="haptic">Haptic Feedback</Label>
                      <p className="text-sm text-gray-600">Vibration feedback (mobile)</p>
                    </div>
                    <Switch
                      id="haptic"
                      checked={preferences.hapticFeedback || false}
                      onCheckedChange={(checked) => setPreferences({...preferences, hapticFeedback: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="shortcuts">Keyboard Shortcuts</Label>
                     <p className="text-sm text-gray-600">Enable keyboard navigation</p>
                   </div>
                   <Switch
                     id="shortcuts"
                     checked={preferences.keyboardShortcuts || false}
                     onCheckedChange={(checked) => setPreferences({...preferences, keyboardShortcuts: checked})}
                   />
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
       </TabsContent>

       <TabsContent value="notifications" className="space-y-6">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center space-x-2">
               <Bell className="w-5 h-5" />
               <span>Notification Settings</span>
             </CardTitle>
             <CardDescription>Manage how and when you receive notifications</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <h3 className="font-medium text-gray-900">Learning Notifications</h3>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="practice">Practice Reminders</Label>
                     <p className="text-sm text-gray-600">Daily reminders to practice</p>
                   </div>
                   <Switch
                     id="practice"
                     checked={notifications.practiceReminders || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, practiceReminders: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="achievements">Achievement Alerts</Label>
                     <p className="text-sm text-gray-600">When you earn new achievements</p>
                   </div>
                   <Switch
                     id="achievements"
                     checked={notifications.achievementAlerts || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, achievementAlerts: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="streak">Streak Reminders</Label>
                     <p className="text-sm text-gray-600">Keep your learning streak alive</p>
                   </div>
                   <Switch
                     id="streak"
                     checked={notifications.streakReminders || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, streakReminders: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="progress">Weekly Progress</Label>
                     <p className="text-sm text-gray-600">Weekly summary of your progress</p>
                   </div>
                   <Switch
                     id="progress"
                     checked={notifications.weeklyProgress || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, weeklyProgress: checked})}
                   />
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-medium text-gray-900">App Notifications</h3>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="content">New Content</Label>
                     <p className="text-sm text-gray-600">When new lessons are available</p>
                   </div>
                   <Switch
                     id="content"
                     checked={notifications.newContent || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, newContent: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="social">Social Updates</Label>
                     <p className="text-sm text-gray-600">Community and social features</p>
                   </div>
                   <Switch
                     id="social"
                     checked={notifications.socialUpdates || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, socialUpdates: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label htmlFor="marketing">Marketing Emails</Label>
                     <p className="text-sm text-gray-600">Product updates and offers</p>
                   </div>
                   <Switch
                     id="marketing"
                     checked={notifications.marketingEmails || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, marketingEmails: checked})}
                   />
                 </div>
               </div>
             </div>

             <Separator />

             <div className="space-y-4">
               <h3 className="font-medium text-gray-900">Delivery Preferences</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="flex items-center justify-between">
                   <Label htmlFor="push">Push Notifications</Label>
                   <Switch
                     id="push"
                     checked={notifications.pushNotifications || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, pushNotifications: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <Label htmlFor="email">Email Notifications</Label>
                   <Switch
                     id="email"
                     checked={notifications.emailNotifications || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                   />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <Label htmlFor="sms">SMS Notifications</Label>
                   <Switch
                     id="sms"
                     checked={notifications.smsNotifications || false}
                     onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
                   />
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <Label htmlFor="reminderTime">Daily Reminder Time</Label>
                   <Input
                     id="reminderTime"
                     type="time"
                     value={notifications.reminderTime || '18:00'}
                     onChange={(e) => setNotifications({...notifications, reminderTime: e.target.value})}
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <Label htmlFor="quiet">Quiet Hours</Label>
                     <Switch
                       id="quiet"
                       checked={notifications.quietHours?.enabled || false}
                       onCheckedChange={(checked) => setNotifications({
                         ...notifications, 
                         quietHours: {
                           enabled: checked,
                           start: notifications.quietHours?.start || '22:00',
                           end: notifications.quietHours?.end || '07:00'
                         }
                       })}
                     />
                   </div>
                   {notifications.quietHours?.enabled && (
                     <div className="grid grid-cols-2 gap-2">
                       <Input
                         type="time"
                         value={notifications.quietHours.start || '22:00'}
                         onChange={(e) => setNotifications({
                           ...notifications,
                           quietHours: {
                             enabled: notifications.quietHours?.enabled || false,
                             start: e.target.value,
                             end: notifications.quietHours?.end || '07:00'
                           }
                         })}
                         placeholder="Start"
                       />
                       <Input
                         type="time"
                         value={notifications.quietHours.end || '07:00'}
                         onChange={(e) => setNotifications({
                           ...notifications,
                           quietHours: {
                             enabled: notifications.quietHours?.enabled || false,
                             start: notifications.quietHours?.start || '22:00',
                             end: e.target.value
                           }
                         })}
                         placeholder="End"
                       />
                     </div>
                   )}
                 </div>
               </div>
             </div>

             <Button onClick={handleSaveNotifications} disabled={isSaving} className="w-full">
               <Save className="w-4 h-4 mr-2" />
               Save Notification Settings
             </Button>
           </CardContent>
         </Card>
       </TabsContent>

       <TabsContent value="privacy" className="space-y-6">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center space-x-2">
               <Shield className="w-5 h-5" />
               <span>Privacy & Security</span>
             </CardTitle>
             <CardDescription>Manage your privacy settings and account security</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="space-y-4">
               <h3 className="font-medium text-gray-900">Account Security</h3>
               
               <div className="space-y-3">
                 <Button variant="outline" className="w-full justify-start">
                   <Edit3 className="w-4 h-4 mr-2" />
                   Change Password
                 </Button>
                 
                 <Button variant="outline" className="w-full justify-start">
                   <Shield className="w-4 h-4 mr-2" />
                   Enable Two-Factor Authentication
                 </Button>
                 
                 <Button variant="outline" className="w-full justify-start">
                   <Globe className="w-4 h-4 mr-2" />
                   Manage Connected Accounts
                 </Button>
               </div>
             </div>

             <Separator />

             <div className="space-y-4">
               <h3 className="font-medium text-gray-900">Privacy Controls</h3>
               
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>Public Profile</Label>
                     <p className="text-sm text-gray-600">Allow others to see your learning progress</p>
                   </div>
                   <Switch />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>Learning Analytics</Label>
                     <p className="text-sm text-gray-600">Share anonymized data to improve the platform</p>
                   </div>
                   <Switch defaultChecked />
                 </div>
                 
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>Voice Recordings</Label>
                     <p className="text-sm text-gray-600">Save voice recordings for progress tracking</p>
                   </div>
                   <Switch defaultChecked />
                 </div>
               </div>
             </div>

             <Separator />

             <div className="space-y-4">
               <h3 className="font-medium text-gray-900">Data Usage</h3>
               
               <div className="bg-blue-50 p-4 rounded-lg">
                 <p className="text-sm text-gray-700">
                   We use your learning data to personalize your experience and improve our AI models. 
                   Your data is processed securely and never shared with third parties without your consent.
                 </p>
                 <Button variant="link" className="p-0 h-auto text-blue-600">
                   Read our Privacy Policy
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
       </TabsContent>

       <TabsContent value="data" className="space-y-6">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2">
                 <Download className="w-5 h-5" />
                 <span>Export Data</span>
               </CardTitle>
               <CardDescription>Download your learning data and progress</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-3">
                 <Button variant="outline" className="w-full justify-start" onClick={() => console.log('Export learning progress')}>
                   <Download className="w-4 h-4 mr-2" />
                   Export Learning Progress
                 </Button>
                 
                 <Button variant="outline" className="w-full justify-start" onClick={() => console.log('Export profile data')}>
                   <User className="w-4 h-4 mr-2" />
                   Export Profile Data
                 </Button>
                 
                 <Button variant="outline" className="w-full justify-start" onClick={() => console.log('Export all data')}>
                   <Download className="w-4 h-4 mr-2" />
                   Export All Data
                 </Button>
               </div>
               
               <p className="text-xs text-gray-600">
                 Your data will be provided in JSON format. This may take a few minutes to process.
               </p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="flex items-center space-x-2 text-red-600">
                 <Trash2 className="w-5 h-5" />
                 <span>Danger Zone</span>
               </CardTitle>
               <CardDescription>Irreversible account actions</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-3">
                 <Button variant="outline" className="w-full justify-start text-orange-600 border-orange-200 hover:bg-orange-50">
                   <Trash2 className="w-4 h-4 mr-2" />
                   Reset Learning Progress
                 </Button>
                 
                 <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" onClick={() => console.log('Delete account')}>
                   <Trash2 className="w-4 h-4 mr-2" />
                   Delete Account
                 </Button>
               </div>
               
               <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                 <p className="text-sm text-red-700">
                   ⚠️ These actions cannot be undone. Please make sure you have exported any data you want to keep.
                 </p>
               </div>
             </CardContent>
           </Card>
         </div>
       </TabsContent>
     </Tabs>
   </div>
 );
}
