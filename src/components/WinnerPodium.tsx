import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry } from '../types';
import { Award, Trophy, Crown, Sparkles } from 'lucide-react';

interface WinnerPodiumProps {
  finalists: LeaderboardEntry[];
  onClose?: () => void;
}

export const WinnerPodium: React.FC<WinnerPodiumProps> = ({ finalists, onClose }) => {
  const champion = finalists.find((f) => f.winner_position === 'CHAMPION') || finalists[0];
  const runnerUp = finalists.find((f) => f.winner_position === 'RUNNER_UP') || finalists[1];
  const secondRunnerUp = finalists.find((f) => f.winner_position === 'SECOND_RUNNER_UP') || finalists[2];

  useEffect(() => {
    // Launch tasteful celebratory gold and champagne confetti
    const end = Date.now() + 3 * 1000;
    const colors = ['#C5A46D', '#E8D4A7', '#96723C', '#FFFDF8'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="relative py-12 px-4 max-w-6xl mx-auto text-center">
      <div className="mb-12">
        <span className="text-xs uppercase font-sans tracking-[0.35em] text-[#96723C] font-semibold flex items-center justify-center gap-2">
          <Crown className="w-4 h-4" />
          <span>THE GRAND VICTORY CEREMONY</span>
        </span>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold text-[#172536] mt-2 mb-2">
          VISUAL INTELLIGENCE 2.0
        </h1>

        <p className="font-serif italic text-xl text-[#576474]">
          Celebrating Creativity, Intelligence & Innovation
        </p>

        <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-[#C5A46D] to-transparent mx-auto mt-4" />
      </div>

      {/* Podium Grid (2nd Place | 1st Place | 3rd Place) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-8">
        {/* 2nd Place: Runner-Up (Silver) */}
        <div className="order-2 md:order-1 bg-[#FFFDF8] rounded-3xl p-8 border border-[#E9E3D8] luxury-shadow relative flex flex-col justify-between md:h-[400px]">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#E9E3D8] text-[#576474] flex items-center justify-center font-display font-bold text-sm shadow-xs border border-[#FFFDF8]">
            2
          </div>

          <div className="pt-4">
            <span className="text-[10px] uppercase font-sans tracking-widest text-[#576474] font-bold block mb-1">
              RUNNER-UP
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#172536] mb-1">
              {runnerUp ? runnerUp.team_name : 'To be determined'}
            </h3>
            {runnerUp && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-semibold text-[#576474] mb-4">
                Room {runnerUp.room_id}
              </span>
            )}
          </div>

          <div className="pt-6 border-t border-[#E9E3D8]">
            <span className="text-[10px] uppercase font-sans text-[#576474] block">Final Round Score</span>
            <span className="font-serif text-3xl font-bold text-[#172536]">
              {runnerUp && runnerUp.average_score !== null ? `${runnerUp.average_score.toFixed(2)}` : '—'}
            </span>
            <span className="text-xs text-[#576474] block mt-0.5">/ 25.00</span>
          </div>
        </div>

        {/* 1st Place: Champion (Gold & Elevated) */}
        <div className="order-1 md:order-2 bg-[#FFFDF8] rounded-3xl p-8 sm:p-10 border-2 border-[#C5A46D] luxury-shadow relative flex flex-col justify-between md:h-[480px] shadow-xl md:-translate-y-6">
          {/* Crown badge */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-[#96723C] via-[#C5A46D] to-[#E8D4A7] text-white flex items-center justify-center shadow-md">
            <Crown className="w-7 h-7" />
          </div>

          <div className="pt-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8D4A7]/30 border border-[#C5A46D]/60 text-xs font-sans font-bold text-[#96723C] uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GRAND CHAMPION</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536] mb-2">
              {champion ? champion.team_name : 'To be determined'}
            </h2>

            {champion && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#FAF8F3] border border-[#C5A46D]/40 text-xs font-display font-bold text-[#96723C] mb-4">
                Classroom {champion.room_id}
              </span>
            )}
          </div>

          <div className="pt-6 border-t border-[#C5A46D]/40 bg-gradient-to-b from-transparent to-[#E8D4A7]/10 -mx-8 sm:-mx-10 -mb-8 sm:-mb-10 p-6 rounded-b-3xl">
            <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold block">
              Championship Final Score
            </span>
            <span className="font-serif text-4xl sm:text-5xl font-bold gold-accent-text">
              {champion && champion.average_score !== null ? `${champion.average_score.toFixed(2)}` : '—'}
            </span>
            <span className="text-xs text-[#576474] block mt-1">Maximum 25.00 Marks</span>
          </div>
        </div>

        {/* 3rd Place: Second Runner-Up (Bronze) */}
        <div className="order-3 bg-[#FFFDF8] rounded-3xl p-8 border border-[#E9E3D8] luxury-shadow relative flex flex-col justify-between md:h-[370px]">
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#FAF8F3] text-[#96723C] flex items-center justify-center font-display font-bold text-sm shadow-xs border border-[#E9E3D8]">
            3
          </div>

          <div className="pt-4">
            <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold block mb-1">
              SECOND RUNNER-UP
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#172536] mb-1">
              {secondRunnerUp ? secondRunnerUp.team_name : 'To be determined'}
            </h3>
            {secondRunnerUp && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-semibold text-[#576474] mb-4">
                Room {secondRunnerUp.room_id}
              </span>
            )}
          </div>

          <div className="pt-6 border-t border-[#E9E3D8]">
            <span className="text-[10px] uppercase font-sans text-[#576474] block">Final Round Score</span>
            <span className="font-serif text-3xl font-bold text-[#172536]">
              {secondRunnerUp && secondRunnerUp.average_score !== null ? `${secondRunnerUp.average_score.toFixed(2)}` : '—'}
            </span>
            <span className="text-xs text-[#576474] block mt-0.5">/ 25.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
