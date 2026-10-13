import React, { useState, useEffect } from 'react';
import { ClassroomId, CLASSROOMS, LeaderboardEntry, RoundNumber } from '../types';
import { fetchLeaderboard } from '../lib/api';
import { useRealtime } from '../hooks/useRealtime';
import { COMPETITION_ROUNDS } from '../constants/competition';
import { WinnerPodium } from './WinnerPodium';
import { LiveBarChart } from './LiveBarChart';
import {
  Trophy,
  Maximize2,
  Minimize2,
  Sparkles,
  BarChart3,
  Table,
  Columns,
  RefreshCw,
  PlusCircle,
  SplitSquareVertical,
  Monitor,
  LayoutGrid,
} from 'lucide-react';

interface LeaderboardViewProps {
  initialRoom?: ClassroomId | 'overall';
  initialRound?: RoundNumber;
  navigate: (route: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  initialRoom = 'overall',
  initialRound,
  navigate,
}) => {
  const [currentRoom, setCurrentRoom] = useState<ClassroomId | 'overall'>(initialRoom);
  const [selectedRound, setSelectedRound] = useState<RoundNumber>(initialRound || 1);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomId>(
    initialRoom !== 'overall' ? initialRoom : 'K206'
  );

  // Data states
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [winnersPublished, setWinnersPublished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);

  // View states
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isDualWindow, setIsDualWindow] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [resRoom, resOverall] = await Promise.all([
        fetchLeaderboard(selectedClassroom, selectedRound),
        fetchLeaderboard('overall', selectedRound),
      ]);
      setClassLeaderboard(resRoom.leaderboard);
      setOverallLeaderboard(resOverall.leaderboard);
      setWinnersPublished(resOverall.winners_published);
    } catch (err) {
      console.error('Failed to load leaderboards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassroom, currentRoom, selectedRound]);

  // Real-time SSE updates listener
  const { connected } = useRealtime({
    onScoreUpdated: (data: unknown) => {
      const payload = data as { team_id?: string };
      if (payload?.team_id) {
        setHighlightedTeamId(payload.team_id);
        setTimeout(() => setHighlightedTeamId(null), 3000);
      }
      loadData();
    },
    onRoundChanged: () => {
      loadData();
    },
    onWinnersPublished: () => {
      loadData();
    },
    onRegistrationCreated: () => {
      loadData();
    },
    onTeamDeleted: () => {
      loadData();
    },
    onDatabaseReset: () => {
      loadData();
    },
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const currentRoundDef = COMPETITION_ROUNDS[selectedRound];
  const isGrandFinalRound = selectedRound === 4 && winnersPublished;

  // Active single-window leaderboard
  const singleLeaderboard = currentRoom === 'overall' ? overallLeaderboard : classLeaderboard;

  return (
    <div
      className={`min-h-screen ${
        isFullscreen ? 'p-6 sm:p-10 bg-[#FAF8F3] text-[#172536]' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#E9E3D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  connected ? 'bg-[#39836A]' : 'bg-[#C5A46D]'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  connected ? 'bg-[#39836A]' : 'bg-[#C5A46D]'
                }`}
              />
            </span>
            <span className="text-[10px] uppercase font-sans tracking-[0.25em] text-[#96723C] font-semibold">
              {connected ? 'LIVE COMPETITION FEED • REALTIME SYNC' : 'CONNECTING LIVE FEED...'}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#172536]">
            {isDualWindow
              ? `Dual Arena: Room ${selectedClassroom} & Overall Standings`
              : currentRoom === 'overall'
              ? 'Grand Overall Leaderboard'
              : `Classroom ${currentRoom} Leaderboard`}
          </h1>
          <p className="font-serif italic text-sm text-[#576474] mt-1">
            Visual Intelligence 2.0 • Where Creativity Meets Intelligence
          </p>
        </div>

        {/* Action Controls: Dual Window Toggle, View Mode, Projector Mode & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual Window Mode Button */}
          <button
            onClick={() => setIsDualWindow(!isDualWindow)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isDualWindow
                ? 'bg-[#96723C] text-white border border-[#C5A46D]'
                : 'bg-[#FFFDF8] border border-[#E9E3D8] text-[#172536] hover:border-[#C5A46D]'
            }`}
            title="Toggle Dual Split Screen Leaderboard (Classroom + Overall)"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{isDualWindow ? 'Dual Window ON' : 'Dual Window View'}</span>
          </button>

          {/* Chart vs Table Toggle */}
          <div className="flex rounded-xl bg-[#FFFDF8] p-1 border border-[#E9E3D8] shadow-xs">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                  : 'text-[#576474] hover:text-[#172536]'
              }`}
              title="Live Visual Bar Graph"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Chart</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                  : 'text-[#576474] hover:text-[#172536]'
              }`}
              title="Rankings Table"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh snapshot"
            className="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#E9E3D8] text-[#576474] hover:text-[#172536] transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-4 py-2.5 rounded-xl bg-[#FFFDF8] border border-[#C5A46D]/60 hover:border-[#C5A46D] text-xs font-bold uppercase tracking-wider text-[#172536] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-[#96723C]" />
            ) : (
              <Maximize2 className="w-4 h-4 text-[#96723C]" />
            )}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Display'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Bars: Round Switcher and Room Switcher */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {/* Room Selection */}
        {!isDualWindow ? (
          <div className="flex flex-wrap rounded-2xl bg-[#FFFDF8] p-1.5 border border-[#E9E3D8] shadow-xs">
            <button
              onClick={() => {
                setCurrentRoom('overall');
                navigate('/leaderboard/overall');
              }}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
                currentRoom === 'overall'
                  ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                  : 'text-[#576474] hover:text-[#172536] hover:bg-[#FAF8F3]'
              }`}
            >
              All Classrooms
            </button>

            {CLASSROOMS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setCurrentRoom(r);
                  setSelectedClassroom(r);
                  navigate(`/leaderboard/${r}`);
                }}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
                  currentRoom === r
                    ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                    : 'text-[#576474] hover:text-[#172536] hover:bg-[#FAF8F3]'
                }`}
              >
                Room {r}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#172536] uppercase tracking-wider">
              Classroom Side:
            </span>
            <div className="flex rounded-xl bg-[#FFFDF8] p-1 border border-[#E9E3D8]">
              {CLASSROOMS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedClassroom(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer ${
                    selectedClassroom === r
                      ? 'bg-[#172536] text-white'
                      : 'text-[#576474] hover:text-[#172536]'
                  }`}
                >
                  Room {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Round Switcher */}
        <div className="flex rounded-2xl bg-[#FFFDF8] p-1.5 border border-[#E9E3D8] shadow-xs">
          {([1, 2, 3, 4] as RoundNumber[]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRound(r)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer ${
                selectedRound === r
                  ? 'bg-[#96723C] text-[#FFFDF8] shadow-xs'
                  : 'text-[#576474] hover:text-[#172536]'
              }`}
            >
              Round {r}
            </button>
          ))}
        </div>
      </div>

      {/* Round Context Banner */}
      <div className="mt-6 p-5 rounded-2xl bg-[#FFFDF8] border border-[#E9E3D8] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold">
            CURRENT ROUND: {currentRoundDef.title}
          </span>
          <p className="text-xs text-[#576474] mt-0.5">{currentRoundDef.description}</p>
        </div>
        <div className="text-xs text-[#576474] font-medium">
          {selectedRound === 4
            ? 'Grand Final — 8 Finalists Ranked Overall'
            : isDualWindow
            ? `Viewing Classroom ${selectedClassroom} & Overall Top Contenders Side-by-Side`
            : currentRoom === 'overall'
            ? 'Overall Standings across all 4 Classrooms'
            : `Classroom ${currentRoom} • Top ${currentRoundDef.target_qualifiers_per_room} Qualify for Next Round`}
        </div>
      </div>

      {/* Winner Podium (If winners published & viewing final round) */}
      {isGrandFinalRound && (
        <div className="mt-10 mb-12">
          <WinnerPodium finalists={overallLeaderboard} />
        </div>
      )}

      {/* MAIN DISPLAY AREA */}
      {isDualWindow ? (
        /* DUAL WINDOW / SPLIT ARENA VIEW (CLASSROOM ON LEFT, OVERALL ON RIGHT) */
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT WINDOW: CLASSROOM LEADERBOARD */}
          <div className="bg-[#FFFDF8] rounded-3xl border border-[#E9E3D8] luxury-shadow overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#E9E3D8] flex items-center justify-between bg-[#FAF8F3]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#96723C]" />
                <h3 className="font-serif text-xl font-bold text-[#172536]">
                  Classroom {selectedClassroom} Standings
                </h3>
              </div>
              <span className="text-xs text-[#576474] font-mono">
                {classLeaderboard.length} Teams
              </span>
            </div>

            <div className="flex-1">
              {classLeaderboard.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#576474]">
                  No teams scored in Classroom {selectedClassroom} for Round {selectedRound}.
                </div>
              ) : viewMode === 'chart' ? (
                <LiveBarChart
                  entries={classLeaderboard}
                  maxMarks={25}
                  highlightedTeamId={highlightedTeamId}
                  isFullscreen={isFullscreen}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E9E3D8] bg-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-wider text-[#576474]">
                        <th className="py-3 px-4 text-center w-12">Rank</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E3D8]/80 text-xs font-sans">
                      {classLeaderboard.map((entry) => (
                        <tr key={entry.team_id} className="hover:bg-[#FAF8F3]/70">
                          <td className="py-3 px-4 text-center font-bold text-[#96723C]">
                            #{entry.rank}
                          </td>
                          <td className="py-3 px-4 font-serif font-bold text-sm text-[#172536]">
                            {entry.team_name}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm text-[#96723C]">
                            {entry.average_score !== null ? `${entry.average_score.toFixed(2)}` : 'In Progress'}
                          </td>
                          <td className="py-3 px-4 text-right text-[10px] font-bold text-[#39836A]">
                            {entry.qualification_status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT WINDOW: OVERALL STANDINGS (ALL CLASSROOMS) */}
          <div className="bg-[#FFFDF8] rounded-3xl border border-[#C5A46D]/60 luxury-shadow overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#E9E3D8] flex items-center justify-between bg-[#E8D4A7]/15">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A46D]" />
                <h3 className="font-serif text-xl font-bold text-[#172536]">
                  Grand Overall Standings (All Rooms)
                </h3>
              </div>
              <span className="text-xs text-[#576474] font-mono">
                {overallLeaderboard.length} Total Teams
              </span>
            </div>

            <div className="flex-1">
              {overallLeaderboard.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#576474]">
                  No teams scored in the competition yet for Round {selectedRound}.
                </div>
              ) : viewMode === 'chart' ? (
                <LiveBarChart
                  entries={overallLeaderboard}
                  maxMarks={25}
                  highlightedTeamId={highlightedTeamId}
                  isFullscreen={isFullscreen}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E9E3D8] bg-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-wider text-[#576474]">
                        <th className="py-3 px-4 text-center w-12">Rank</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4 text-center">Room</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9E3D8]/80 text-xs font-sans">
                      {overallLeaderboard.map((entry) => (
                        <tr key={entry.team_id} className="hover:bg-[#FAF8F3]/70">
                          <td className="py-3 px-4 text-center font-bold text-[#96723C]">
                            #{entry.rank}
                          </td>
                          <td className="py-3 px-4 font-serif font-bold text-sm text-[#172536]">
                            {entry.team_name}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs">
                            {entry.room_id}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-sm text-[#96723C]">
                            {entry.average_score !== null ? `${entry.average_score.toFixed(2)}` : 'In Progress'}
                          </td>
                          <td className="py-3 px-4 text-right text-[10px] font-bold text-[#39836A]">
                            {entry.qualification_status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE WINDOW VIEW */
        <div>
          {singleLeaderboard.length === 0 ? (
            <div className="mt-8 bg-[#FFFDF8] rounded-3xl border border-[#E9E3D8] luxury-shadow p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF8F3] border border-[#E9E3D8] flex items-center justify-center text-[#96723C] mb-4">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#172536] mb-2">
                Competition Ready for Student Registrations
              </h3>
              <p className="text-xs text-[#576474] max-w-md mx-auto mb-6">
                There are currently no teams scored for {currentRoom === 'overall' ? 'the competition' : `Classroom ${currentRoom}`}. As judges score teams, rankings and live visual charts will update automatically.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 rounded-full bg-[#172536] hover:bg-[#96723C] text-white text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register a Team</span>
              </button>
            </div>
          ) : viewMode === 'chart' ? (
            <div className="mt-8 bg-[#FFFDF8] rounded-3xl border border-[#E9E3D8] luxury-shadow overflow-hidden">
              <div className="p-6 border-b border-[#E9E3D8] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#172536]">
                    Live Visual Performance Chart
                  </h3>
                  <p className="text-xs text-[#576474] mt-0.5">
                    Real-time animated score progress • Maximum 25.00 Marks
                  </p>
                </div>
                <span className="text-xs text-[#576474] font-mono">
                  {singleLeaderboard.length} Competing
                </span>
              </div>

              <LiveBarChart
                entries={singleLeaderboard}
                maxMarks={25}
                highlightedTeamId={highlightedTeamId}
                isFullscreen={isFullscreen}
              />
            </div>
          ) : (
            <div className="mt-8 bg-[#FFFDF8] rounded-3xl border border-[#E9E3D8] luxury-shadow overflow-hidden">
              <div className="p-6 border-b border-[#E9E3D8] flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#172536]">
                    Official Competition Rankings Table
                  </h3>
                  <p className="text-xs text-[#576474] mt-0.5">
                    Detailed 3-Judge Scorecard Breakdown
                  </p>
                </div>
                <span className="text-xs text-[#576474] font-mono">
                  {singleLeaderboard.length} Teams
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E9E3D8] bg-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-wider text-[#576474]">
                      <th className="py-4 px-6 text-center w-16">Rank</th>
                      <th className="py-4 px-6">Team Name</th>
                      <th className="py-4 px-6 text-center">Classroom</th>
                      <th className="py-4 px-6 text-center">Round Score</th>
                      <th className="py-4 px-6 text-center">Judges Breakdown</th>
                      <th className="py-4 px-6 text-right">Qualification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9E3D8]/80 text-xs font-sans">
                    {singleLeaderboard.map((entry) => {
                      const isFirst = entry.rank === 1;
                      const isSecond = entry.rank === 2;
                      const isThird = entry.rank === 3;
                      const isHighlighted = highlightedTeamId === entry.team_id;

                      return (
                        <tr
                          key={entry.team_id}
                          className={`transition-colors duration-500 ${
                            isHighlighted ? 'bg-[#E8D4A7]/30' : 'hover:bg-[#FAF8F3]/70'
                          } ${isFirst ? 'bg-gradient-to-r from-[#FFFDF8] via-[#FAF8F3] to-[#FFFDF8]' : ''}`}
                        >
                          <td className="py-5 px-6 text-center">
                            <div
                              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-display font-bold text-xs ${
                                isFirst
                                  ? 'bg-gradient-to-tr from-[#96723C] to-[#C5A46D] text-white shadow-xs'
                                  : isSecond
                                  ? 'bg-[#E9E3D8] text-[#172536]'
                                  : isThird
                                  ? 'bg-[#E8D4A7]/50 text-[#96723C]'
                                  : 'text-[#576474]'
                              }`}
                            >
                              {entry.rank}
                            </div>
                          </td>

                          <td className="py-5 px-6">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-serif text-base sm:text-lg font-bold ${
                                  isFirst ? 'text-[#172536]' : 'text-[#172536]'
                                }`}
                              >
                                {entry.team_name}
                              </span>
                              {entry.winner_position && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#96723C] text-white">
                                  {entry.winner_position.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-5 px-6 text-center">
                            <span className="inline-block px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] font-display font-semibold text-xs text-[#172536]">
                              {entry.room_id}
                            </span>
                          </td>

                          <td className="py-5 px-6 text-center">
                            {entry.judging_complete && entry.average_score !== null ? (
                              <div className="font-serif font-bold text-xl text-[#96723C]">
                                {entry.average_score.toFixed(2)}
                                <span className="text-[10px] text-[#576474] font-normal ml-1">/ 25</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-[10px] font-semibold text-[#576474]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A46D] animate-pulse" />
                                <span>JUDGING IN PROGRESS</span>
                              </span>
                            )}
                          </td>

                          <td className="py-5 px-6 text-center">
                            {entry.score_details?.judge_totals ? (
                              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-[#576474]">
                                <span>{entry.score_details.judge_totals[0] ?? '—'}</span>
                                <span>•</span>
                                <span>{entry.score_details.judge_totals[1] ?? '—'}</span>
                                <span>•</span>
                                <span>{entry.score_details.judge_totals[2] ?? '—'}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#576474]/50">—</span>
                            )}
                          </td>

                          <td className="py-5 px-6 text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                entry.qualification_status === 'QUALIFIED' ||
                                entry.qualification_status === 'FINALIST' ||
                                entry.qualification_status === 'WINNER'
                                  ? 'bg-[#39836A]/10 text-[#39836A] border border-[#39836A]/20'
                                  : entry.qualification_status === 'ELIMINATED'
                                  ? 'bg-[#B75656]/10 text-[#B75656]'
                                  : 'bg-[#E8D4A7]/30 text-[#96723C]'
                              }`}
                            >
                              {entry.qualification_status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
