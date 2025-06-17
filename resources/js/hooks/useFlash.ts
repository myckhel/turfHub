import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useFlashStore } from '../stores/flash.store';

interface FlashData {
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
  message?: string;
}

interface PageProps extends Record<string, unknown> {
  flash?: FlashData;
  errors?: Record<string, string>;
}

export const useFlash = () => {
  const { flash, errors } = usePage<PageProps>().props;
  const { 
    messages, 
    addMessage, 
    removeMessage, 
    clearMessages, 
    success, 
    error, 
    warning, 
    info 
  } = useFlashStore();

  // Handle Laravel flash messages
  useEffect(() => {
    if (flash) {
      if (flash.success) success(flash.success);
      if (flash.error) error(flash.error);
      if (flash.warning) warning(flash.warning);
      if (flash.info) info(flash.info);
      if (flash.message) info(flash.message);
    }
  }, [flash, success, error, warning, info]);

  // Handle Laravel validation errors
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors);
      if (errorMessages.length === 1) {
        error(errorMessages[0], 'Validation Error');
      } else {
        error(
          `Please check the following fields: ${Object.keys(errors).join(', ')}`,
          'Validation Errors'
        );
      }
    }
  }, [errors, error]);

  return {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
    success,
    error,
    warning,
    info,
  };
};
