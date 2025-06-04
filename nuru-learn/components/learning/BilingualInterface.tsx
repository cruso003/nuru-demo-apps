'use client';

import { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/lib/stores/learning';
import { Language, Subject } from '@/lib/types/learning';
import { nuruClient, createAudioFromBase64 } from '@/lib/nuru-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare,
  ArrowLeftRight,
  Book,
  Globe,
  Camera,
  Sparkles,
  Brain,
  Play,
  Pause,
  RotateCcw,
  Check,
  Star,
  AudioWaveform
} from 'lucide-react';

export function BilingualInterface() {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [culturalNote, setCulturalNote] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { 
    currentLanguage, 
    targetLanguage, 
    switchLanguages,
    currentSubject,
    isProcessing,
    setProcessing,
    addInteraction
  } = useLearningStore();

  // Enhanced sample phrases with cultural context
  const samplePhrases: Record<Subject, Record<Language, Array<{ text: string; context?: string }>>> = {
    'mathematics': {
      'english': [
        { text: 'What is 5 + 3?', context: 'Basic arithmetic in educational context' },
        { text: 'How do you solve this equation?', context: 'Mathematical problem-solving' },
        { text: 'The answer is 8', context: 'Providing mathematical solutions' }
      ],
      'kpelle': [
        { text: 'Lɔɔlu gɛɛ sawa kɛ nuŋɛ?', context: 'Kpelle traditional counting (5 + 3)' },
        { text: 'Ii yii gbɛɛ kpɛlɛ?', context: 'How to solve this problem in Kpelle' },
        { text: 'Kɛlɛŋ kɛ nani-sawa', context: 'The answer is eight (literally four-three)' }
      ]
    },
    'language-arts': {
      'english': [
        { text: 'Hello, how are you?', context: 'Standard English greeting' },
        { text: 'Thank you very much', context: 'Expression of gratitude' },
        { text: 'Please help me learn', context: 'Request for educational assistance' }
      ],
      'kpelle': [
        { text: 'Kaa, i kaa kɛ?', context: 'Traditional Kpelle greeting - very important in culture' },
        { text: 'I tɛlee bele', context: 'Deep gratitude - shows respect in Kpelle society' },
        { text: 'Kɛlɛɛ nga kɔɔ ma', context: 'Requesting help with learning - shows humility' }
      ]
    },
    'science': {
      'english': [
        { text: 'The sun gives us light', context: 'Basic astronomy and natural science' },
        { text: 'Water is essential for life', context: 'Biology and environmental science' },
        { text: 'Plants need sunlight to grow', context: 'Photosynthesis and plant biology' }
      ],
      'kpelle': [
        { text: 'Foloi folo poo mu', context: 'Sun provides light - connects to Kpelle solar calendar' },
        { text: 'Jii mɛni velei lo-ma', context: 'Water is life essence - sacred in Kpelle tradition' },
        { text: 'Yala-kpɛlɛi folo gɛɛ kuu', context: 'Plants need light - traditional Kpelle farming knowledge' }
      ]
    },
    'social-studies': {
      'english': [
        { text: 'My family is important to me', context: 'Family values and social structures' },
        { text: 'We live in a community', context: 'Social organization and cooperation' },
        { text: 'Culture shapes who we are', context: 'Cultural identity and heritage' }
      ],
      'kpelle': [
        { text: 'Nga yɛɛ-mɛni bele mu', context: 'Family central to Kpelle identity - extended family system' },
        { text: 'Mu kaa kɛlɛŋ-ma', context: 'Community living - traditional Kpelle village structure' },
        { text: 'Kpɛlɛɛ tii mu kpɛlɛ', context: 'Kpelle culture makes us who we are - cultural pride' }
      ]
    },
    'life-skills': {
      'english': [
        { text: 'I want to learn new skills', context: 'Personal development and growth' },
        { text: 'Practice makes perfect', context: 'Learning methodology and persistence' },
        { text: 'Knowledge is power', context: 'Value of education and learning' }
      ],
      'kpelle': [
        { text: 'Nga kɔɔ kpou gɛɛ kuu', context: 'Desire for new knowledge - lifelong learning in Kpelle culture' },
        { text: 'Kpɛlɛɛ mɛɛni kpɛlɛ kpɛlɛ', context: 'Practice makes perfect - traditional apprenticeship system' },
        { text: 'Kɔlɔŋ kɛ velei', context: 'Knowledge is life - oral tradition and wisdom keepers' }
      ]
    }
  };

  // Initialize Web Audio API for voice visualization
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
      }
    }
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setProcessing(true);
    setProcessingStage('Detecting language...');
    
    try {
      // Step 1: Detect language if needed
      const detectionResult = await nuruClient.detectLanguage(inputText);
      const sourceLang = detectionResult.detectedLanguage === 'kpe' ? 'kpe' : 'en';
      const targetLang = sourceLang === 'en' ? 'kpe' : 'en';
      
      setProcessingStage('Translating with cultural context...');
      
      // Step 2: Translate with cultural context
      const translationResult = await nuruClient.translateText(inputText, sourceLang, targetLang);
      
      setTranslatedText(translationResult.translation);
      setConfidence(translationResult.confidence);
      setCulturalNote(translationResult.culturalContext || '');
      
      setProcessingStage('Generating speech...');
      
      // Step 3: Generate TTS for the translation
      const ttsResult = await nuruClient.textToSpeech(translationResult.translation, targetLang);
      const audio = createAudioFromBase64(ttsResult.audio, ttsResult.sampleRate);
      audioElementRef.current = audio;
      
      setProcessingStage('Getting AI insights...');
      
      // Step 4: Get AI-powered educational insights
      const aiInsight = await getEducationalInsight(inputText, translationResult.translation, sourceLang, targetLang);
      setAiResponse(aiInsight);
      
      // Record the interaction
      addInteraction({
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'translation',
        input: inputText,
        output: translationResult.translation,
        sourceLang: sourceLang as Language,
        targetLang: targetLang as Language,
        confidence: translationResult.confidence,
        subject: currentSubject
      });
      
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Translation failed. Please check your connection to Nuru AI.');
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const getEducationalInsight = async (original: string, translation: string, sourceLang: string, targetLang: string): Promise<string> => {
    try {
      const prompt = `As an educational AI assistant, provide a brief insight about this ${currentSubject} translation from ${sourceLang} to ${targetLang}:\n\nOriginal: "${original}"\nTranslation: "${translation}"\n\nProvide educational value, cultural context, or learning tips in 2-3 sentences.`;
      
      let insight = '';
      for await (const chunk of nuruClient.streamingChat(prompt, 'en')) {
        if (chunk.type === 'text') {
          insight += chunk.content;
        }
      }
      return insight || 'This translation demonstrates the rich linguistic diversity between English and Kpelle languages.';
    } catch (error) {
      return 'This translation helps bridge English and Kpelle languages for better learning.';
    }
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
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsListening(true);
      
      // Visualize recording
      visualizeAudio(stream);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsListening(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setProcessing(true);
    setProcessingStage('Transcribing speech...');
    
    try {
      const sttResult = await nuruClient.speechToText(audioBlob, currentLanguage);
      setInputText(sttResult.text);
      
      // Auto-translate after successful transcription
      if (sttResult.text.trim()) {
        setTimeout(() => handleTranslate(), 500);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const visualizeAudio = (stream: MediaStream) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      if (!isRecording) return;

      analyser.getByteFrequencyData(dataArray);
      
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#10b981';
        const barWidth = canvas.width / dataArray.length;
        
        for (let i = 0; i < dataArray.length; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
        }
      }
      
      requestAnimationFrame(draw);
    };
    
    draw();
  };

  const playTranslatedAudio = () => {
    if (audioElementRef.current) {
      setIsPlaying(true);
      audioElementRef.current.play();
      audioElementRef.current.onended = () => setIsPlaying(false);
    }
  };

  const selectSamplePhrase = (phrase: { text: string; context?: string }) => {
    setInputText(phrase.text);
    if (phrase.context) {
      setCulturalNote(phrase.context);
    }
  };

  const currentPhrases = samplePhrases[currentSubject]?.[currentLanguage] || [];
      'kpelle': ['Nua yila mɛɛni', 'Mua kɛi kɛlɛŋ', 'Gbɛrɛ-yɛlɛ mɛɛni']
    },
    'life-skills': {
      'english': ['How to cook rice', 'Clean your hands', 'Be respectful'],
      'kpelle': ['Mali tii bee', 'Bo gbaa pɛlɛ', 'Yɛla kɛ']
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    
    setProcessing(true);
    
    // Simulate API call with realistic delay
    setTimeout(() => {
      let translation = '';
      let cultural = '';
      
      // Simple mock translation logic
      if (currentLanguage === 'english' && targetLanguage === 'kpelle') {
        if (inputText.toLowerCase().includes('hello')) {
          translation = 'Polo (Traditional greeting in Kpelle)';
          cultural = 'In Kpelle culture, greetings are very important and often include asking about family and health.';
        } else if (inputText.toLowerCase().includes('thank')) {
          translation = 'Sɛni gbɛrɛ (Thank you very much)';
          cultural = 'Gratitude is deeply valued in Kpelle society and is often expressed repeatedly.';
        } else {
          translation = `[Kpelle translation]: ${inputText}`;
          cultural = `This ${currentSubject} concept has cultural significance in traditional Kpelle education.`;
        }
      } else {
        if (inputText.toLowerCase().includes('polo')) {
          translation = 'Hello (Standard English greeting)';
          cultural = 'English greetings are typically shorter than traditional Kpelle greetings.';
        } else {
          translation = `[English translation]: ${inputText}`;
          cultural = `Understanding this ${currentSubject} concept helps bridge cultural learning.`;
        }
      }
      
      setTranslatedText(translation);
      setCulturalNote(cultural);
      setProcessing(false);
      
      // Add interaction to store
      addInteraction({
        id: `interaction_${Date.now()}`,
        sessionId: 'default_session', // Add sessionId property
        type: 'translation', // Add type property
        input: {
          text: inputText,
          language: currentLanguage
        },
        output: {
          text: translation,
          language: targetLanguage,
          culturalContext: cultural
        },
        timestamp: new Date()
      });
    }, 1500);
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // TODO: Implement speech recognition
  };

  const handleSpeak = (text: string) => {
    setIsSpeaking(true);
    // TODO: Implement text-to-speech
    setTimeout(() => setIsSpeaking(false), 2000);
  };

  const handleSamplePhrase = (phrase: string) => {
    setInputText(phrase);
  };

  const getCurrentSamplePhrases = () => {
    return samplePhrases[currentSubject as Subject]?.[currentLanguage as Language] || [];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Language Direction Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="capitalize">{currentLanguage}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={switchLanguages}
              className="px-3"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-green-600" />
              <span className="capitalize">{targetLanguage}</span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Input ({currentLanguage})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type in ${currentLanguage}...`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoiceInput}
                className={isListening ? 'bg-red-100 border-red-300' : ''}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? 'Stop' : 'Speak'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSpeak(inputText)}
                disabled={!inputText.trim() || isSpeaking}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                Listen
              </Button>
              
              <Button
                onClick={handleTranslate}
                disabled={!inputText.trim() || isProcessing}
                className="ml-auto"
              >
                {isProcessing ? 'Translating...' : 'Translate'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Book className="h-5 w-5" />
              <span>Translation ({targetLanguage})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {translatedText || (
                <span className="text-gray-400">Translation will appear here...</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSpeak(translatedText)}
                disabled={!translatedText || isSpeaking}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                Listen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cultural Context Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cultural Context & Learning Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            {culturalNote ? (
              <p className="text-sm text-blue-800">
                🌍 <strong>Cultural Note:</strong> {culturalNote}
              </p>
            ) : (
              <p className="text-sm text-blue-800">
                🌍 <strong>Cultural Note:</strong> This translation preserves the cultural context 
                appropriate for {currentSubject} learning. In Kpelle culture, this concept might 
                be expressed differently depending on the social context.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Quick Actions</h3>
        
        {/* Sample Phrases */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Sample phrases for {currentSubject} in {currentLanguage}:
          </h4>
          <div className="flex flex-wrap gap-2">
            {getCurrentSamplePhrases().map((phrase, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSamplePhrase(phrase)}
                className="text-xs"
              >
                {phrase}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm">Subject Vocabulary</Button>
          <Button variant="outline" size="sm">Pronunciation Guide</Button>
          <Button variant="outline" size="sm">Cultural Examples</Button>
        </div>
      </div>
    </div>
  );
}
