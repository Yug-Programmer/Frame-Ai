import React from 'react';

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Processing request...',
  sublabel,
}) => {
  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-[#131318] border border-[#23232C] rounded-md text-sm">
      <div className="w-3.5 h-3.5 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin shrink-0" />
      <div>
        <p className="text-[13px] font-medium text-[#EDEDED]">{label}</p>
        {sublabel && <p className="text-[12px] text-[#A1A1AA] mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};
