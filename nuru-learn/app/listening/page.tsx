"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Zap,
  Star,
  Brain,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useEnhancedLearningStore } from '@/lib/stores/enhanced-learning';
import { EnhancedNuruAI } from '@/lib/services/enhanced-nuru-ai';

interface ListeningExercise {
  id: string;
  title: string;
  kpelleAudio: string;
  englishTranslation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'comprehension' | 'dictation' | 'conversation';
  duration: number; // in seconds
  questions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  transcript?: string;
}

interface UserResponse {
  exerciseId: string;
  answers: number[];
  completionTime: number;
  score: number;
  attempts: number;
}

const listeningExercises: ListeningExercise[] = [
  {
    id: '1',
    title: 'Basic Greetings',
    kpelleAudio: 'Kɛlɛɛ! Ɓe kɛ a? Ŋ kɛ kpɔlɔɔ.',
    englishTranslation: 'Hello! How are you? I am fine.',
    difficulty: 'beginner',
    type: 'comprehension',
    duration: 8,
    questions: [
      {
        question: 'What greeting is being used?',
        options: ['Goodbye', 'Hello', 'Good morning', 'Good evening'],
        correctAnswer: 1
      },
      {
        question: 'How does the person respond about their wellbeing?',
        options: ['I am sick', 'I am fine', 'I am tired', 'I am busy'],
        correctAnswer: 1
      }
    ],
    transcript: 'Kɛlɛɛ! Ɓe kɛ a? Ŋ kɛ kpɔlɔɔ.'
  },
  {
    id: '2',
    title: 'Family Introduction',
    kpelleAudio: 'Ŋ kɛlɛɛ mɛni kɛ wolo. Ŋ na tii ɓa ɓɛ.',
    englishTranslation: 'My family is large. My father is working.',
    difficulty: 'intermediate',
    type: 'comprehension',
    duration: 12,
    questions: [
      {
        question: 'How is the family described?',
        options: ['Small', 'Large', 'Happy', 'Quiet'],
        correctAnswer: 1
      },
      {
        question: 'What is the father doing?',
        options: ['Sleeping', 'Eating', 'Working', 'Reading'],
        correctAnswer: 2
      }
    ],
    transcript: 'Ŋ kɛlɛɛ mɛni kɛ wolo. Ŋ na tii ɓa ɓɛ.'
  },
  {
    id: '3',
    title: 'Market Conversation',
    kpelleAudio: 'A mɛni ɓe kɛ? Ŋ wɛlɛɛ kɔi maa.',
    englishTranslation: 'What do you want? I want to buy rice.',
    difficulty: 'intermediate',
    type: 'conversation',
    duration: 15,
    questions: [
      {
        question: 'What is being asked?',
        options: ['Where are you?', 'What do you want?', 'How much is it?', 'What time is it?'],
        correctAnswer: 1
      },
      {
        question: 'What does the person want to buy?',
        options: ['Fruit', 'Rice', 'Meat', 'Vegetables'],
        correctAnswer: 1
      }
    ],
    transcript: 'A mɛni ɓe kɛ? Ŋ wɛlɛɛ kɔi maa.'
  },
  {
    id: '4',
    title: 'Traditional Story',
    kpelleAudio: 'Kɛlɛɛ tɛɛŋ, kaa to kɛ ɓa ɓoŋ la.',
    englishTranslation: 'Long ago, people lived in the forest.',
    difficulty: 'advanced',
    type: 'comprehension',
    duration: 20,
    questions: [
      {
        question: 'When did this story take place?',
        options: ['Yesterday', 'Last week', 'Long ago', 'Next year'],
        correctAnswer: 2
      },
      {
        question: 'Where did people live?',
        options: ['In cities', 'In the forest', 'By the ocean', 'In mountains'],
        correctAnswer: 1
      }
    ],
    transcript: 'Kɛlɛɛ tɛɛŋ, kaa to kɛ ɓa ɓoŋ la.'
  }
];

