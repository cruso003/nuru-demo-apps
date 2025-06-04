"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  MapPin, 
  Music, 
  Utensils,
  Users,
  Calendar,
  BookOpen,
  Play,
  Volume2,
  Heart,
  ArrowRight,
  Camera,
  Star,
  Info
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';

interface CulturalContent {
  id: string;
  type: 'story' | 'tradition' | 'food' | 'music' | 'festival' | 'proverb' | 'place';
  title: string;
  description: string;
  content: string;
  region?: string;
  audioUrl?: string;
  imageUrl?: string;
  vocabulary?: { kpelle: string; english: string; pronunciation: string }[];
  culturalNote?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export function CulturalSpotlight() {
  const { currentUser, addNotification } = useLearningStore();
  
  // Mock methods that aren't available in enhanced store yet
  const playAudio = (audioUrl: string) => {
    console.log("Playing audio:", audioUrl);
    // TODO: Implement audio playback
  };
  
  const showNotification = (notification: { type: string; title: string; message: string }) => {
    addNotification({
      type: notification.type as any,
      title: notification.title,
      message: notification.message
    });
  };
  const [currentContent, setCurrentContent] = useState<CulturalContent | null>(null);
  const [contentHistory, setContentHistory] = useState<CulturalContent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);

  // Sample cultural content
  const culturalDatabase: CulturalContent[] = [
    {
      id: 'poro-society',
      type: 'tradition',
      title: 'The Poro Society',
      description: 'Traditional male initiation society central to Kpelle culture',
      content: 'The Poro society is one of the most important cultural institutions among the Kpelle people. It serves as a school where young men learn traditional values, customs, and their roles in society. The society has its own sacred forest where ceremonies and teachings take place.',
      region: 'Central Liberia',
      vocabulary: [
        { kpelle: 'Pɔlɔ', english: 'Poro (traditional society)', pronunciation: 'POH-loh' },
        { kpelle: 'Kɛlɛ', english: 'Forest (sacred)', pronunciation: 'KEH-leh' },
        { kpelle: 'Kpɛlɛŋ', english: 'Teaching/Learning', pronunciation: 'KPEH-leng' }
      ],
      culturalNote: 'The Poro society maintains traditional knowledge and ensures cultural continuity across generations.',
      difficulty: 'intermediate',
      tags: ['tradition', 'society', 'education', 'men']
    },
    {
      id: 'rice-cultivation',
      type: 'tradition',
      title: 'Traditional Rice Cultivation',
      description: 'The ancient art of growing rice in the Kpelle homeland',
      content: 'Rice is the staple food of the Kpelle people, and its cultivation is deeply woven into their cultural fabric. The process involves clearing forest land, burning, and then planting rice seeds. The entire community often participates in planting and harvesting seasons.',
      region: 'Throughout Kpelle territory',
      vocabulary: [
        { kpelle: 'Malɛi', english: 'Rice', pronunciation: 'MAH-lay' },
        { kpelle: 'Kpaŋ', english: 'Farm/Field', pronunciation: 'KPANG' },
        { kpelle: 'Sɛŋ', english: 'Planting', pronunciation: 'SENG' }
      ],
      culturalNote: 'Rice cultivation connects the Kpelle people to their ancestors and the land they call home.',
      difficulty: 'beginner',
      tags: ['agriculture', 'food', 'community', 'tradition']
    },
    {
      id: 'kpelle-folktale',
      type: 'story',
      title: 'The Spider and the Wisdom Pot',
      description: 'A traditional Kpelle folktale about wisdom and sharing',
      content: 'Long ago, Spider decided to gather all the wisdom in the world and keep it for himself. He put all the wisdom in a large pot and tried to climb a tall tree to hide it. But the pot was too heavy and kept hitting the tree. A small child watching said, "Why don\'t you carry the pot on your back?" Spider realized that even a child had wisdom he didn\'t possess, so he broke the pot, scattering wisdom for everyone to share.',
      vocabulary: [
        { kpelle: 'Gɛlɛi', english: 'Spider', pronunciation: 'GEH-lay' },
        { kpelle: 'Lɔŋɔ', english: 'Wisdom', pronunciation: 'LOH-ngo' },
        { kpelle: 'Tii', english: 'Tree', pronunciation: 'TEE' },
        { kpelle: 'Tɔŋ', english: 'Pot', pronunciation: 'TONG' }
      ],
      culturalNote: 'This story teaches that wisdom belongs to everyone and that even the youngest can teach the oldest.',
      difficulty: 'intermediate',
      tags: ['story', 'wisdom', 'sharing', 'children']
    },
    {
      id: 'kpelle-proverb',
      type: 'proverb',
      title: 'Unity and Strength',
      description: 'A proverb about the power of working together',
      content: '"Kpɛlɛŋ kaa yelii kɛ mɛni yɛlii ma kɛɛ" - One finger cannot pick up a grain of rice.',
      vocabulary: [
        { kpelle: 'Kpɛlɛŋ', english: 'One/Single', pronunciation: 'KPEH-leng' },
        { kpelle: 'Kaa', english: 'Finger', pronunciation: 'KAH' },
        { kpelle: 'Yelii', english: 'Pick up', pronunciation: 'YEH-lee' },
        { kpelle: 'Malɛi', english: 'Rice grain', pronunciation: 'MAH-lay' }
      ],
      culturalNote: 'This proverb emphasizes the importance of cooperation and community in Kpelle culture.',
      difficulty: 'beginner',
      tags: ['proverb', 'unity', 'cooperation', 'wisdom']
    },
    {
      id: 'traditional-music',
      type: 'music',
      title: 'Kpelle Traditional Music',
      description: 'The rhythms and instruments of Kpelle musical tradition',
      content: 'Kpelle music is characterized by complex polyrhythms played on traditional instruments like the dundun (talking drum), kagan (iron bell), and various stringed instruments. Music accompanies ceremonies, storytelling, and daily life.',
      vocabulary: [
        { kpelle: 'Yilee', english: 'Song/Music', pronunciation: 'YEE-lee' },
        { kpelle: 'Pɛlɛ', english: 'Drum', pronunciation: 'PEH-leh' },
        { kpelle: 'Kɔŋɔ', english: 'Dance', pronunciation: 'KOH-ngo' }
      ],
      culturalNote: 'Music in Kpelle culture is not just entertainment but a means of communication and spiritual expression.',
      difficulty: 'intermediate',
      tags: ['music', 'instruments', 'rhythm', 'ceremony']
    }
  ];

