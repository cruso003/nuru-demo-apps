"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X,
  AlertTriangle 
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

export function NotificationContainer() {
  const { notifications } = useLearningStore();
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([]);

  // Update displayed notifications when store notifications change
  useEffect(() => {
    setDisplayedNotifications(notifications || []);
  }, [notifications]);

  const removeNotification = (id: string) => {
    setDisplayedNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    const iconMap = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info
    };
    return iconMap[type];
  };

  const getStyles = (type: Notification['type']) => {
    const styleMap = {
      success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200'
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-800 dark:text-yellow-200'
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200'
      }
    };
    return styleMap[type];
  };

  // Auto-remove notifications after duration
  useEffect(() => {
    displayedNotifications.forEach(notification => {
      if (!notification.persistent && notification.duration !== 0) {
        const duration = notification.duration || 5000;
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, duration);

        return () => clearTimeout(timer);
      }
    });
  }, [displayedNotifications]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {displayedNotifications.map((notification) => {
          const Icon = getIcon(notification.type);
          const styles = getStyles(notification.type);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`
                ${styles.bg} ${styles.border} ${styles.text}
                border rounded-lg shadow-lg p-4 pointer-events-auto
                backdrop-blur-sm
              `}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
                
                <div className="flex-1 min-w-0">
                  {notification.title && (
                    <h4 className="font-semibold text-sm mb-1">
                      {notification.title}
                    </h4>
                  )}
                  <p className="text-sm leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                <button
                aria-label='Close notification'
                  onClick={() => removeNotification(notification.id)}
                  className={`
                    ${styles.icon} hover:opacity-70 transition-opacity
                    flex-shrink-0 p-1 rounded-md
                  `}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
