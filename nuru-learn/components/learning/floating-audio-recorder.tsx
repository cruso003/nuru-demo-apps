"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square,
  Volume2,
  VolumeX,
  Trash2,
  Send,
  Download,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/learning';

interface AudioRecorderProps {
  isVisible: boolean;
  onClose: () => void;
  mode?: 'pronunciation' | 'conversation' | 'practice';
}

export function FloatingAudioRecorder({ isVisible, onClose, mode = 'practice' }: AudioRecorderProps) {
  const { 
    currentSession
  } = useLearningStore();

  // Placeholder functions - these should be implemented later
  const processAudioInput = async (audioBlob: Blob, sessionType: string) => {
    // TODO: Implement with Nuru API
    return { feedback: 'Audio processed successfully!', score: 85 };
  };

  const showNotification = (message: string, type: string) => {
    console.log(`${type}: ${message}`);
  };

  const aiState = { isProcessing: false };

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;

      // Set up audio analysis for volume visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start volume visualization
      visualizeVolume();
      
      showNotification('Recording started', 'success');
    } catch (error) {
      console.error('Failed to start recording:', error);
      showNotification('Failed to access microphone', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      showNotification('Recording completed', 'success');
    }
  };

  const visualizeVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateVolume = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setVolume(average / 255);
      
      animationRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setAnalysisResult(null);
    showNotification('Recording deleted', 'info');
  };

  const submitRecording = async () => {
    if (!audioBlob || !currentSession) return;

    setIsProcessing(true);
    try {
      const result = await processAudioInput(audioBlob, currentSession.mode || 'guided');
      setAnalysisResult(result);
      showNotification('Audio processed successfully!', 'success');
    } catch (error) {
      console.error('Failed to process audio:', error);
      showNotification('Failed to process audio', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nuru-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Recording downloaded', 'success');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeConfig = () => {
    const configs = {
      pronunciation: {
        title: 'Pronunciation Practice',
        color: 'from-blue-500 to-blue-600',
        icon: Volume2,
        description: 'Practice your Kpelle pronunciation'
      },
      conversation: {
        title: 'Conversation Mode',
        color: 'from-green-500 to-green-600',
        icon: Mic,
        description: 'Have a conversation with your AI tutor'
      },
      practice: {
        title: 'Free Practice',
        color: 'from-purple-500 to-purple-600',
        icon: BarChart3,
        description: 'Practice speaking freely'
      }
    };
    return configs[mode];
  };

  const modeConfig = getModeConfig();
  const ModeIcon = modeConfig.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Floating Recorder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-80 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${modeConfig.color} text-white`}>
                  <ModeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {modeConfig.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {modeConfig.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close audio recorder"
                title="Close audio recorder"
              >
                ×
              </button>
            </div>

            {/* Recording Visualization */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {/* Main record button */}
                <motion.button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`
                    w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-200
                    ${isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </motion.button>

                {/* Volume visualization rings */}
                {isRecording && (
                  <div className="absolute inset-0">
                    <motion.div
                      className="absolute inset-0 border-4 border-red-300 rounded-full"
                      animate={{ 
                        scale: [1, 1.2 + volume * 0.5, 1],
                        opacity: [0.7, 0.3, 0.7]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 border-2 border-red-400 rounded-full"
                      animate={{ 
                        scale: [1, 1.1 + volume * 0.3, 1],
                        opacity: [0.5, 0.2, 0.5]
                      }}
                      transition={{ 
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Recording Status */}
            <div className="text-center mb-6">
              {isRecording ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Recording
                    </span>
                  </div>
                  <div className="text-2xl font-mono text-gray-900 dark:text-white">
                    {formatTime(recordingTime)}
                  </div>
                </div>
              ) : audioUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      Ready to submit
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Duration: {formatTime(recordingTime)}
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 dark:text-gray-400">
                  Tap the microphone to start recording
                </div>
              )}
            </div>

            {/* Audio Controls */}
            {audioUrl && (
              <div className="space-y-4 mb-6">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={playRecording}
                    className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    aria-label={isPlaying ? "Pause recording" : "Play recording"}
                    title={isPlaying ? "Pause recording" : "Play recording"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={deleteRecording}
                    className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    aria-label="Delete recording"
                    title="Delete recording"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={downloadRecording}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Download recording"
                    title="Download recording"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Result */}
            {analysisResult && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                      Analysis Complete
                    </h4>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      {analysisResult.feedback || 'Great pronunciation! Keep practicing.'}
                    </p>
                    {analysisResult.score && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                        Score: {analysisResult.score}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {audioUrl && !analysisResult && (
              <button
                onClick={submitRecording}
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit for Analysis
                  </>
                )}
              </button>
            )}

            {/* AI Status */}
            {aiState.isProcessing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                AI is analyzing your pronunciation...
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
