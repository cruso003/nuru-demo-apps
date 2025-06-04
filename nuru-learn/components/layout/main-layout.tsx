/**
 * Main Layout Component
 * Advanced application layout with sidebar, navigation, and multimodal features
 */

'use client';

import { useSidebar, useAudioRecorder, useAIAssistant } from '@/lib/stores/ui';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { FloatingAudioRecorder } from '@/components/learning/floating-audio-recorder';
import { AIAssistant } from '@/components/learning/ai-assistant';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const audioRecorder = useAudioRecorder();
  const aiAssistant = useAIAssistant();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:block
      `}>
        <Sidebar />
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 relative">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Features */}
      <FloatingAudioRecorder 
        isVisible={audioRecorder.isVisible}
        onClose={audioRecorder.hide}
        mode={audioRecorder.mode}
      />
      <AIAssistant 
        isOpen={aiAssistant.isOpen}
        onClose={aiAssistant.hide}
        mode={aiAssistant.mode}
      />

      {/* Global Notifications */}
      {/* <NotificationContainer /> */}
    </div>
  );
}
