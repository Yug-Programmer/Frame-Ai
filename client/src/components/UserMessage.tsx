import React from 'react';
import { ChatMessage } from '../types/index.js';

interface UserMessageProps {
  message: ChatMessage;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="w-full px-4 py-3">
      <div className="max-w-3xl mx-auto flex justify-end">
        <div
          className="bg-[#2F2F2F] text-white text-[15px] leading-relaxed px-4 py-3 whitespace-pre-wrap break-words"
          style={{ maxWidth: '75%', borderRadius: '24px', borderBottomRightRadius: '6px' }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
};
