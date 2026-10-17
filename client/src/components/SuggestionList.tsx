import React from 'react';

interface SuggestionListProps {
  onSelectSuggestion: (text: string) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    {
      title: 'AI Agents Explainer',
      prompt: 'Create a 30-second explainer about how AI agents are changing software development',
    },
    {
      title: 'Cybersecurity Trends',
      prompt: 'Create a 30-second video about the top cybersecurity trends in 2026',
    },
    {
      title: 'Space Exploration',
      prompt: 'Turn this topic into a short educational video: Why deep space exploration matters',
    },
    {
      title: 'Autonomous Systems',
      prompt: 'Explain how autonomous systems differ from traditional software in 45 seconds',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto select-none">
      <div className="mb-6 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Frame Cinematic Agent Logo"
          className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-xl select-none pointer-events-none transition-transform hover:scale-105"
        />
      </div>

      <h2 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight">
        What do you want to create?
      </h2>
      <p className="text-[14px] text-white/60 mt-2.5 max-w-md leading-relaxed">
        Ask a question, describe an idea, or give me a topic. <span className="text-white font-medium">Frame Cinematic Agent</span> will research, script, plan, and compose vertical video.
      </p>
    </div>
  );
};
