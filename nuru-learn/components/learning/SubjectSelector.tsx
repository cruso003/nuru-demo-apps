'use client';

import { useLearningStore } from '@/lib/stores/learning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  BookOpen, 
  Microscope, 
  Users, 
  Heart,
  ChevronRight 
} from 'lucide-react';
import { Subject } from '@/lib/types/learning';

const subjectIcons: Record<Subject, any> = {
  'mathematics': Calculator,
  'language-arts': BookOpen,
  'science': Microscope,
  'social-studies': Users,
  'life-skills': Heart,
};

const subjectTitles: Record<Subject, string> = {
  'mathematics': 'Mathematics',
  'language-arts': 'Language Arts',
  'science': 'Science',
  'social-studies': 'Social Studies',
  'life-skills': 'Life Skills',
};

const subjectDescriptions: Record<Subject, string> = {
  'mathematics': 'Numbers, calculations, and problem-solving in both languages',
  'language-arts': 'Reading, writing, and literature across cultures',
  'science': 'Natural world exploration with local examples',
  'social-studies': 'History, geography, and cultural understanding',
  'life-skills': 'Practical knowledge for daily life',
};

export function SubjectSelector() {
  const { currentSubject, setCurrentSubject, progressMetrics } = useLearningStore();

  const subjects: Subject[] = ['mathematics', 'language-arts', 'science', 'social-studies', 'life-skills'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => {
        const Icon = subjectIcons[subject];
        const isSelected = currentSubject === subject;
        const level = progressMetrics?.levelProgression[subject] || 1;

        return (
          <Card 
            key={subject}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              isSelected 
                ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' 
                : 'hover:border-gray-300'
            }`}
            onClick={() => setCurrentSubject(subject)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-base">{subjectTitles[subject]}</span>
                </div>
                {isSelected && (
                  <ChevronRight className="h-4 w-4 text-blue-600" />
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {subjectDescriptions[subject]}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Level {level}</span>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
