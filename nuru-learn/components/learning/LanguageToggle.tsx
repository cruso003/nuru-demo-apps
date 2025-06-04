'use client';

import { useLearningStore } from '@/lib/stores/learning';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Globe } from 'lucide-react';

export function LanguageToggle() {
  const { currentLanguage, targetLanguage, switchLanguages } = useLearningStore();

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm font-medium text-gray-700">
        {currentLanguage === 'kpelle' ? 'Kpelle' : 'English'}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={switchLanguages}
        className="p-2 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeftRight className="h-4 w-4" />
      </Button>
      <div className="text-sm font-medium text-gray-700">
        {targetLanguage === 'kpelle' ? 'Kpelle' : 'English'}
      </div>
      <Globe className="h-4 w-4 text-gray-500" />
    </div>
  );
}
