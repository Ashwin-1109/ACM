import React from 'react';
import { Users, Shield, Trophy, ArrowRight, Sparkles } from 'lucide-react';

interface HomePortalCardsProps {
  navigate: (route: string) => void;
  registeredCount: number;
  registrationLimit: number;
}

export const HomePortalCards: React.FC<HomePortalCardsProps> = ({
  navigate,
  registeredCount,
  registrationLimit,
}) => {
  return (
    <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
        {/* CARD 1 — REGISTER TEAM */}
        <div
          onClick={() => navigate('/register')}
          className="group relative bg-[#FFFDF8] rounded-2xl p-8 sm:p-10 border border-[#E9E3D8] hover:border-[#C5A46D]/70 transition-all duration-500 luxury-shadow hover:-translate-y-1.5 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          {/* Subtle gold hover glow in corner */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#E8D4A7]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

          <div>
            {/* Top Row: Eyebrow + Golden Numbering */}
            <div className="flex items-center justify-between mb-8">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-[#96723C] font-semibold">
                01 / PARTICIPATE
              </span>
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8] group-hover:border-[#C5A46D]/50 flex items-center justify-center text-[#96723C] transition-colors shadow-xs">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Decorative Gold Line */}
            <div className="w-10 h-[2px] bg-[#C5A46D] mb-6 group-hover:w-20 transition-all duration-500" />

            {/* Heading */}
            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536] mb-4 group-hover:text-[#96723C] transition-colors">
              Register Your Team
            </h3>

            {/* Description */}
            <p className="text-sm leading-relaxed text-[#576474] mb-6">
              Begin your creative intelligence journey. Join the competition and represent your classroom in Visual Intelligence 2.0.
            </p>

            {/* Capacity pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs text-[#576474] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39836A]" />
              <span>{registeredCount} / {registrationLimit} Teams Registered</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-[#E9E3D8]/80 flex items-center justify-between">
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#172536] group-hover:text-[#96723C] transition-colors">
              REGISTER TEAM
            </span>
            <div className="w-8 h-8 rounded-full border border-[#E9E3D8] group-hover:border-[#C5A46D] group-hover:bg-[#C5A46D] group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* CARD 2 — ADMIN PANEL */}
        <div
          onClick={() => navigate('/admin')}
          className="group relative bg-[#FFFDF8] rounded-2xl p-8 sm:p-10 border border-[#E9E3D8] hover:border-[#C5A46D]/70 transition-all duration-500 luxury-shadow hover:-translate-y-1.5 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#E8D4A7]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-8">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-[#96723C] font-semibold">
                02 / MANAGE
              </span>
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8] group-hover:border-[#C5A46D]/50 flex items-center justify-center text-[#96723C] transition-colors shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
            </div>

            <div className="w-10 h-[2px] bg-[#C5A46D] mb-6 group-hover:w-20 transition-all duration-500" />

            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536] mb-4 group-hover:text-[#96723C] transition-colors">
              Competition Control
            </h3>

            <p className="text-sm leading-relaxed text-[#576474] mb-6">
              Manage classrooms, judging, round progression, discrepancy reviews, and official competition results.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs text-[#576474] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A46D]" />
              <span>4 Classrooms • 3 Judges/Room</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E9E3D8]/80 flex items-center justify-between">
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#172536] group-hover:text-[#96723C] transition-colors">
              ENTER ADMIN PANEL
            </span>
            <div className="w-8 h-8 rounded-full border border-[#E9E3D8] group-hover:border-[#C5A46D] group-hover:bg-[#C5A46D] group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>

        {/* CARD 3 — LIVE LEADERBOARD */}
        <div
          onClick={() => navigate('/leaderboard')}
          className="group relative bg-[#FFFDF8] rounded-2xl p-8 sm:p-10 border border-[#E9E3D8] hover:border-[#C5A46D]/70 transition-all duration-500 luxury-shadow hover:-translate-y-1.5 cursor-pointer overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#E8D4A7]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-8">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-[#96723C] font-semibold">
                03 / EXPERIENCE
              </span>
              <div className="w-12 h-12 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8] group-hover:border-[#C5A46D]/50 flex items-center justify-center text-[#96723C] transition-colors shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="w-10 h-[2px] bg-[#C5A46D] mb-6 group-hover:w-20 transition-all duration-500" />

            <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536] mb-4 group-hover:text-[#96723C] transition-colors">
              Live Leaderboard
            </h3>

            <p className="text-sm leading-relaxed text-[#576474] mb-6">
              Watch the rankings unfold across classrooms in real-time as the four competition rounds progress.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs text-[#576474] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39836A] animate-pulse" />
              <span>Projector Ready • Real-Time SSE</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E9E3D8]/80 flex items-center justify-between">
            <span className="font-sans font-bold text-xs uppercase tracking-widest text-[#172536] group-hover:text-[#96723C] transition-colors">
              VIEW LIVE RANKINGS
            </span>
            <div className="w-8 h-8 rounded-full border border-[#E9E3D8] group-hover:border-[#C5A46D] group-hover:bg-[#C5A46D] group-hover:text-white flex items-center justify-center transition-all">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