export default function ListeningPracticePage() {
  const router = useRouter();
  const { currentUser, addNotification } = useEnhancedLearningStore();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [volume, setVolume] = useState([0.8]);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [userResponses, setUserResponses] = useState<UserResponse[]>([]);
  const [nuruStatus, setNuruStatus] = useState<'connecting' | 'ready' | 'error'>('ready');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = listeningExercises[currentExerciseIndex];

  // Initialize Nuru AI connection
  useEffect(() => {
    const checkNuruStatus = async () => {
      try {
        const status = await EnhancedNuruAI.healthCheck();
        setNuruStatus(status.status === 'healthy' ? 'ready' : 'error');
      } catch (error) {
        console.error('Nuru AI connection failed:', error);
        setNuruStatus('error');
      }
    };

    checkNuruStatus();
  }, []);

  // Handle audio playback
  useEffect(() => {
    if (isPlaying) {
      if (nuruStatus === 'ready') {
        // Use Nuru AI TTS for authentic Kpelle pronunciation
        playWithNuruTTS();
      } else {
        // Demo mode - simulate audio playback
        playDemoAudio();
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentExercise]);

  const playWithNuruTTS = async () => {
    try {
      // Create FormData for audio synthesis
      const formData = new FormData();
      formData.append('text', currentExercise.kpelleAudio);
      formData.append('language', 'kpe');
      formData.append('speed', playbackSpeed[0].toString());
      formData.append('voice', 'default');

      const response = await EnhancedNuruAI.process(formData);

      if (response.success && response.data && response.data.audioUrl) {
        // Create audio element with generated speech
        const audio = new Audio();
        audio.src = response.data.audioUrl;
        audio.volume = volume[0];
        audio.playbackRate = playbackSpeed[0];
        
        audioRef.current = audio;
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlaybackPosition(0);
        });

        audio.addEventListener('timeupdate', () => {
          const progress = (audio.currentTime / audio.duration) * 100;
          setPlaybackPosition(progress);
        });

        await audio.play();
      } else {
        throw new Error('Failed to generate audio');
      }
      
    } catch (error) {
      console.error('Nuru TTS failed:', error);
      playDemoAudio();
    }
  };

  const playDemoAudio = () => {
    // Simulate audio playback for demo
    setPlaybackPosition(0);
    const duration = currentExercise.duration * 1000 / playbackSpeed[0];
    const interval = 100; // Update every 100ms
    const increment = (interval / duration) * 100;

    intervalRef.current = setInterval(() => {
      setPlaybackPosition(prev => {
        const newPosition = prev + increment;
        if (newPosition >= 100) {
          setIsPlaying(false);
          clearInterval(intervalRef.current!);
          return 0;
        }
        return newPosition;
      });
    }, interval);

    // Show TTS simulation notification
    addNotification({
      message: `Playing: "${currentExercise.kpelleAudio}"`,
      type: 'info'
    });
  };

  const togglePlayback = () => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (position: number) => {
    if (audioRef.current) {
      const seekTime = (position / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
    }
    setPlaybackPosition(position);
  };

  const changeSpeed = (newSpeed: number[]) => {
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed[0];
    }
  };

  const changeVolume = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0];
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const submitAnswers = () => {
    if (!currentExercise.questions) return;

    let correctCount = 0;
    currentExercise.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / currentExercise.questions.length) * 100);
    const completionTime = startTime ? Date.now() - startTime : 0;

    const response: UserResponse = {
      exerciseId: currentExercise.id,
      answers: userAnswers,
      completionTime,
      score: finalScore,
      attempts: currentAttempt
    };

    setUserResponses(prev => [...prev, response]);
    setScore(finalScore);
    setExerciseComplete(true);

    addNotification({
      message: finalScore >= 80 ? `Excellent! You scored ${finalScore}%` :
      finalScore >= 60 ? `Good job! You scored ${finalScore}%` :
      `Keep practicing! You scored ${finalScore}%`,
      type: finalScore >= 60 ? 'success' : 'warning'
    });
  };

  const nextExercise = () => {
    if (currentExerciseIndex < listeningExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      resetExercise();
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      resetExercise();
    }
  };

  const resetExercise = () => {
    setIsPlaying(false);
    setPlaybackPosition(0);
    setShowTranscript(false);
    setUserAnswers([]);
    setExerciseComplete(false);
    setScore(null);
    setStartTime(null);
    setCurrentAttempt(1);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const retryExercise = () => {
    setUserAnswers([]);
    setExerciseComplete(false);
    setScore(null);
    setStartTime(null);
    setCurrentAttempt(prev => prev + 1);
  };

  const averageScore = userResponses.length > 0 
    ? userResponses.reduce((sum, response) => sum + response.score, 0) / userResponses.length 
    : 0;

  const completedExercises = new Set(userResponses.map(r => r.exerciseId)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-pink-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
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
                <Headphones className="w-6 h-6 text-pink-600" />
                Listening Practice
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Improve your Kpelle comprehension skills
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={nuruStatus === 'ready' ? 'default' : nuruStatus === 'connecting' ? 'secondary' : 'destructive'}
              className="flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              Nuru AI {nuruStatus === 'ready' ? 'Ready' : nuruStatus === 'connecting' ? 'Connecting' : 'Demo Mode'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Exercise Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Exercise Info */}
            <Card className="border-2 border-pink-200 dark:border-pink-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{currentExercise.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        Exercise {currentExerciseIndex + 1} of {listeningExercises.length}
                      </Badge>
                      <Badge 
                        variant={currentExercise.difficulty === 'beginner' ? 'default' : 
                                 currentExercise.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                      >
                        {currentExercise.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {currentExercise.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                      {currentExercise.duration}s
                    </div>
                    <div className="text-sm text-gray-500">Duration</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Audio Player */}
                <div className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl p-6">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button
                      onClick={previousExercise}
                      disabled={currentExerciseIndex === 0}
                      variant="outline"
                      size="sm"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={togglePlayback}
                      size="lg"
                      className="w-16 h-16 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                    </Button>
                    
                    <Button
                      onClick={nextExercise}
                      disabled={currentExerciseIndex === listeningExercises.length - 1}
                      variant="outline"
                      size="sm"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress value={playbackPosition} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.round((playbackPosition / 100) * currentExercise.duration)}s</span>
                      <span>{currentExercise.duration}s</span>
                    </div>
                  </div>

                  {/* Audio Controls */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Volume
                      </Label>
                      <Slider
                        value={volume}
                        onValueChange={changeVolume}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Speed
                      </Label>
                      <Slider
                        value={playbackSpeed}
                        onValueChange={changeSpeed}
                        min={0.5}
                        max={2}
                        step={0.25}
                        className="w-full"
                      />
                      <div className="text-xs text-center text-gray-500">
                        {playbackSpeed[0]}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* Translation and Transcript */}
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      English Translation:
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200">
                      {currentExercise.englishTranslation}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Kpelle Transcript
                    </h4>
                    <Button
                      onClick={() => setShowTranscript(!showTranscript)}
                      variant="outline"
                      size="sm"
                    >
                      {showTranscript ? 'Hide' : 'Show'} Transcript
                    </Button>
                  </div>

                  <AnimatePresence>
                    {showTranscript && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800"
                      >
                        <p className="text-green-800 dark:text-green-200 font-medium text-lg">
                          {currentExercise.transcript}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Questions */}
                {currentExercise.questions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        Comprehension Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {currentExercise.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="space-y-3">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {questionIndex + 1}. {question.question}
                          </h4>
                          <RadioGroup
                            value={userAnswers[questionIndex]?.toString()}
                            onValueChange={(value: string) => handleAnswerSelect(questionIndex, parseInt(value))}
                            disabled={exerciseComplete}
                          >
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={optionIndex.toString()} 
                                  id={`q${questionIndex}-o${optionIndex}`}
                                />
                                <Label 
                                  htmlFor={`q${questionIndex}-o${optionIndex}`}
                                  className={`
                                    ${exerciseComplete && optionIndex === question.correctAnswer 
                                      ? 'text-green-600 font-semibold' 
                                      : exerciseComplete && userAnswers[questionIndex] === optionIndex && optionIndex !== question.correctAnswer
                                      ? 'text-red-600'
                                      : ''
                                    }
                                  `}
                                >
                                  {option}
                                  {exerciseComplete && optionIndex === question.correctAnswer && (
                                    <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                                  )}
                                  {exerciseComplete && userAnswers[questionIndex] === optionIndex && optionIndex !== question.correctAnswer && (
                                    <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                                  )}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}

                      {/* Submit/Results */}
                      {!exerciseComplete ? (
                        <Button
                          onClick={submitAnswers}
                          disabled={userAnswers.length !== currentExercise.questions.length || userAnswers.some(answer => answer === undefined)}
                          className="w-full"
                        >
                          Submit Answers
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Target className="w-6 h-6 text-purple-600" />
                              <span className="text-2xl font-bold text-purple-600">{score}%</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                              Attempt {currentAttempt}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <Button onClick={retryExercise} variant="outline" className="flex-1">
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Try Again
                            </Button>
                            {currentExerciseIndex < listeningExercises.length - 1 && (
                              <Button onClick={nextExercise} className="flex-1">
                                Next Exercise
                                <Star className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{completedExercises}</div>
                    <div className="text-sm text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{Math.round(averageScore)}%</div>
                    <div className="text-sm text-gray-500">Avg Score</div>
                  </div>
                </div>
                
                <Progress value={(completedExercises / listeningExercises.length) * 100} className="h-2" />
                <p className="text-xs text-gray-500 text-center">
                  {completedExercises} of {listeningExercises.length} exercises
                </p>
              </CardContent>
            </Card>

            {/* Exercise List */}
            <Card>
              <CardHeader>
                <CardTitle>All Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {listeningExercises.map((exercise, index) => {
                    const isCompleted = userResponses.some(r => r.exerciseId === exercise.id);
                    const bestScore = isCompleted 
                      ? Math.max(...userResponses.filter(r => r.exerciseId === exercise.id).map(r => r.score))
                      : 0;
                    
                    return (
                      <div
                        key={exercise.id}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-colors
                          ${index === currentExerciseIndex 
                            ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }
                        `}
                        onClick={() => {
                          setCurrentExerciseIndex(index);
                          resetExercise();
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {exercise.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {exercise.duration}s • {exercise.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCompleted && (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                  {bestScore}%
                                </span>
                              </>
                            )}
                            <Badge 
                              variant={exercise.difficulty === 'beginner' ? 'default' : 
                                       exercise.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {exercise.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card className="border-pink-200 dark:border-pink-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-pink-600" />
                  AI Audio Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Volume2 className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Native Pronunciation</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      Authentic Kpelle speech synthesis with proper tones
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Adaptive Speed</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      Adjust playback speed for your learning pace
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Comprehension Tracking</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      AI-powered assessment of listening skills
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
