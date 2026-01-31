import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface FlashMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  closable?: boolean;
}

interface FlashState {
  messages: FlashMessage[];
}

interface FlashActions {
  addMessage: (message: Omit<FlashMessage, 'id'>) => void;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

export const useFlashStore = create<FlashState & FlashActions>()(
  devtools(
    (set, get) => ({
      // State
      messages: [],

      // Actions
      addMessage: (messageData) => {
        const message: FlashMessage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          duration: 5000,
          closable: true,
          ...messageData,
        };

        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'flash/addMessage',
        );

        // Auto-remove after duration
        if (message.duration && message.duration > 0) {
          setTimeout(() => {
            get().removeMessage(message.id);
          }, message.duration);
        }
      },

      removeMessage: (id) =>
        set(
          (state) => ({
            messages: state.messages.filter((msg) => msg.id !== id),
          }),
          false,
          'flash/removeMessage',
        ),

      clearMessages: () => set({ messages: [] }, false, 'flash/clearMessages'),

      success: (message, title) => get().addMessage({ type: 'success', message, title }),

      error: (message, title) => get().addMessage({ type: 'error', message, title, duration: 8000 }),

      warning: (message, title) => get().addMessage({ type: 'warning', message, title }),

      info: (message, title) => get().addMessage({ type: 'info', message, title }),
    }),
    { name: 'FlashStore' },
  ),
);
