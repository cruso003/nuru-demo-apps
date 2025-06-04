"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff,
  Volume2,
  ArrowLeft,
  Zap,
  Bot,
  User,
  Sparkles,
  Globe,
  Brain,
  Languages
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEnhancedLearningStore } from '@/lib/stores/enhanced-learning';
import { EnhancedNuruAI } from '@/lib/services/enhanced-nuru-ai';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  language: 'kpelle' | 'english' | 'mixed';
  audioUrl?: string;
  isVoiceMessage?: boolean;
}

interface ConversationContext {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  culturalContext: string[];
}

const conversationStarters = [
  {
    topic: 'Greetings',
    kpelle: 'Kɛlɛɛ! Ɓe kɛ a?',
    english: 'Hello! How are you?',
    difficulty: 'beginner' as const
  },
  {
    topic: 'Family',
    kpelle: 'A kɛlɛɛ mɛni kɛ kɛ?',
    english: 'What is your family like?',
    difficulty: 'intermediate' as const
  },
  {
    topic: 'Culture',
    kpelle: 'Kpɔlɔ wuɓo kɛ ɓe la?',
    english: 'What traditions do you follow?',
    difficulty: 'advanced' as const
  },
  {
    topic: 'Daily Life',
    kpelle: 'A ɓe kɛ ɓe la sɛɛi?',
    english: 'What do you do during the day?',
    difficulty: 'beginner' as const
  }
];

