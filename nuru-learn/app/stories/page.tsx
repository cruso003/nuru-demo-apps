"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  Pause,
  Volume2,
  Star,
  Clock,
  User,
  ArrowLeft,
  Heart,
  BookmarkPlus,
  Share2,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  Users,
  TreePine,
  Plus,
  Wand2,
  Loader2,
  Download,
  Headphones
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useEnhancedLearningStore } from '@/lib/stores/enhanced-learning';
import { EnhancedNuruAI } from '@/lib/services/enhanced-nuru-ai';
import { NuruAIService, StoryGenerationRequest, GeneratedStory } from '@/lib/services/nuru-ai';

interface Story {
  id: string;
  title: string;
  titleKpelle: string;
  category: 'folktale' | 'modern' | 'children' | 'traditional';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  author: string;
  description: string;
  content: string;
  audioUrl?: string;
  isLiked: boolean;
  isBookmarked: boolean;
  readCount: number;
  rating: number;
  culturalContext: string[];
  vocabulary: Array<{
    kpelle: string;
    english: string;
    definition: string;
  }>;
}

const stories: Story[] = [
  {
    id: '1',
    title: 'The Wise Spider',
    titleKpelle: 'Kɛlɛɛ-Mɛni Kpɔlɔɔ',
    category: 'folktale',
    difficulty: 'beginner',
    duration: 8,
    author: 'Traditional Kpelle Story',
    description: 'A classic tale about a clever spider who outsmarts the other forest animals.',
    content: `Kɛlɛɛ tɛɛŋ, kɛlɛɛ-mɛni kɛ to ɓa ɓoŋ kpɔlɔɔ la. A kɛ kpɔlɔɔ wolo, a mɛɛ kɛ koo wolo.

Long ago, there lived a spider in a beautiful forest. He was very wise, and he knew many things.

Loo kɛlɛɛ ŋwɛɛ, kaa wolo kɛ waa a pai. Tii-mɛni, kɔɔi-mɛni, ŋmaa-mɛni - ɓa kɛlɛɛ kɛ waa a pai.

One day, many animals came to see him. Elephants, leopards, monkeys - they all came to see him.

"Kɛlɛɛ-mɛni," ɓa kɛ ɓɛlii a to, "kɛ ti mɛni wɛlɛɛ ɓa?"

"Spider," they said to him, "what do you want us to do?"

Kɛlɛɛ-mɛni kɛ kpɔlɔɔ wolo. A kɛ ɓa tɔɔlii: "Ŋ wɛlɛɛ a kɛlɛɛ ɓɛ koo wolo to."

The spider was very wise. He told them: "I want you all to learn many things."

Ti kɛ ɓɛ kɛ kaa-mɛni kɛlɛɛ koo wolo to. Ti kɛ ɓɛ kɛ a mɛɛ koo wolo.

And so the animals learned many things. And so they became very knowledgeable.

Kɛlɛɛ-mɛni na koo kɛ kpɔlɔɔ wolo. A kɛ kaa-mɛni kɛlɛɛ tii wolo koo.

Spider's wisdom was very beautiful. He taught all the animals many wonderful things.`,
    audioUrl: '/audio/wise-spider-kpelle.mp3',
    isLiked: false,
    isBookmarked: false,
    readCount: 1247,
    rating: 4.8,
    culturalContext: ['wisdom', 'animals', 'traditional_values', 'forest_life'],
    vocabulary: [
      {
        kpelle: 'kɛlɛɛ-mɛni',
        english: 'spider',
        definition: 'A small eight-legged creature, often featured in West African folklore as a wise trickster'
      },
      {
        kpelle: 'kpɔlɔɔ',
        english: 'wise/beautiful',
        definition: 'Having good judgment and knowledge; pleasing to look at'
      },
      {
        kpelle: 'ɓoŋ',
        english: 'forest',
        definition: 'A large area covered with trees and plants'
      },
      {
        kpelle: 'tii-mɛni',
        english: 'elephant',
        definition: 'Large mammal with a trunk, respected in Kpelle culture for its wisdom and strength'
      }
    ]
  },
  {
    id: '2',
    title: 'The Market Day',
    titleKpelle: 'Kɔi-Ŋwɛɛ',
    category: 'modern',
    difficulty: 'beginner',
    duration: 6,
    author: 'Modern Kpelle Writer',
    description: 'A story about a young girl\'s first trip to the market in town.',
    content: `Kpaa-mɛni tɛɛ kɛ maa kɔi-tɛɛ pai loo kɛlɛɛ ŋwɛɛ.

A young girl was going to the market for the first time.

A ma kɛ a pai: "Kɔi-tɛɛ kɛ kpɔlɔɔ wolo. A mɛ tɔ koo wolo."

Her mother said to her: "The market is very beautiful. You will see many things."

Ti kɛ ɓɛ maa kɔi-tɛɛ pai. Kpaa-mɛni tɛɛ kɛ tɔ koo wolo kpɔlɔɔ.

And so they went to the market. The young girl saw many beautiful things.

A kɛ tɔ maa wolo, kɔɔi wolo, kpɛlɛɛ koo wolo.

She saw lots of rice, lots of vegetables, many different things.

"Ma," a kɛ ɓɛlii a ma to, "kɔi-tɛɛ kɛ mɛɛ kpɔlɔɔ wolo!"

"Mother," she said to her mother, "the market is so beautiful!"

A ma kɛ yɛlii: "Ao, a kɛ kpɔlɔɔ wolo. Kɔi-tɛɛ kɛ ɓa kɛlɛɛ mɛɛ pai kɛ."

Her mother smiled: "Yes, it is very beautiful. The market is where our people meet."`,
    audioUrl: '/audio/market-day-kpelle.mp3',
    isLiked: true,
    isBookmarked: false,
    readCount: 892,
    rating: 4.6,
    culturalContext: ['family', 'commerce', 'community', 'childhood'],
    vocabulary: [
      {
        kpelle: 'kpaa-mɛni',
        english: 'young girl',
        definition: 'A female child or young woman'
      },
      {
        kpelle: 'kɔi-tɛɛ',
        english: 'market',
        definition: 'A place where people buy and sell goods'
      },
      {
        kpelle: 'maa',
        english: 'rice',
        definition: 'A staple grain food, very important in Liberian cuisine'
      }
    ]
  },
  {
    id: '3',
    title: 'The Singing River',
    titleKpelle: 'Kɔlɔɔ Ɓolii-tɛɛ',
    category: 'traditional',
    difficulty: 'intermediate',
    duration: 12,
    author: 'Elder Storyteller',
    description: 'A mystical story about a river that could sing and the village that protected it.',
    content: `Kɛlɛɛ tɛɛŋ wolo, kɔlɔɔ kɛlɛɛ kɛ ɓolii. A kɛ ɓolii kpɔlɔɔ wolo.

Many years ago, there was a river that could sing. It sang very beautifully.

Taa kɛlɛɛ kɛ to kɔlɔɔ tɛɛ pɛɛlɛ pai. Kaa-mɛni kɛlɛɛ kɛ a ɓolii mɛɛŋɛ.

A village was located near the river. All the people loved its singing.

Kɔlɔɔ tɛɛ kɛ ɓolii loo kɛlɛɛ wɔɔkɛɛ. A ɓolii kɛ kaa-mɛni kɛlɛɛ ɓɛlɛɛ.

The river sang every morning. Its singing made all the people happy.

Kɛlɛɛ loo, kaa kolo kɛ waa taa tɛɛ pai. Ɓa mɛɛ kɛlɛɛ kɛ kolo wolo.

One day, strangers came to the village. They were very bad people.

"Kɔlɔɔ tɛɛ ni pai kɛlɛɛ wɛlɛɛ," ɓa kɛ ɓɛlii. "Ɓa ni yɛlɛɛ kolo kɛ tii ɓa."

"We want this river for ourselves," they said. "We will make the bad people leave."

Kɛɛlɛ taa-mɛni kɛ kpɛlɛɛ wolo. A kɛ ɓɛlii kaa-mɛni kɛlɛɛ to:

But the village chief was very brave. He said to all the people:

"Kɔlɔɔ tɛɛ kɛ ɓa kɛlɛɛ mɛɛ. Ɓa mɛ a kɛlɛɛ tɔɔnɛɛ."

"This river belongs to all of us. We must protect it together."

Ti kɛ ɓɛ kaa-mɛni kɛlɛɛ ɓuu kaa kolo to kɛ. Kaa kolo kɛ yɔɔ.

And so all the people stood up to the bad people. The bad people left.

Kɔlɔɔ tɛɛ kɛ ɓolii pai kɛɛlɛ. A kɛ ɓolii kpɔlɔɔ ɓa ti kɛlɛɛ koo lai.

The river continues to sing today. It sings beautifully about the unity of all things.`,
    audioUrl: '/audio/singing-river-kpelle.mp3',
    isLiked: false,
    isBookmarked: true,
    readCount: 634,
    rating: 4.9,
    culturalContext: ['nature', 'community_unity', 'protection', 'ancestral_wisdom'],
    vocabulary: [
      {
        kpelle: 'kɔlɔɔ',
        english: 'river',
        definition: 'A large stream of water flowing in a channel'
      },
      {
        kpelle: 'ɓolii',
        english: 'to sing',
        definition: 'To make musical sounds with the voice'
      },
      {
        kpelle: 'taa',
        english: 'village/town',
        definition: 'A small community of people living together'
      },
      {
        kpelle: 'kpɛlɛɛ',
        english: 'brave/strong',
        definition: 'Having courage and strength in difficult situations'
      }
    ]
  }
];

