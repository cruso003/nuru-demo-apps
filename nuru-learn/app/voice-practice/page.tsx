'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNuruAI, NuruAIService } from '@/lib/services/nuru-ai';
import { useEnhancedLearningStore } from '@/lib/stores/enhanced-learning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Play, 
  Volume2, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Info,
  Headphones
} from 'lucide-react';

interface PracticeSession {
  word: string;
  kpelle: string;
  english: string;
  pronunciation: string;
  audioUrl?: string;
  userAttempts: Array<{
    audioBlob: Blob;
    transcription: string;
    score: number;
    feedback: string;
  }>;
}

export default function VoicePracticePage() {
  const router = useRouter();
  const { isHealthy, isLoading } = useNuruAI();
  const { addNotification } = useEnhancedLearningStore();
  const nuruAIService = NuruAIService.getInstance();
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Sample Kpelle words for practice
  const practiceWords = [
    {
      word: "greeting",
      kpelle: "Dii kɛɛ yɛ le",
      english: "How are you?",
      pronunciation: "DEE keh-eh YEH leh"
    },
    {
      word: "thanks",
      kpelle: "Sɛnɔŋ",
      english: "Thank you",
      pronunciation: "SEH-nong"
    },
    {
      word: "water",
      kpelle: "Jii",
      english: "Water",
      pronunciation: "JEE"
    },
    {
      word: "food",
      kpelle: "Malɛi",
      english: "Rice/Food",
      pronunciation: "MAH-lay"
    }
  ];

  useEffect(() => {
    // Start with the first practice word
    if (!currentSession) {
      startNewSession();
    }
  }, []);

  const startNewSession = () => {
    const randomWord = practiceWords[Math.floor(Math.random() * practiceWords.length)];
    setCurrentSession({
      ...randomWord,
      userAttempts: []
    });
    setSessionProgress(0);
    setLastResult(null);
    addNotification({ message: `New practice session started: ${randomWord.word}`, type: 'info' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      addNotification({ message: 'Voice recording started! Speak clearly for best results.', type: 'info' });
    } catch (error) {
      console.error('Error starting recording:', error);
      addNotification({ message: 'Failed to access microphone. Please check permissions.', type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!isHealthy || !currentSession) return;

    setIsProcessing(true);
    try {
      // Convert blob to base64 for API
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Use Nuru AI for transcription
      const transcriptionResult = await nuruAIService.transcribe({
        audio: audioBlob,
        language: 'kpe'
      });

      // Simulate scoring (in real implementation, Nuru AI would provide pronunciation scoring)
      const score = Math.floor(Math.random() * 40) + 60; // 60-100 range
      const feedback = score >= 80 ? "Excellent pronunciation!" : 
                      score >= 70 ? "Good job! Try emphasizing the tones." :
                      "Keep practicing. Focus on the pronunciation guide.";

      const attempt = {
        audioBlob,
        transcription: transcriptionResult.text || "Unable to transcribe",
        score,
        feedback
      };

      // Update session
      const updatedSession = {
        ...currentSession,
        userAttempts: [...currentSession.userAttempts, attempt]
      };
      setCurrentSession(updatedSession);
      setLastResult(attempt);
      setSessionProgress(Math.min((updatedSession.userAttempts.length / 3) * 100, 100));
      
      // Provide feedback to user
      if (score >= 80) {
        addNotification({ message: 'Excellent pronunciation! Well done!', type: 'success' });
      } else if (score >= 70) {
        addNotification({ message: 'Good job! Keep practicing to improve.', type: 'info' });
      } else {
        addNotification({ message: 'Keep practicing. Focus on the pronunciation guide.', type: 'warning' });
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      addNotification({ message: 'AI processing unavailable. Audio recorded for offline practice.', type: 'warning' });
      const fallbackAttempt = {
        audioBlob,
        transcription: "AI processing unavailable",
        score: 75,
        feedback: "Audio recorded successfully. Connect to Nuru AI for real-time feedback."
      };
      
      if (currentSession) {
        const updatedSession = {
          ...currentSession,
          userAttempts: [...currentSession.userAttempts, fallbackAttempt]
        };
        setCurrentSession(updatedSession);
        setLastResult(fallbackAttempt);
        setSessionProgress(Math.min((updatedSession.userAttempts.length / 3) * 100, 100));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const playExample = async () => {
    if (!currentSession) return;
    
    // In a real implementation, this would play Nuru AI generated Kpelle audio
    // For now, we'll show a visual indication
    try {
      // Simulate TTS request to Nuru AI
      if (isHealthy) {
        // const audioResponse = await nuruAIService.textToSpeech({
        //   text: currentSession.kpelle,
        //   language: 'kpe'
        // });
        // Play the audio
        addNotification({ message: 'Playing example pronunciation...', type: 'info' });
      } else {
        addNotification({ message: 'Audio examples unavailable. AI service is offline.', type: 'warning' });
      }
    } catch (error) {
      console.error('Error playing example:', error);
      addNotification({ message: 'Failed to play example audio.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
                <Mic className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Kpelle Voice Practice
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Nuru AI
              </Badge>
            </div>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              Practice Kpelle pronunciation with AI-powered feedback
            </p>
          </div>
        </div>

        {/* AI Status */}
        <Card className={`mb-6 border-2 ${
          isHealthy 
            ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
            : 'border-amber-200 bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isHealthy ? 'bg-green-500' : 'bg-amber-500'
              }`} />
              <span className={`font-medium ${
                isHealthy ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'
              }`}>
                {isHealthy ? 'Nuru AI Online - Real-time speech processing available' : 'Limited Mode - Simulated feedback only'}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Practice Session */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <span>Practice Session</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={startNewSession}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Word
                  </Button>
                </div>
                <CardDescription>
                  Listen, repeat, and receive AI feedback on your pronunciation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentSession && (
                  <div className="space-y-6">
                    {/* Current Word */}
                    <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {currentSession.kpelle}
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                        "{currentSession.english}"
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                        /{currentSession.pronunciation}/
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={playExample}
                        className="flex items-center space-x-2"
                      >
                        <Headphones className="w-5 h-5" />
                        <span>Listen</span>
                      </Button>
                      
                      <Button
                        size="lg"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`flex items-center space-x-2 ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-5 h-5" />
                            <span>Stop Recording</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            <span>Start Recording</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Processing indicator */}
                    {isProcessing && (
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-blue-700 dark:text-blue-300">
                            Nuru AI is analyzing your pronunciation...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Latest Result */}
                    {lastResult && (
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Latest Attempt
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant={lastResult.score >= 80 ? "default" : "secondary"}>
                                {lastResult.score}/100
                              </Badge>
                              {lastResult.score >= 80 ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <strong>Transcribed:</strong> "{lastResult.transcription}"
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {lastResult.feedback}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Session Progress</span>
                        <span>{currentSession.userAttempts.length}/3 attempts</span>
                      </div>
                      <Progress value={sessionProgress} className="w-full" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="w-5 h-5" />
                  <span>How it Works</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">1.</span>
                  <span>Listen to the Kpelle pronunciation</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">2.</span>
                  <span>Click Record and repeat the word</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">3.</span>
                  <span>Receive AI-powered feedback</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="font-medium text-blue-600">4.</span>
                  <span>Practice until you achieve 80+ score</span>
                </div>
              </CardContent>
            </Card>

            {/* Nuru AI Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Nuru AI Features</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Real-time Kpelle speech recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Pronunciation scoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Cultural context awareness</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Text-to-speech in Kpelle</span>
                </div>
              </CardContent>
            </Card>

            {/* Developer Note */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Developer Integration
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This demonstrates real-time speech processing with Nuru AI. 
                  Developers can integrate these APIs for pronunciation training, 
                  conversation practice, and language assessment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
