import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, className = '' }) => {
  return (
    <div
      className={`flex items-start gap-3 p-3.5 bg-[#1C1215] border border-[#3E1C22] rounded-md text-sm text-[#EDEDED] ${className}`}
    >
      <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
      <div className="flex-1 text-[13px] leading-relaxed text-[#A1A1AA]">
        <p className="font-medium text-[#F87171]">Pipeline Notice</p>
        <p className="mt-0.5 text-zinc-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-white bg-[#2A181D] hover:bg-[#382027] border border-[#4C2028] rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