  useEffect(() => {
    // Select random content on component mount
    const randomContent = culturalDatabase[Math.floor(Math.random() * culturalDatabase.length)];
    setCurrentContent(randomContent);
    setContentHistory([randomContent]);
  }, []);

  const getNextContent = () => {
    const availableContent = culturalDatabase.filter(content => 
      !contentHistory.some(history => history.id === content.id)
    );
    
    if (availableContent.length === 0) {
      // Reset history if we've seen all content
      setContentHistory([]);
      return culturalDatabase[0];
    }
    
    const nextContent = availableContent[Math.floor(Math.random() * availableContent.length)];
    setContentHistory(prev => [...prev, nextContent]);
    return nextContent;
  };

  const handleNextContent = () => {
    const nextContent = getNextContent();
    setCurrentContent(nextContent);
    setShowVocabulary(false);
    showNotification({
      type: "success",
      title: "Cultural Content",
      message: `Exploring: ${nextContent.title}`
    });
  };

  const handlePlayAudio = async () => {
    if (!currentContent) return;
    
    setIsPlaying(true);
    try {
      // In a real app, this would play actual Kpelle audio
      await playAudio(`Reading: ${currentContent.title}`);
      showNotification({
        type: "info",
        title: "Audio",
        message: "Audio content coming soon!"
      });
    } finally {
      setIsPlaying(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      story: BookOpen,
      tradition: Users,
      food: Utensils,
      music: Music,
      festival: Calendar,
      proverb: Heart,
      place: MapPin
    };
    return icons[type as keyof typeof icons] || Globe;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      story: 'bg-blue-500',
      tradition: 'bg-green-500',
      food: 'bg-orange-500',
      music: 'bg-purple-500',
      festival: 'bg-pink-500',
      proverb: 'bg-yellow-500',
      place: 'bg-indigo-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      intermediate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      advanced: 'text-red-600 bg-red-100 dark:bg-red-900/30'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  if (!currentContent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const TypeIcon = getTypeIcon(currentContent.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cultural Spotlight
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover Kpelle heritage and traditions
            </p>
          </div>
        </div>

        <button
          onClick={handleNextContent}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200"
        >
          Explore More
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Card */}
      <motion.div
        key={currentContent.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${getTypeColor(currentContent.type)} text-white`}>
                <TypeIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {currentContent.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {currentContent.description}
                </p>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentContent.difficulty)}`}>
                    {currentContent.difficulty}
                  </div>
                  {currentContent.region && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {currentContent.region}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200 disabled:opacity-50"
              >
                {isPlaying ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {currentContent.content}
            </p>
          </div>

          {/* Cultural Note */}
          {currentContent.culturalNote && (
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <h5 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">
                    Cultural Note
                  </h5>
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                    {currentContent.culturalNote}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vocabulary Section */}
          {currentContent.vocabulary && currentContent.vocabulary.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowVocabulary(!showVocabulary)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                <BookOpen className="w-4 h-4" />
                Key Vocabulary ({currentContent.vocabulary.length} words)
                <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${showVocabulary ? 'rotate-90' : ''}`} />
              </button>

              {showVocabulary && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-3"
                >
                  {currentContent.vocabulary.map((word, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {word.kpelle}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {word.english}
                          </span>
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 italic">
                          /{word.pronunciation}/
                        </div>
                      </div>
                      <button 
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                        aria-label="Play pronunciation"
                        title="Play pronunciation"
                      >
                        <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {currentContent.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content Navigation */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {culturalDatabase.slice(0, 5).map((content, index) => (
              <button
                key={content.id}
                onClick={() => setCurrentContent(content)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  currentContent.id === content.id 
                    ? 'bg-emerald-500 w-6' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {contentHistory.length} of {culturalDatabase.length} explored
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            aria-label="Add to favorites"
            title="Add to favorites"
          >
            <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
            aria-label="Take screenshot"
            title="Take screenshot"
          >
            <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Learning Tip */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Cultural Learning Tip
            </h5>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Understanding culture deepens language learning. Try to connect new vocabulary with cultural concepts and traditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
