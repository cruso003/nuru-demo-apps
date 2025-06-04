'use client';

import { useLearningStore } from '@/lib/stores/learning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Subject } from '@/lib/types/learning';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  BookOpen,
  Calculator,
  Microscope,
  Users,
  Heart
} from 'lucide-react';

const subjectIcons: Record<Subject, any> = {
  'mathematics': Calculator,
  'language-arts': BookOpen,
  'science': Microscope,
  'social-studies': Users,
  'life-skills': Heart,
};

export function ProgressDisplay() {
  const { user, progressMetrics, learningGoals } = useLearningStore();

  if (!progressMetrics && !user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Start learning to see your progress!</p>
        </CardContent>
      </Card>
    );
  }

  const accuracy = progressMetrics?.averageAccuracy || 0;
  const totalInteractions = progressMetrics?.totalInteractions || 0;
  const streakDays = progressMetrics?.streakDays || 0;
  const timeSpent = progressMetrics?.timeSpentMinutes || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{Math.round(accuracy)}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{totalInteractions}</div>
            <div className="text-sm text-gray-600">Interactions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{streakDays}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{Math.round(timeSpent / 60)}h</div>
            <div className="text-sm text-gray-600">Time Spent</div>
          </CardContent>
        </Card>
      </div>

      {progressMetrics?.levelProgression && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(progressMetrics.levelProgression).map(([subject, level]) => {
                const Icon = subjectIcons[subject as Subject];
                const progress = ((level as number) / 10) * 100;
                
                return (
                  <div key={subject} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium capitalize">
                          {subject.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">Level {level as number}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {learningGoals && learningGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {learningGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.title}</span>
                    <span className="text-sm text-gray-600">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