export default function AIChatPage() {
  const router = useRouter();
  const { currentUser, addNotification } = useEnhancedLearningStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [nuruStatus, setNuruStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
  const [currentContext, setCurrentContext] = useState<ConversationContext>({
    topic: 'General',
    difficulty: 'beginner',
    culturalContext: ['greetings', 'daily_life']
  });
  const [isTyping, setIsTyping] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize Nuru AI connection
  useEffect(() => {
    const checkNuruStatus = async () => {
      try {
        const health = await EnhancedNuruAI.healthCheck();
        setNuruStatus(health.status === 'healthy' ? 'ready' : 'error');
        
        if (health.status === 'healthy') {
          // Send welcome message
          const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'ai',
            content: 'Kɛlɛɛ! Ŋ na mɛɛ Nuru AI. Ŋ kɛ tii a kɛlɛɛ Kpɛlɛɛ kaa la. (Hello! I am Nuru AI. I can help you learn Kpelle.)',
            timestamp: new Date(),
            language: 'mixed'
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('Nuru AI connection failed:', error);
        setNuruStatus('error');
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: 'Hello! I\'m currently in demo mode. I can still help you practice Kpelle conversations!',
          timestamp: new Date(),
          language: 'english'
        };
        setMessages([errorMessage]);
      }
    };

    checkNuruStatus();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string, isVoiceMessage = false) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date(),
      language: detectLanguage(text),
      isVoiceMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      await generateAIResponse(text, userMessage.language);
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      addNotification({
        type: 'error',
        title: 'Failed to get AI response',
        message: 'Please try again later'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userInput: string, detectedLanguage: string) => {
    if (nuruStatus !== 'ready') {
      // Demo response
      setTimeout(() => {
        const demoResponses = [
          'That\'s interesting! Can you tell me more in Kpelle?',
          'Kpɔlɔɔ! (Good!) Keep practicing your Kpelle.',
          'I understand! Let\'s continue our conversation.',
          'Excellent! Your Kpelle is improving!'
        ];
        
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: randomResponse,
          timestamp: new Date(),
          language: 'mixed'
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }, 1500);
      return;
    }

    try {
      // Use Nuru AI to generate contextual response
      const aiResponse = await EnhancedNuruAI.chat({
        message: userInput,
        history: messages.slice(-5).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        language: 'kpe',
        context: `Language learning chat. Topic: ${currentContext.topic}, Difficulty: ${currentContext.difficulty}, Cultural context: ${currentContext.culturalContext.join(', ')}`
      });

      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: aiResponse.text || aiResponse.response,
        timestamp: new Date(),
        language: aiResponse.detected_language === 'kpe' ? 'kpelle' : 'mixed'
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update conversation context based on detected language and content
      if (aiResponse.detected_language) {
        setCurrentContext(prev => ({
          ...prev,
          topic: prev.topic // Keep existing topic for now
        }));
      }

    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I\'m having trouble right now. Can you try asking again?',
        timestamp: new Date(),
        language: 'english'
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const detectLanguage = (text: string): 'kpelle' | 'english' | 'mixed' => {
    // Simple heuristic for language detection
    const kpelleChars = /[ɛɔŋɓ]/;
    const hasKpelleChars = kpelleChars.test(text);
    const hasEnglishWords = /\b(the|and|is|are|you|I|me|my|your)\b/i.test(text);
    
    if (hasKpelleChars && hasEnglishWords) return 'mixed';
    if (hasKpelleChars) return 'kpelle';
    return 'english';
  };

  const startVoiceRecording = async () => {
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
        await processVoiceMessage(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      addNotification({
        type: 'info',
        title: 'Voice recording started',
        message: 'Speak clearly for best results'
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      addNotification({
        type: 'error',
        title: 'Failed to access microphone',
        message: 'Please check your microphone permissions'
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceMessage = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      if (nuruStatus === 'ready') {
        // Use EnhancedNuruAI.process for multimodal audio processing
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        
        try {
          const transcription = await EnhancedNuruAI.process(formData);
          await handleSendMessage(transcription.text || transcription.result, true);
        } catch (error) {
          console.error('Voice transcription failed:', error);
          addNotification({
            type: 'error',
            title: 'Voice transcription failed',
            message: 'Please try again'
          });
        }
      } else {
        // Demo mode - simulate transcription
        setTimeout(async () => {
          const demoTranscriptions = [
            'Kɛlɛɛ!',
            'Ŋ kɛ kpɔlɔɔ',
            'A ɓe kɛ kɛ?',
            'Tanɛɛ kpɔlɔɔ'
          ];
          
          const randomText = demoTranscriptions[Math.floor(Math.random() * demoTranscriptions.length)];
          await handleSendMessage(`[Voice] ${randomText}`, true);
        }, 1500);
      }
    } catch (error) {
      console.error('Voice processing failed:', error);
      addNotification({
        type: 'error',
        title: 'Voice processing failed',
        message: 'Please try again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startConversation = (starter: typeof conversationStarters[0]) => {
    setCurrentContext({
      topic: starter.topic,
      difficulty: starter.difficulty,
      culturalContext: [starter.topic.toLowerCase()]
    });

    handleSendMessage(starter.kpelle);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
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
                <MessageCircle className="w-6 h-6 text-green-600" />
                AI Conversation
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Practice Kpelle with your AI tutor
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-lg">Nuru AI Tutor</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {currentContext.topic} • {currentContext.difficulty}
                    </Badge>
                  </div>
                  {isTyping && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                      AI is typing...
                    </div>
                  )}
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`
                        max-w-xs lg:max-w-md px-4 py-3 rounded-2xl
                        ${message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }
                      `}>
                        <div className="flex items-start gap-2">
                          {message.type === 'ai' && (
                            <Bot className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          )}
                          {message.type === 'user' && (
                            <User className="w-4 h-4 text-blue-200 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{message.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {message.language && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs h-4 px-2"
                                >
                                  {message.language === 'kpelle' ? 'Kpɛlɛɛ' : 
                                   message.language === 'english' ? 'English' : 'Mixed'}
                                </Badge>
                              )}
                              {message.isVoiceMessage && (
                                <Volume2 className="w-3 h-3 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message in Kpelle or English..."
                      className="pr-12"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(inputText);
                        }
                      }}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <Button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    disabled={isProcessing}
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleSendMessage(inputText)}
                    disabled={!inputText.trim() || isProcessing}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Conversation Starters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Conversation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {conversationStarters.map((starter, index) => (
                  <Button
                    key={index}
                    onClick={() => startConversation(starter)}
                    variant="outline"
                    className="w-full text-left h-auto p-3 flex flex-col items-start gap-1"
                  >
                    <div className="font-medium text-sm">{starter.topic}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {starter.kpelle}
                    </div>
                    <Badge 
                      variant={starter.difficulty === 'beginner' ? 'default' : 
                               starter.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                      className="text-xs mt-1"
                    >
                      {starter.difficulty}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Features */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-green-600" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Languages className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Bilingual Conversations</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      Seamlessly switch between Kpelle and English
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Cultural Context</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      AI understands Liberian customs and traditions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Volume2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Voice Messages</strong>
                    <p className="text-gray-600 dark:text-gray-400">
                      Speak naturally and get transcribed responses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Topic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Topic:</span>
                  <Badge variant="outline">{currentContext.topic}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Level:</span>
                  <Badge 
                    variant={currentContext.difficulty === 'beginner' ? 'default' : 
                             currentContext.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
                  >
                    {currentContext.difficulty}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Context: {currentContext.culturalContext.join(', ')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
