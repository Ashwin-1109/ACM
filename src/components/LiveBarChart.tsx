import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Crown, Sparkles, Award } from 'lucide-react';

interface LiveBarChartProps {
  entries: LeaderboardEntry[];
  maxMarks?: number;
  highlightedTeamId?: string | null;
  isFullscreen?: boolean;
}

export const LiveBarChart: React.FC<LiveBarChartProps> = ({
  entries,
  maxMarks = 25,
  highlightedTeamId,
  isFullscreen = false,
}) => {
  if (entries.length === 0) {
    return (
      <div className="p-16 text-center text-xs text-[#576474]">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF8F3] border border-[#E9E3D8] flex items-center justify-center text-[#96723C] mb-3">
          <Trophy className="w-6 h-6" />
        </div>
        <p className="font-serif text-base font-bold text-[#172536] mb-1">
          No Registered Teams Scored Yet
        </p>
        <p className="text-xs text-[#576474]">
          As judges submit evaluation marks from the marking sheet, teams will rank here live on the dynamic chart.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-5">
      {/* Chart Axis Markers */}
      <div className="relative pt-2 pb-1 border-b border-[#E9E3D8]/80 text-[10px] font-mono text-[#576474] flex justify-between px-2">
        <span className="w-1/6 text-left">0 Pts</span>
        <span className="w-1/6 text-center">5 Pts</span>
        <span className="w-1/6 text-center">10 Pts</span>
        <span className="w-1/6 text-center">15 Pts</span>
        <span className="w-1/6 text-center">20 Pts</span>
        <span className="w-1/6 text-right">25 Pts (Max)</span>
      </div>

      {/* Dynamic Team Bars */}
      <div className="space-y-4">
        {entries.map((entry, index) => {
          const score = entry.average_score ?? 0;
          const percentage = Math.min(100, Math.max(0, (score / maxMarks) * 100));
          const isFirst = entry.rank === 1;
          const isSecond = entry.rank === 2;
          const isThird = entry.rank === 3;
          const isHighlighted = highlightedTeamId === entry.team_id;

          return (
            <div
              key={entry.team_id}
              className={`p-4 rounded-2xl border transition-all duration-700 ${
                isHighlighted
                  ? 'border-[#C5A46D] bg-[#E8D4A7]/25 shadow-md scale-[1.01]'
                  : isFirst
                  ? 'border-[#C5A46D]/60 bg-[#FFFDF8] shadow-xs'
                  : 'border-[#E9E3D8] bg-[#FAF8F3]/60 hover:bg-[#FFFDF8]'
              }`}
            >
              {/* Team Info Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs ${
                      isFirst
                        ? 'bg-gradient-to-tr from-[#96723C] to-[#C5A46D] text-white shadow-xs'
                        : isSecond
                        ? 'bg-[#E9E3D8] text-[#172536]'
                        : isThird
                        ? 'bg-[#E8D4A7]/50 text-[#96723C]'
                        : 'bg-[#FFFDF8] border border-[#E9E3D8] text-[#576474]'
                    }`}
                  >
                    {isFirst ? <Crown className="w-3.5 h-3.5" /> : entry.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-serif font-bold text-base sm:text-lg text-[#172536] ${
                          isFirst ? 'text-[#172536]' : ''
                        }`}
                      >
                        {entry.team_name}
                      </span>
                      <span className="text-[10px] font-mono text-[#96723C] bg-[#FFFDF8] px-2 py-0.5 rounded-md border border-[#E9E3D8]">
                        Room {entry.room_id}
                      </span>
                      {entry.winner_position && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#96723C] text-white flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{entry.winner_position.replace('_', ' ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score Readout */}
                <div className="text-right flex items-center gap-2">
                  {entry.judging_complete && entry.average_score !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-serif font-bold text-xl sm:text-2xl ${
                          isFirst ? 'gold-accent-text' : 'text-[#172536]'
                        }`}
                      >
                        {entry.average_score.toFixed(2)}
                      </span>
                      <span className="text-xs text-[#576474]">/ {maxMarks}</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-[10px] font-semibold text-[#576474]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A46D] animate-ping" />
                      <span>Judging in progress</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3.5 bg-[#FAF8F3] rounded-full overflow-hidden border border-[#E9E3D8] relative">
                {/* Background grid guide lines */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-30">
                  <div className="w-[1px] h-full bg-[#172536]/20" />
                  <div className="w-[1px] h-full bg-[#172536]/20" />
                  <div className="w-[1px] h-full bg-[#172536]/20" />
                  <div className="w-[1px] h-full bg-[#172536]/20" />
                  <div className="w-[1px] h-full bg-[#172536]/20" />
                </div>

                {/* Animated Growing Bar */}
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                    isFirst
                      ? 'bg-gradient-to-r from-[#96723C] via-[#C5A46D] to-[#E8D4A7]'
                      : isSecond
                      ? 'bg-gradient-to-r from-[#576474] via-[#94A3B8] to-[#CBD5E1]'
                      : isThird
                      ? 'bg-gradient-to-r from-[#96723C] via-[#B89354] to-[#E8D4A7]'
                      : 'bg-gradient-to-r from-[#576474] to-[#C5A46D]'
                  }`}
                  style={{
                    width: `${Math.max(percentage, entry.judging_complete ? 4 : 0)}%`,
                  }}
                >
                  {/* Subtle inner gold shimmer sweep */}
                  <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
                </div>
              </div>

              {/* Footer status & Judge spread indicators */}
              <div className="flex items-center justify-between text-[10px] text-[#576474] mt-2 px-1">
                <span>
                  Status:{' '}
                  <strong
                    className={
                      entry.qualification_status === 'QUALIFIED' ||
                      entry.qualification_status === 'FINALIST' ||
                      entry.qualification_status === 'WINNER'
                        ? 'text-[#39836A]'
                        : entry.qualification_status === 'ELIMINATED'
                        ? 'text-[#B75656]'
                        : 'text-[#96723C]'
                    }
                  >
                    {entry.qualification_status}
                  </strong>
                </span>

                {entry.score_details?.judge_totals && (
                  <span className="font-mono">
                    Judges:{' '}
                    {entry.score_details.judge_totals
                      .map((t) => (t !== null ? `${t}` : '—'))
                      .join(' | ')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
