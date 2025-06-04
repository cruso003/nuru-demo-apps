"use client";

import { motion } from 'framer-motion';
import { Loader2, Globe, Brain, Mic, MessageCircle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  stage?: 'initializing' | 'authenticating' | 'loading-data' | 'connecting' | 'ready';
}

export function LoadingScreen({ 
  message = 'Loading Nuru Learn...', 
  progress = 0,
  stage = 'initializing' 
}: LoadingScreenProps) {
  
  const stageInfo = {
    initializing: {
      icon: Globe,
      title: 'Initializing Nuru Learn',
      description: 'Setting up your learning environment'
    },
    authenticating: {
      icon: Brain,
      title: 'Authenticating',
      description: 'Verifying your account'
    },
    'loading-data': {
      icon: MessageCircle,
      title: 'Loading Learning Data',
      description: 'Preparing your personalized content'
    },
    connecting: {
      icon: Mic,
      title: 'Connecting to AI',
      description: 'Establishing connection with Nuru AI'
    },
    ready: {
      icon: Globe,
      title: 'Ready to Learn',
      description: 'Welcome to your learning journey'
    }
  };

  const currentStage = stageInfo[stage];
  const StageIcon = currentStage.icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-50 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-6">
        {/* Logo and branding */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="p-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl shadow-learning"
            >
              <Globe className="w-12 h-12 text-white" />
            </motion.div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              Nuru Learn
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Kpelle ↔ English Learning Platform
            </p>
          </div>
        </motion.div>

        {/* Stage indicator */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg"
            >
              <StageIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </motion.div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentStage.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentStage.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress bar */}
        {progress > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Loading message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-gray-700 dark:text-gray-300">
            {message}
          </p>

          {/* Animated loading indicator */}
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid grid-cols-3 gap-4 pt-8"
        >
          {[
            { icon: Mic, label: 'Voice Learning' },
            { icon: Brain, label: 'AI Powered' },
            { icon: MessageCircle, label: 'Interactive' }
          ].map((feature, index) => {
            const FeatureIcon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: index * 0.3 
                }}
                className="text-center space-y-2"
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg inline-block">
                  <FeatureIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
