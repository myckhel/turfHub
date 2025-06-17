import { notification } from 'antd';
import React, { useEffect } from 'react';
import { useFlashStore } from '../../stores/flash.store';

export const FlashMessages: React.FC = () => {
  const { messages, removeMessage } = useFlashStore();
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    messages.forEach((message) => {
      api[message.type]({
        message: message.title || message.type.charAt(0).toUpperCase() + message.type.slice(1),
        description: message.message,
        duration: message.duration ? message.duration / 1000 : 5,
        onClose: () => removeMessage(message.id),
        btn: message.action ? (
          <button
            onClick={() => {
              message.action?.onClick();
              removeMessage(message.id);
            }}
            className="text-blue-500 hover:text-blue-600"
          >
            {message.action.label}
          </button>
        ) : undefined,
      });
    });
  }, [messages, api, removeMessage]);

  return <>{contextHolder}</>;
};
