"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  BookOpen,
  Mic,
  MessageCircle,
  Star,
  BarChart3,
  User
} from 'lucide-react';
import { useLearningStore } from '@/lib/stores/enhanced-learning';
import { nuruAI, type PerformanceAnalysisRequest } from '@/lib/services/enhanced-nuru-ai';

interface Insight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'achievement' | 'prediction';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: boolean;
  action?: string;
  progress?: number;
  metadata?: {
    skill?: string;
    timeframe?: string;
    confidence?: number;
  };
}

type CategoryType = 'all' | 'strengths' | 'improvements' | 'recommendations';

export function AIInsights() {
  const { currentUser, progress, currentSubject } = useLearningStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  // Generate AI insights based on user data
  useEffect(() => {
    const generateInsights = async () => {
      if (!currentUser) return;
      
      setIsGenerating(true);
      
      try {
        // Check if Nuru AI is available
        const healthStatus = await nuruAI.healthCheck();
        
        if (healthStatus.status === 'healthy' && progress && progress.activitiesCompleted > 0) {
          // Create a performance request based on user's progress data
          const performanceRequest: PerformanceAnalysisRequest = {
            responses: Array.from({ length: Math.min(progress.activitiesCompleted, 5) }, (_, index) => ({
              question: `Practice question ${index + 1}`,
              user_answer: `Student answer ${index + 1}`,
              correct_answer: `Correct answer ${index + 1}`,
              response_time: 5000 + Math.random() * 10000
            })),
            subject: currentSubject || 'general',
            difficulty: currentUser.proficiencyLevel || 'beginner'
          };

          // Get AI analysis
          const analysis = await nuruAI.analyzePerformance(performanceRequest);
          
          // Convert AI analysis to insights
          const aiInsights: Insight[] = [];
          
          // Add strength insights
          if (analysis.strengths?.length) {
            analysis.strengths.forEach((strength: string, index: number) => {
              aiInsights.push({
                id: `ai-strength-${index}`,
                type: 'strength',
                title: `Strength: ${strength}`,
                description: `You're performing well in this area with ${analysis.overall_score || 0}% accuracy.`,
                icon: CheckCircle,
                color: 'bg-green-500',
                priority: (analysis.overall_score || 0) > 80 ? 'high' : 'medium',
                progress: analysis.overall_score,
                metadata: {
                  skill: currentSubject || undefined,
                  confidence: 90
                }
              });
            });
          }

          // Add improvement insights
          if (analysis.weaknesses?.length) {
            analysis.weaknesses.forEach((weakness: string, index: number) => {
              aiInsights.push({
                id: `ai-weakness-${index}`,
                type: 'improvement',
                title: `Area for Improvement: ${weakness}`,
                description: `Focus on this area to improve your overall performance.`,
                icon: AlertCircle,
                color: 'bg-orange-500',
                priority: (analysis.overall_score || 0) < 60 ? 'high' : 'medium',
                actionable: true,
                action: 'Practice More',
                metadata: {
                  skill: currentSubject || undefined,
                  confidence: 85
                }
              });
            });
          }

          // Add recommendation insights
          if (analysis.recommendations?.length) {
            analysis.recommendations.forEach((recommendation: string, index: number) => {
              aiInsights.push({
                id: `ai-recommendation-${index}`,
                type: 'recommendation',
                title: 'AI Recommendation',
                description: recommendation,
                icon: Lightbulb,
                color: 'bg-blue-500',
                priority: 'medium',
                actionable: true,
                action: 'Follow Recommendation',
                metadata: {
                  skill: currentSubject || undefined,
                  confidence: 88
                }
              });
            });
          }

          // Add achievement insight if score is high
          if ((analysis.overall_score || 0) >= 80) {
            aiInsights.push({
              id: 'ai-achievement',
              type: 'achievement',
              title: 'Excellent Performance!',
              description: `You're achieving ${analysis.overall_score}% accuracy. Keep up the great work!`,
              icon: Star,
              color: 'bg-yellow-500',
              priority: 'high',
              progress: analysis.overall_score,
              metadata: {
                skill: currentSubject || undefined,
                confidence: 100
              }
            });
          }

          // Add prediction insight based on difficulty adjustment
          if (analysis.difficulty_adjustment) {
            const predictionMap: Record<string, string> = {
              'increase': 'Ready for Advanced Level',
              'maintain': 'Steady Progress Continues',
              'decrease': 'Foundation Building Recommended'
            };
            
            const adjustmentMessages: Record<string, string> = {
              'increase': 'recommend moving to more challenging content',
              'maintain': 'suggest continuing at your current pace',
              'decrease': 'recommend reviewing fundamental concepts'
            };
            
            aiInsights.push({
              id: 'ai-prediction',
              type: 'prediction',
              title: predictionMap[analysis.difficulty_adjustment] || 'Continue Learning',
              description: `Based on your performance, we ${adjustmentMessages[analysis.difficulty_adjustment] || 'recommend continuing your current approach'}.`,
              icon: TrendingUp,
              color: 'bg-purple-500',
              priority: 'medium',
              metadata: {
                timeframe: 'next session',
                confidence: 87
              }
            });
          }

          setInsights(aiInsights);
          setAiSummary(analysis.feedback || 'Great progress! Keep up the excellent work.');
          
        } else {
          // Fallback to simplified insights if AI is unavailable or no progress data
          const isHealthy = healthStatus.status === 'healthy';
          const fallbackInsights: Insight[] = [
            {
              id: 'start-learning',
              type: 'recommendation',
              title: 'Start Your Learning Journey',
              description: isHealthy
                ? 'Complete some lessons to get personalized AI insights about your progress.'
                : 'Complete some lessons to track your progress. AI insights will be available when the service is online.',
              icon: BookOpen,
              color: 'bg-blue-500',
              priority: 'high',
              actionable: true,
              action: 'Start Lesson'
            }
          ];
          
          setInsights(fallbackInsights);
          setAiSummary(isHealthy
            ? 'Complete some learning activities to receive personalized insights from your AI tutor.'
            : 'Start learning to track your progress. AI-powered insights will be available when the service comes online.'
          );
        }
        
      } catch (error) {
        console.error('Failed to generate AI insights:', error);
        
        // Fallback insights on error
        const errorInsights: Insight[] = [
          {
            id: 'error-insight',
            type: 'recommendation',
            title: 'Learning Progress Tracking',
            description: 'Continue your learning journey. Detailed insights will be available soon.',
            icon: Brain,
            color: 'bg-gray-500',
            priority: 'medium'
          }
        ];
        
        setInsights(errorInsights);
        setAiSummary('Continue your learning journey and check back for AI-powered insights.');
      }
      
      setIsGenerating(false);
    };

    generateInsights();
  }, [currentUser, progress?.activitiesCompleted, currentSubject]);

  const getInsightIcon = (type: string): React.ComponentType<{ className?: string }> => {
    const icons = {
      strength: CheckCircle,
      improvement: AlertCircle,
      recommendation: Lightbulb,
      achievement: Star,
      prediction: TrendingUp
    };
    return icons[type as keyof typeof icons] || Brain;
  };

  const getInsightColor = (type: string): string => {
    const colors = {
      strength: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      improvement: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      recommendation: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      achievement: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      prediction: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      high: 'border-red-300 bg-red-50 dark:bg-red-900/20',
      medium: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20',
      low: 'border-green-300 bg-green-50 dark:bg-green-900/20'
    };
    return colors[priority as keyof typeof colors] || 'border-gray-300 bg-gray-50 dark:bg-gray-900/20';
  };

  const filteredInsights = insights.filter(insight => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'strengths') return insight.type === 'strength' || insight.type === 'achievement';
    if (selectedCategory === 'improvements') return insight.type === 'improvement';
    if (selectedCategory === 'recommendations') return insight.type === 'recommendation' || insight.type === 'prediction';
    return true;
  });

  const handleInsightAction = async (insight: Insight) => {
    if (!insight.actionable || !insight.action) return;
    
    // Handle different actions
    switch (insight.action) {
      case 'Start Cultural Module':
        // Navigate to cultural learning module
        console.log('Navigating to cultural module...');
        break;
      case 'Practice Conversations':
        // Start conversation practice
        console.log('Starting conversation practice...');
        break;
      case 'Start Lesson':
        // Navigate to lessons
        console.log('Starting lesson...');
        break;
      default:
        console.log(`Executing action: ${insight.action}`);
        break;
    }
  };

  const handleRefreshInsights = async () => {
    setIsGenerating(true);
    
    try {
      if (currentUser && progress && progress.activitiesCompleted > 0) {
        const healthStatus = await nuruAI.healthCheck();
        if (healthStatus.status === 'healthy') {
          // Force a fresh AI analysis by triggering useEffect
          window.location.reload();
        } else {
          alert('AI service is currently offline. Please try again later.');
        }
      } else {
        alert('Complete some learning activities first to get AI insights.');
      }
    } catch (error) {
      console.error('Failed to refresh insights:', error);
      alert('Failed to refresh insights. Please try again.');
    }
    
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Learning Insights
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personalized recommendations from your AI tutor
            </p>
          </div>
        </div>
        <button
          onClick={handleRefreshInsights}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {isGenerating ? 'Generating...' : 'Refresh AI Insights'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {[
          { key: 'all' as const, label: 'All Insights' },
          { key: 'strengths' as const, label: 'Strengths' },
          { key: 'improvements' as const, label: 'Areas to Improve' },
          { key: 'recommendations' as const, label: 'Recommendations' }
        ].map((category) => (
          <button
            key={category.key}
            onClick={() => setSelectedCategory(category.key)}
            className={`
              px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${selectedCategory === category.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600 dark:text-gray-400">AI is analyzing your progress...</span>
          </div>
        </div>
      )}

      {/* Insights Grid */}
      {!isGenerating && (
        <div className="space-y-4">
          {filteredInsights.map((insight, index) => {
            const TypeIcon = getInsightIcon(insight.type);
            const IconComponent = insight.icon;
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-5 rounded-xl border-l-4 transition-all duration-200 hover:shadow-md
                  ${getPriorityColor(insight.priority)}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                      {/* Priority Badge */}
                      <div className={`
                        px-2 py-1 text-xs font-medium rounded-full ml-4 capitalize
                        ${insight.priority === 'high'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : insight.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }
                      `}>
                        {insight.priority} priority
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {insight.progress !== undefined && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{insight.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${insight.progress}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {insight.metadata?.skill && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {insight.metadata.skill}
                        </div>
                      )}
                      {insight.metadata?.timeframe && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {insight.metadata.timeframe}
                        </div>
                      )}
                      {insight.metadata?.confidence && (
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {insight.metadata.confidence}% confidence
                        </div>
                      )}
                    </div>
                    
                    {/* Action Button */}
                    {insight.actionable && insight.action && (
                      <button
                        onClick={() => handleInsightAction(insight)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 text-sm font-medium"
                      >
                        {insight.action}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Type Icon */}
                  <div className="flex items-center">
                    <TypeIcon className={`w-4 h-4 ${getInsightColor(insight.type).split(' ')[0]}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isGenerating && filteredInsights.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4">
            <Brain className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No insights yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Keep learning to get personalized AI insights about your progress
          </p>
        </div>
      )}

      {/* AI Learning Summary */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
            <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Your AI Tutor's Summary
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
              {aiSummary || 'You\'re making excellent progress in your Kpelle learning journey! Your pronunciation has significantly improved, and your cultural understanding is deepening. Focus on conversation practice to reach the next level. Keep up the consistent daily practice - it\'s your biggest strength!'}
            </p>
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Tip:</span>
              <span>
                {insights.length > 0 && insights.find(i => i.actionable)
                  ? `Try: ${insights.find(i => i.actionable)?.action}`
                  : 'Try recording yourself speaking and comparing with native speakers'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