export default function StoriesPage() {
  const router = useRouter();
  const { addNotification } = useEnhancedLearningStore();
  const nuruAIService = NuruAIService.getInstance();
  
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showVocabulary, setShowVocabulary] = useState(false);
  
  // AI Story Generation state
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [aiGeneratedStories, setAiGeneratedStories] = useState<GeneratedStory[]>([]);
  const [nuruServiceHealthy, setNuruServiceHealthy] = useState(false);
  const [showStoryGenerator, setShowStoryGenerator] = useState(false);

  // Check Nuru AI service status
  useEffect(() => {
    const checkServiceHealth = async () => {
      try {
        const status = await EnhancedNuruAI.healthCheck();
        setNuruServiceHealthy(status.status === 'healthy');
      } catch (error) {
        console.error('Failed to check Nuru AI status:', error);
        setNuruServiceHealthy(false);
      }
    };

    checkServiceHealth();
  }, []);

  const categories = [
    { value: 'all', label: 'All Stories' },
    { value: 'folktale', label: 'Folktales' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'modern', label: 'Modern' },
    { value: 'children', label: 'Children' }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.titleKpelle.includes(searchQuery) ||
                         story.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || story.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const toggleLike = (storyId: string) => {
    // In a real app, this would update the backend
    addNotification({
      message: 'Story liked!',
      type: 'success'
    });
  };

  const toggleBookmark = (storyId: string) => {
    // In a real app, this would update the backend
    addNotification({
      message: 'Story bookmarked!',
      type: 'success'
    });
  };

  const shareStory = (story: Story) => {
    // In a real app, this would open share dialog
    addNotification({
      message: `Sharing "${story.title}"`,
      type: 'info'
    });
  };

  const playAudio = (story: Story) => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      addNotification({
        message: `Playing audio for "${story.title}"`,
        type: 'info'
      });
      // In a real app, this would start audio playbook
    }
  };

  // AI Story Generation Functions
  const generateAIStory = async (request: StoryGenerationRequest) => {
    if (!nuruServiceHealthy) {
      addNotification({
        message: 'Nuru AI service is not available',
        type: 'error'
      });
      return;
    }

    setIsGeneratingStory(true);
    try {
      const generatedStory = await nuruAIService.generateKpelleStory(request);
      setAiGeneratedStories(prev => [generatedStory, ...prev]);
      addNotification({
        message: 'Story generated successfully!',
        type: 'success'
      });
      setShowStoryGenerator(false);
    } catch (error) {
      console.error('Story generation failed:', error);
      addNotification({
        message: 'Failed to generate story. Please try again.',
        type: 'error'
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const generateStoryAudio = async (story: GeneratedStory) => {
    if (!nuruServiceHealthy) {
      addNotification({
        message: 'Nuru AI service is not available',
        type: 'error'
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const audioUrl = await nuruAIService.generateStoryAudio(story, 'kpe');
      
      // Update the story with audio URL
      setAiGeneratedStories(prev => 
        prev.map(s => s.id === story.id ? { ...s, audioUrl } : s)
      );
      
      addNotification({
        message: 'Audio generated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Audio generation failed:', error);
      addNotification({
        message: 'Failed to generate audio. Please try again.',
        type: 'error'
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const StoryGeneratorModal = () => {
    const [theme, setTheme] = useState('traditional');
    const [characters, setCharacters] = useState('');
    const [setting, setSetting] = useState('');
    const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      generateAIStory({
        theme,
        characters: characters.split(',').map(c => c.trim()).filter(Boolean),
        setting,
        length,
        difficulty,
        culturalElements: ['kpelle_traditions', 'moral_lesson'],
        language: 'kpe'
      });
    };

    if (!showStoryGenerator) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Generate AI Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                  title="Select story theme"
                  aria-label="Story theme"
                  required
                >
                  <option value="traditional">Traditional Folktale</option>
                  <option value="modern">Modern Adventure</option>
                  <option value="moral">Moral Lesson</option>
                  <option value="nature">Nature & Animals</option>
                  <option value="family">Family Values</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Characters (comma-separated)</label>
                <Input
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  placeholder="spider, elephant, wise elder"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Setting</label>
                <Input
                  value={setting}
                  onChange={(e) => setSetting(e.target.value)}
                  placeholder="forest, village, river"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as 'short' | 'medium' | 'long')}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    title="Select story length"
                    aria-label="Story length"
                  >
                    <option value="short">Short (5 min)</option>
                    <option value="medium">Medium (10 min)</option>
                    <option value="long">Long (15 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    title="Select difficulty level"
                    aria-label="Story difficulty"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStoryGenerator(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isGeneratingStory}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isGeneratingStory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Story Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedStory(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Stories
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Developer Feature
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Story Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{selectedStory.title}</CardTitle>
                      <p className="text-xl text-orange-600 dark:text-orange-400 font-medium mb-2">
                        {selectedStory.titleKpelle}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {selectedStory.description}
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">{selectedStory.category}</Badge>
                        <Badge 
                          variant={selectedStory.difficulty === 'beginner' ? 'default' : 
                                   selectedStory.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                        >
                          {selectedStory.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {selectedStory.duration} min read
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          {selectedStory.readCount} reads
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => playAudio(selectedStory)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Listen'}
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button
                          onClick={() => toggleLike(selectedStory.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <Heart className={`w-4 h-4 ${selectedStory.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button
                          onClick={() => toggleBookmark(selectedStory.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <BookmarkPlus className={`w-4 h-4 ${selectedStory.isBookmarked ? 'fill-blue-500 text-blue-500' : ''}`} />
                        </Button>
                        <Button
                          onClick={() => shareStory(selectedStory)}
                          variant="ghost"
                          size="sm"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
                      {selectedStory.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Story Sidebar */}
            <div className="space-y-6">
              {/* Vocabulary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Vocabulary
                    </span>
                    <Button
                      onClick={() => setShowVocabulary(!showVocabulary)}
                      variant="ghost"
                      size="sm"
                    >
                      {showVocabulary ? 'Hide' : 'Show'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                
                <AnimatePresence>
                  {showVocabulary && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <CardContent className="space-y-4">
                        {selectedStory.vocabulary.map((word, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-orange-600 dark:text-orange-400">
                                  {word.kpelle}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {word.english}
                                </div>
                              </div>
                              <Button size="sm" variant="ghost">
                                <Volume2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {word.definition}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Cultural Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="w-5 h-5" />
                    Cultural Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedStory.culturalContext.map((context, index) => (
                      <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                        {context.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Story Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Story Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedStory.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reads:</span>
                    <span className="font-medium">{selectedStory.readCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Author:</span>
                    <span className="font-medium text-sm">{selectedStory.author}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-600" />
                Kpelle Stories
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Discover traditional and modern Kpelle narratives
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {nuruServiceHealthy && (
              <Button
                onClick={() => setShowStoryGenerator(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                disabled={isGeneratingStory}
              >
                {isGeneratingStory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate AI Story
              </Button>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Developer Feature
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search stories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                  title="Select story category"
                  aria-label="Filter by story category"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-sm"
                  title="Select difficulty level"
                  aria-label="Filter by difficulty level"
                >
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>{diff.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stories Content */}
        <Tabs defaultValue="traditional" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="traditional" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Traditional Stories ({filteredStories.length})
            </TabsTrigger>
            <TabsTrigger value="ai-generated" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              AI Generated ({aiGeneratedStories.length})
              {nuruServiceHealthy && (
                <Badge variant="secondary" className="ml-1 text-xs">NEW</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traditional" className="mt-6">
            {/* Traditional Stories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStories.map((story) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight mb-2">
                            {story.title}
                          </CardTitle>
                          <p className="text-orange-600 dark:text-orange-400 font-medium text-sm mb-2">
                            {story.titleKpelle}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                            {story.description}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {story.category}
                          </Badge>
                          <Badge 
                            variant={story.difficulty === 'beginner' ? 'default' : 
                                     story.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {story.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {story.rating}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {story.duration} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {story.readCount}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {story.isLiked && <Heart className="w-4 h-4 fill-red-500 text-red-500" />}
                          {story.isBookmarked && <BookmarkPlus className="w-4 h-4 fill-blue-500 text-blue-500" />}
                          <Volume2 className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No stories found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-generated" className="mt-6">
            {/* AI Generated Stories */}
            {!nuruServiceHealthy && (
              <Card className="mb-6 border-amber-200 dark:border-amber-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                    <Loader2 className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Nuru AI Service Unavailable</p>
                      <p className="text-sm opacity-80">AI story generation requires the Nuru AI service to be running.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiGeneratedStories.map((story) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg leading-tight">
                              {story.title}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700">
                              AI Generated
                            </Badge>
                          </div>
                          <p className="text-orange-600 dark:text-orange-400 font-medium text-sm mb-2">
                            {story.titleKpelle}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                            {story.moralLesson || `A story featuring ${story.characters.join(', ')} in ${story.setting}`}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            AI Story
                          </Badge>
                          <Badge 
                            variant={story.difficulty === 'beginner' ? 'default' : 
                                     story.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {story.difficulty}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {story.duration} min
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {story.audioUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Play audio functionality
                                addNotification({
                                  message: 'Playing AI-generated audio',
                                  type: 'info'
                                });
                              }}
                            >
                              <Volume2 className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateStoryAudio(story);
                              }}
                              disabled={isGeneratingAudio}
                            >
                              {isGeneratingAudio ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Headphones className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {aiGeneratedStories.length === 0 && nuruServiceHealthy && (
              <div className="text-center py-12">
                <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No AI stories yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Generate your first Kpelle story with AI assistance
                </p>
                <Button
                  onClick={() => setShowStoryGenerator(true)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Story
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Developer Feature Notice */}
        <Card className="mt-8 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Developer Feature: Enhanced Story Collection with AI
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">
                  This enhanced story collection demonstrates the integration of traditional Kpelle narratives 
                  with AI-generated content. Features include cultural context preservation, vocabulary assistance, 
                  audio playback capabilities, and dynamic story generation using the Nuru AI service.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Traditional Stories:</h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Curated Kpelle folktales and narratives</li>
                      <li>• Cultural context and vocabulary support</li>
                      <li>• Audio narration in Kpelle language</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">AI-Generated Stories:</h4>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Dynamic story creation with cultural awareness</li>
                      <li>• Customizable themes, characters, and difficulty</li>
                      <li>• AI-powered text-to-speech in Kpelle</li>
                    </ul>
                  </div>
                </div>
                {nuruServiceHealthy && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Nuru AI service is connected and ready for story generation
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Generator Modal */}
        <StoryGeneratorModal />
      </div>
    </div>
  );
}
