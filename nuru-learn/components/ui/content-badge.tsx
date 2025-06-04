"use client";

import { Badge } from './badge';
import { Bot, Database, Sparkles } from 'lucide-react';

interface ContentBadgeProps {
  type: 'ai-generated' | 'demo-data' | 'cultural-content';
  className?: string;
}

const badgeConfig = {
  'ai-generated': {
    icon: Bot,
    text: 'AI Generated',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  'demo-data': {
    icon: Database,
    text: 'Demo Data',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'cultural-content': {
    icon: Sparkles,
    text: 'Curated Content',
    variant: 'outline' as const,
    className: 'bg-purple-100 text-purple-800 border-purple-200'
  }
};

export function ContentBadge({ type, className }: ContentBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1 text-xs`}
    >
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  );
}
