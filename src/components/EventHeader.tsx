import React from 'react';
import { Sparkles, Trophy, Users, Shield, Play } from 'lucide-react';

interface EventHeaderProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onReplayIntro?: () => void;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ currentRoute, navigate, onReplayIntro }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF8F3]/85 border-b border-[#E9E3D8]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Minimal Monogram / Event Mark */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg border border-[#C5A46D]/60 bg-gradient-to-br from-[#FFFDF8] to-[#FAF8F3] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <span className="font-display font-bold text-sm tracking-widest text-[#96723C]">
              VI<span className="text-[#172536]">2</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-tight tracking-wide text-[#172536] group-hover:text-[#96723C] transition-colors">
              VISUAL INTELLIGENCE 2.0
            </span>
            <span className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#576474]">
              AI/ML × ACM CHAPTER
            </span>
          </div>
        </div>

        {/* Center / Right: Live event indicator & Date */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#E9E3D8] bg-[#FFFDF8] text-xs text-[#576474]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39836A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39836A]"></span>
            </span>
            <span className="font-medium text-[#172536]">Live Competition</span>
            <span className="text-[#C5A46D]">•</span>
            <span>14 Oct 2026</span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate('/register')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentRoute === '/register'
                ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                : 'text-[#576474] hover:text-[#172536] hover:bg-[#FFFDF8]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span className="hidden sm:inline">Register</span>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentRoute.startsWith('/leaderboard')
                ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                : 'text-[#576474] hover:text-[#172536] hover:bg-[#FFFDF8]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              currentRoute.startsWith('/admin')
                ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                : 'text-[#576474] hover:text-[#172536] hover:bg-[#FFFDF8]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              title="Replay Cinematic Intro"
              className="p-1.5 rounded-full text-[#576474] hover:text-[#172536] hover:bg-[#FFFDF8] border border-transparent hover:border-[#E9E3D8] transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#C5A46D]" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
