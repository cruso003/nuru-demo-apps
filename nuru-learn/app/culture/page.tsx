'use client';

import { CulturalSpotlight } from '@/components/dashboard/cultural-spotlight';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Globe, BookOpen, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function CulturePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                <Globe className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Kpelle Cultural Heritage
              </h1>
            </div>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              Explore the rich traditions, stories, and wisdom of the Kpelle people
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <BookOpen className="w-3 h-3 mr-1" />
                Interactive Stories
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Users className="w-3 h-3 mr-1" />
                Cultural Traditions
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Globe className="w-3 h-3 mr-1" />
                Language Learning
              </Badge>
            </div>
          </div>
        </div>

        {/* Cultural Spotlight Component */}
        <CulturalSpotlight />

        {/* Additional Cultural Resources */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Traditional Stories
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Discover ancient folktales and legends passed down through generations
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Explore Stories
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Social Traditions
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Learn about ceremonies, festivals, and community practices
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Learn Traditions
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cultural Context
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Understand the historical and geographical context of Kpelle culture
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Explore Context
            </Button>
          </div>
        </div>

        {/* Developer Note */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline" className="text-xs">
              Developer Feature
            </Badge>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Cultural Content Management
            </span>
          </div>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            This page demonstrates how developers can create rich cultural content experiences. 
            The cultural data would typically be managed through a CMS or database, with potential 
            for user-generated content and community contributions.
          </p>
        </div>
      </div>
    </div>
  );
}
