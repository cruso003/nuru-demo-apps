/**
 * UI State Management Store
 * Manages application UI state, navigation, and component visibility
 */

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';

export type ViewType = 'dashboard' | 'lesson' | 'practice' | 'analytics' | 'profile';

interface UIState {
  // Navigation state
  currentView: ViewType;
  sidebarOpen: boolean;
  
  // Floating component visibility
  audioRecorderVisible: boolean;
  aiAssistantOpen: boolean;
  
  // Modal and overlay states
  showSettings: boolean;
  showProfile: boolean;
  showNotifications: boolean;
  
  // Loading and processing states
  isLoading: boolean;
  loadingMessage: string;
  
  // Responsive design states
  isMobile: boolean;
  isTablet: boolean;
  
  // Accessibility states
  highContrast: boolean;
  reducedMotion: boolean;
  
  // Audio/Video states
  audioRecorderMode: 'pronunciation' | 'conversation' | 'practice';
  aiAssistantMode: 'chat' | 'tutor' | 'practice';
}

interface UIActions {
  // Navigation actions
  setCurrentView: (view: ViewType) => void;
  navigateTo: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Floating component actions
  showAudioRecorder: (mode?: 'pronunciation' | 'conversation' | 'practice') => void;
  hideAudioRecorder: () => void;
  toggleAudioRecorder: () => void;
  setAudioRecorderMode: (mode: 'pronunciation' | 'conversation' | 'practice') => void;
  
  showAIAssistant: (mode?: 'chat' | 'tutor' | 'practice') => void;
  hideAIAssistant: () => void;
  toggleAIAssistant: () => void;
  setAIAssistantMode: (mode: 'chat' | 'tutor' | 'practice') => void;
  
  // Modal and overlay actions
  showSettingsModal: () => void;
  hideSettingsModal: () => void;
  showProfileModal: () => void;
  hideProfileModal: () => void;
  showNotificationsPanel: () => void;
  hideNotificationsPanel: () => void;
  
  // Loading actions
  setLoading: (loading: boolean, message?: string) => void;
  
  // Responsive actions
  setMobile: (isMobile: boolean) => void;
  setTablet: (isTablet: boolean) => void;
  
  // Accessibility actions
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  
  // Utility actions
  closeAllModals: () => void;
  closeAllFloating: () => void;
  reset: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  // Navigation state
  currentView: 'dashboard',
  sidebarOpen: false,
  
  // Floating component visibility
  audioRecorderVisible: false,
  aiAssistantOpen: false,
  
  // Modal and overlay states
  showSettings: false,
  showProfile: false,
  showNotifications: false,
  
  // Loading and processing states
  isLoading: false,
  loadingMessage: '',
  
  // Responsive design states
  isMobile: false,
  isTablet: false,
  
  // Accessibility states
  highContrast: false,
  reducedMotion: false,
  
  // Audio/Video states
  audioRecorderMode: 'practice',
  aiAssistantMode: 'chat',
};

export const useUIStore = create<UIStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Navigation actions
        setCurrentView: (view: ViewType) => {
          set({ currentView: view });
          // Auto-close sidebar on mobile when navigating
          if (get().isMobile && get().sidebarOpen) {
            set({ sidebarOpen: false });
          }
        },
        
        navigateTo: (view: ViewType) => {
          set({ currentView: view });
          // Close all floating components when navigating
          set({ 
            audioRecorderVisible: false,
            aiAssistantOpen: false,
            showNotifications: false 
          });
        },
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        
        // Floating component actions
        showAudioRecorder: (mode = 'practice') => set({ 
          audioRecorderVisible: true, 
          audioRecorderMode: mode 
        }),
        hideAudioRecorder: () => set({ audioRecorderVisible: false }),
        toggleAudioRecorder: () => set((state) => ({ 
          audioRecorderVisible: !state.audioRecorderVisible 
        })),
        setAudioRecorderMode: (mode) => set({ audioRecorderMode: mode }),
        
        showAIAssistant: (mode = 'chat') => set({ 
          aiAssistantOpen: true, 
          aiAssistantMode: mode 
        }),
        hideAIAssistant: () => set({ aiAssistantOpen: false }),
        toggleAIAssistant: () => set((state) => ({ 
          aiAssistantOpen: !state.aiAssistantOpen 
        })),
        setAIAssistantMode: (mode) => set({ aiAssistantMode: mode }),
        
        // Modal and overlay actions
        showSettingsModal: () => set({ showSettings: true }),
        hideSettingsModal: () => set({ showSettings: false }),
        showProfileModal: () => set({ showProfile: true }),
        hideProfileModal: () => set({ showProfile: false }),
        showNotificationsPanel: () => set({ showNotifications: true }),
        hideNotificationsPanel: () => set({ showNotifications: false }),
        
        // Loading actions
        setLoading: (loading: boolean, message = '') => set({ 
          isLoading: loading, 
          loadingMessage: message 
        }),
        
        // Responsive actions
        setMobile: (isMobile: boolean) => {
          set({ isMobile });
          // Auto-close sidebar on mobile
          if (isMobile && get().sidebarOpen) {
            set({ sidebarOpen: false });
          }
        },
        setTablet: (isTablet: boolean) => set({ isTablet }),
        
        // Accessibility actions
        toggleHighContrast: () => set((state) => ({ 
          highContrast: !state.highContrast 
        })),
        toggleReducedMotion: () => set((state) => ({ 
          reducedMotion: !state.reducedMotion 
        })),
        
        // Utility actions
        closeAllModals: () => set({ 
          showSettings: false,
          showProfile: false,
          showNotifications: false 
        }),
        closeAllFloating: () => set({ 
          audioRecorderVisible: false,
          aiAssistantOpen: false 
        }),
        reset: () => set(initialState),
      }),
      {
        name: 'nuru-learn-ui-storage',
        storage: createJSONStorage(() => localStorage),
        // Only persist certain UI preferences
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          highContrast: state.highContrast,
          reducedMotion: state.reducedMotion,
          audioRecorderMode: state.audioRecorderMode,
          aiAssistantMode: state.aiAssistantMode,
        }),
      }
    )
  )
);

// Convenience hooks for common UI state - using separate selectors to avoid infinite loops
export const useCurrentView = () => useUIStore((state) => state.currentView);

export const useSidebar = () => ({
  isOpen: useUIStore((state) => state.sidebarOpen),
  toggle: useUIStore((state) => state.toggleSidebar),
  setOpen: useUIStore((state) => state.setSidebarOpen),
});

export const useAudioRecorder = () => ({
  isVisible: useUIStore((state) => state.audioRecorderVisible),
  mode: useUIStore((state) => state.audioRecorderMode),
  show: useUIStore((state) => state.showAudioRecorder),
  hide: useUIStore((state) => state.hideAudioRecorder),
  toggle: useUIStore((state) => state.toggleAudioRecorder),
});

export const useAIAssistant = () => ({
  isOpen: useUIStore((state) => state.aiAssistantOpen),
  mode: useUIStore((state) => state.aiAssistantMode),
  show: useUIStore((state) => state.showAIAssistant),
  hide: useUIStore((state) => state.hideAIAssistant),
  toggle: useUIStore((state) => state.toggleAIAssistant),
});

export const useResponsive = () => ({
  isMobile: useUIStore((state) => state.isMobile),
  isTablet: useUIStore((state) => state.isTablet),
  setMobile: useUIStore((state) => state.setMobile),
  setTablet: useUIStore((state) => state.setTablet),
});
