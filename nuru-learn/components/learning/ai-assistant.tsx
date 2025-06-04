"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic,
  Volume2,
  Bot,
  User,
  Minimize2,
  Maximize2,
  X,
  Languages,
  Lightbulb,
  Book} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'audio' | 'image';
  language?: 'en' | 'kpe';
  audioUrl?: string;
  imageUrl?: string;
  metadata?: {
    pronunciation?: string;
    translation?: string;
    culturalNote?: string;
    confidence?: number;
  };
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'chat' | 'tutor' | 'practice';
}

export function AIAssistant({ isOpen, onClose, mode = 'chat' }: AIAssistantProps) {
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'kpe'>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: `Kɛlɛ! Hello ${currentUser?.name?.split(' ')[0] || 'friend'}! I'm your Kpelle learning assistant. How can I help you today?`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        language: 'en',
        metadata: {
          translation: 'Hello! Welcome!',
          pronunciation: 'KEH-leh'
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Simulate AI thinking time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      const aiResponse = await generateAIResponse(inputText, currentLanguage);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text',
        language: aiResponse.language,
        metadata: aiResponse.metadata
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      showNotification({
        type: "error",
        title: "Error",
        message: "Failed to get AI response"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userInput: string, language: 'en' | 'kpe') => {
    // Enhanced AI response generation with cultural context
    const responses = {
      greetings: {
        en: [
          "Kɛlɛ! That's a great way to practice greetings. In Kpelle culture, greetings are very important and show respect.",
          "Wonderful! You're learning the foundation of Kpelle communication. Greetings connect people and communities.",
          "Kɛlɛ ma! (Hello there!) You're doing well with basic greetings. They're the key to every conversation."
        ],
        kpe: [
          "Aa, i kɛlɛ-ɔ! (Yes, you greeted well!) Keep practicing your pronunciation.",
          "I vɛlɛɛ ɓɛ? (How are you?) This is how we continue after 'Kɛlɛ'.",
          "I kɛlɛ ka-a mɛni! (Your greeting is good!) Culture and language go together."
        ]
      },
      learning: {
        en: [
          "That's a great question! In Kpelle, we often use tone to change meaning. Let me help you understand.",
          "Learning Kpelle connects you to rich traditions. Would you like to hear a story or learn about customs?",
          "Excellent progress! Remember, Kpelle is a tonal language, so pronunciation is very important."
        ],
        kpe: [
          "Aa, i kpɛlɛŋ nua-a! (Yes, you're learning well!) Keep asking questions.",
          "Kpɛlɛ kaa sɛ̃ɛ̃ nua kɛɛ. (Learning Kpelle is not hard.) Practice every day.",
          "I tii ka-a mɛni ɔ! (Your effort is good!) Persistence brings fluency."
        ]
      },
      culture: {
        en: [
          "Kpelle culture is rich with traditions! Rice farming, storytelling, and community ceremonies are central to our way of life.",
          "The Poro society for men and Sande society for women are important cultural institutions that preserve our traditions.",
          "Music and dance are vital parts of Kpelle culture. Each rhythm tells a story and connects us to our ancestors."
        ],
        kpe: [
          "Kpɛlɛŋ pɔlɔi ka kuma-i ɓɛ. (Kpelle traditions are many.) They teach us wisdom.",
          "Kɛlɛ pɛlɛ yilii ka mɛni-i. (Our drum songs are good.) They carry our history.",
          "Malɛi-kpaŋ kɛɛ kɛ kpɛlɛŋ kɔŋɔ-waŋ. (Rice farming is our main work.) It feeds families."
        ]
      }
    };

    // Simple keyword matching for demo
    const input = userInput.toLowerCase();
    let responseCategory = 'learning';
    
    if (input.includes('hello') || input.includes('kɛlɛ') || input.includes('greet')) {
      responseCategory = 'greetings';
    } else if (input.includes('culture') || input.includes('tradition') || input.includes('story')) {
      responseCategory = 'culture';
    }

    const categoryResponses = responses[responseCategory as keyof typeof responses];
    const languageResponses = categoryResponses[language];
    const randomResponse = languageResponses[Math.floor(Math.random() * languageResponses.length)];

    // Add metadata based on content
    let metadata = {};
    if (language === 'kpe') {
      metadata = {
        pronunciation: 'KEH-leh',
        translation: 'Hello! (Greeting)',
        culturalNote: 'Greetings are essential in Kpelle culture and show respect for others.'
      };
    }

    return {
      content: randomResponse,
      language,
      metadata
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const playMessageAudio = async (message: Message) => {
    try {
      await playAudio(message.content);
      showNotification({
        type: "info",
        title: "Audio",
        message: "Playing audio..."
      });
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "Audio not available"
      });
    }
  };

  const getModeConfig = () => {
    const configs = {
      chat: {
        title: 'AI Chat',
        description: 'Casual conversation practice',
        color: 'from-blue-500 to-blue-600'
      },
      tutor: {
        title: 'AI Tutor',
        description: 'Structured learning assistance',
        color: 'from-green-500 to-green-600'
      },
      practice: {
        title: 'Speaking Practice',
        description: 'Pronunciation and fluency',
        color: 'from-purple-500 to-purple-600'
      }
    };
    return configs[mode];
  };

  const modeConfig = getModeConfig();

  const quickActions = [
    { icon: Languages, text: 'Translate this', action: () => setCurrentLanguage(currentLanguage === 'en' ? 'kpe' : 'en') },
    { icon: Lightbulb, text: 'Explain grammar', action: () => setInputText('Can you explain the grammar of that sentence?') },
    { icon: Book, text: 'Tell me a story', action: () => setInputText('Can you tell me a traditional Kpelle story?') },
    { icon: Volume2, text: 'Pronunciation help', action: () => setInputText('Help me with pronunciation') }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          x: 0, 
          y: 0,
          height: isMinimized ? 60 : 500
        }}
        exit={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
        className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-96 z-50 overflow-hidden"
      >
        {/* Header */}
        <div className={`p-4 bg-gradient-to-r ${modeConfig.color} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{modeConfig.title}</h3>
              <p className="text-xs text-white/80">{modeConfig.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              aria-label='Close AI Assistant'
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Language Toggle */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Language:</span>
                <button
                  onClick={() => setCurrentLanguage(currentLanguage === 'en' ? 'kpe' : 'en')}
                  title={`Switch to ${currentLanguage === 'en' ? 'Kpɛlɛ' : 'English'}`}
                  aria-label={`Switch to ${currentLanguage === 'en' ? 'Kpɛlɛ' : 'English'}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    currentLanguage === 'en' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}
                >
                  {currentLanguage === 'en' ? 'English' : 'Kpɛlɛ'}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`
                    p-2 rounded-full text-white text-xs
                    ${message.sender === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                    }
                  `}>
                    {message.sender === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`
                    flex-1 max-w-[80%]
                    ${message.sender === 'user' ? 'text-right' : ''}
                  `}>
                    <div className={`
                      p-3 rounded-2xl text-sm
                      ${message.sender === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                      }
                    `}>
                      <p>{message.content}</p>
                      
                      {/* Metadata */}
                      {message.metadata && (
                        <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-600 space-y-1">
                          {message.metadata.translation && (
                            <p className="text-xs opacity-80">
                              Translation: {message.metadata.translation}
                            </p>
                          )}
                          {message.metadata.pronunciation && (
                            <p className="text-xs opacity-80">
                              Pronunciation: /{message.metadata.pronunciation}/
                            </p>
                          )}
                          {message.metadata.culturalNote && (
                            <p className="text-xs opacity-80">
                              Cultural note: {message.metadata.culturalNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => playMessageAudio(message)}
                          title="Play audio"
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <Volume2 className="w-3 h-3 text-gray-500" />
                        </button>
                        <span className="text-xs text-gray-500">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white">
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm p-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 overflow-x-auto">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap transition-colors"
                    >
                      <Icon className="w-3 h-3" />
                      {action.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  title={isRecording ? 'Stop recording' : 'Start voice recording'}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Type your message in ${currentLanguage === 'en' ? 'English' : 'Kpɛlɛ'}...`}
                  className="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  title="Send message"
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
