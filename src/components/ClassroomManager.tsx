import React, { useState, useEffect } from 'react';
import { ClassroomId, RoundNumber, RoundResult, Team } from '../types';
import { advanceRoomRoundApi, fetchAdminTeams, fetchClassroomDetails, deleteTeamApi } from '../lib/api';
import { COMPETITION_ROUNDS } from '../constants/competition';
import { JudgingWorkspace } from './JudgingWorkspace';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Award,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface ClassroomManagerProps {
  roomId: ClassroomId;
  navigate: (route: string) => void;
}

export const ClassroomManager: React.FC<ClassroomManagerProps> = ({ roomId, navigate }) => {
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<RoundNumber>(1);
  const [roomState, setRoomState] = useState<{ active_round: RoundNumber; round_status: string } | null>(null);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected team for judging
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Round advancement modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [qualifierSelections, setQualifierSelections] = useState<string[]>([]);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const loadRoomData = async () => {
    try {
      const details = await fetchClassroomDetails(roomId, selectedRound);
      setRoomState(details.room_state);
      setResults(details.results);

      const teamList = await fetchAdminTeams(roomId);
      setTeams(teamList.teams);
    } catch (err) {
      console.error('Failed to load room details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomData();
  }, [roomId, selectedRound]);

  // When opening advance modal, auto-select top targets according to rubric
  const handleOpenAdvance = () => {
    const targetCount = COMPETITION_ROUNDS[selectedRound].target_qualifiers_per_room;
    // Auto pick top teams with completed scores
    const topTeamIds = results
      .slice(0, targetCount)
      .map((r) => r.team_id);
    setQualifierSelections(topTeamIds);
    setAdvanceError(null);
    setShowAdvanceModal(true);
  };

  const handleToggleQualifier = (teamId: string) => {
    if (qualifierSelections.includes(teamId)) {
      setQualifierSelections(qualifierSelections.filter((id) => id !== teamId));
    } else {
      setQualifierSelections([...qualifierSelections, teamId]);
    }
  };

  const handleConfirmAdvance = async () => {
    setAdvancing(true);
    setAdvanceError(null);
    try {
      await advanceRoomRoundApi({
        room_id: roomId,
        current_round: selectedRound,
        qualifier_team_ids: qualifierSelections,
      });
      setShowAdvanceModal(false);
      // Advance view to next round if available
      if (selectedRound < 4) {
        setSelectedRound((selectedRound + 1) as RoundNumber);
      }
      loadRoomData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to advance round.';
      setAdvanceError(msg);
    } finally {
      setAdvancing(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete team "${teamName}"? All scores and submissions for this team will be removed.`
    );
    if (!confirmed) return;

    try {
      await deleteTeamApi(teamId);
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
      }
      loadRoomData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete team.');
    }
  };

  const filteredResults = results.filter((r) =>
    r.team_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const targetQualifiers = COMPETITION_ROUNDS[selectedRound].target_qualifiers_per_room;
  const judgedCount = results.filter((r) => r.judging_complete).length;
  const eligibleCount = results.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E9E3D8] gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2.5 rounded-xl bg-[#FFFDF8] border border-[#E9E3D8] hover:border-[#C5A46D]/60 text-[#576474] hover:text-[#172536] transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold">
                CLASSROOM ARENA
              </span>
              <span className="text-xs text-[#576474]">•</span>
              <span className="text-xs text-[#576474]">Room Lead Evaluation</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#172536]">
              Classroom {roomId} Management
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate(`/leaderboard/${roomId}`)}
            className="px-4 py-2 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] hover:border-[#C5A46D] text-xs font-semibold text-[#172536] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Public Leaderboard</span>
          </button>

          {selectedRound < 4 && (
            <button
              onClick={handleOpenAdvance}
              disabled={results.length === 0}
              className="px-5 py-2 rounded-xl bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>Advance to Round {selectedRound + 1}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Round Selection Tabs */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex rounded-2xl bg-[#FFFDF8] p-1.5 border border-[#E9E3D8] shadow-xs">
          {([1, 2, 3, 4] as RoundNumber[]).map((r) => {
            const isSelected = selectedRound === r;
            const rDef = COMPETITION_ROUNDS[r];
            return (
              <button
                key={r}
                onClick={() => {
                  setSelectedRound(r);
                  setSelectedTeam(null);
                }}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs font-display font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                    : 'text-[#576474] hover:text-[#172536] hover:bg-[#FAF8F3]'
                }`}
              >
                <span>Round {r}</span>
                <span className="hidden md:inline text-[10px] opacity-75">
                  ({r === 1 ? 'All' : r === 2 ? 'Top 7' : r === 3 ? 'Top 4' : '2 Finalists'})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#576474]" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] text-xs focus:border-[#C5A46D] focus:outline-none"
          />
        </div>
      </div>

      {/* Round Context Banner */}
      <div className="mt-6 p-5 rounded-2xl bg-[#FFFDF8] border border-[#E9E3D8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold">
            {COMPETITION_ROUNDS[selectedRound].title}
          </span>
          <h3 className="font-serif text-lg font-bold text-[#172536] mt-0.5">
            {COMPETITION_ROUNDS[selectedRound].subtitle}
          </h3>
          <p className="text-xs text-[#576474]">
            {selectedRound < 4
              ? `Top ${targetQualifiers} teams from this room advance to Round ${selectedRound + 1}.`
              : 'The top 2 teams from this room represent Room ' + roomId + ' in the 8-finalist Grand Arena.'}
          </p>
        </div>

        <div className="flex items-center gap-4 text-center shrink-0">
          <div className="px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8]">
            <span className="text-[10px] uppercase text-[#576474] block">Eligible</span>
            <span className="font-serif text-lg font-bold text-[#172536]">{eligibleCount}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8]">
            <span className="text-[10px] uppercase text-[#576474] block">Judged</span>
            <span className="font-serif text-lg font-bold text-[#96723C]">{judgedCount}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8]">
            <span className="text-[10px] uppercase text-[#576474] block">Qualifying Target</span>
            <span className="font-serif text-lg font-bold text-[#39836A]">{targetQualifiers || 2}</span>
          </div>
        </div>
      </div>

      {/* If a team is selected for judging, display Judging Workspace */}
      {selectedTeam && (
        <div className="mt-8">
          <JudgingWorkspace
            roomId={roomId}
            team={selectedTeam}
            initialRound={selectedRound}
            roundResult={results.find((r) => r.team_id === selectedTeam.id)}
            onClose={() => setSelectedTeam(null)}
            onSaved={loadRoomData}
          />
        </div>
      )}

      {/* Teams Scoring Table */}
      <div className="mt-8 bg-[#FFFDF8] rounded-3xl border border-[#E9E3D8] luxury-shadow overflow-hidden">
        <div className="p-6 border-b border-[#E9E3D8] flex items-center justify-between">
          <h4 className="font-serif text-xl font-bold text-[#172536]">
            Round {selectedRound} Competing Teams ({filteredResults.length})
          </h4>
          <span className="text-xs text-[#576474]">
            Click "Marking Sheet" to enter Judge 1, 2, and 3 evaluations
          </span>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#576474]">
            <p className="font-serif text-lg font-bold text-[#172536] mb-1">
              No Teams Registered Yet for Classroom {roomId}
            </p>
            <p className="max-w-md mx-auto mb-5 text-xs text-[#576474]">
              {selectedRound === 1
                ? `Student teams registered for Classroom ${roomId} will appear here automatically for Round 1 judging.`
                : `No teams have advanced to Round ${selectedRound} in this room yet. Complete Round ${selectedRound - 1} judging and advance qualifiers.`}
            </p>
            {selectedRound === 1 && (
              <button
                onClick={() => navigate('/register')}
                className="px-5 py-2.5 rounded-full bg-[#172536] hover:bg-[#96723C] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Go to Team Registration
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E9E3D8] bg-[#FAF8F3] text-[10px] font-sans font-bold uppercase tracking-wider text-[#576474]">
                  <th className="py-4 px-6">Rank</th>
                  <th className="py-4 px-6">Team</th>
                  <th className="py-4 px-6 text-center">Judge 1</th>
                  <th className="py-4 px-6 text-center">Judge 2</th>
                  <th className="py-4 px-6 text-center">Judge 3</th>
                  <th className="py-4 px-6 text-center">Average Score</th>
                  <th className="py-4 px-6 text-center">Discrepancy</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E3D8]/80 text-xs font-sans">
                {filteredResults.map((result, idx) => {
                  const teamObj = teams.find((t) => t.id === result.team_id);
                  const isTopCutoff = idx < targetQualifiers;
                  const isDiscrepant = result.review_required && !result.review_approved;

                  return (
                    <tr
                      key={result.team_id}
                      className={`hover:bg-[#FAF8F3]/60 transition-colors ${
                        isTopCutoff ? 'bg-[#FFFDF8]' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-[#96723C]">
                        #{result.rank || idx + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-serif font-bold text-sm text-[#172536]">
                          {result.team_name}
                        </div>
                        <div className="text-[10px] text-[#576474] font-mono">
                          {teamObj?.registration_code || result.team_id}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-mono">
                        {result.judge_totals[0] !== null ? (
                          <span className="font-semibold text-[#172536]">{result.judge_totals[0]}/25</span>
                        ) : (
                          <span className="text-[#576474]/50">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-mono">
                        {result.judge_totals[1] !== null ? (
                          <span className="font-semibold text-[#172536]">{result.judge_totals[1]}/25</span>
                        ) : (
                          <span className="text-[#576474]/50">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-mono">
                        {result.judge_totals[2] !== null ? (
                          <span className="font-semibold text-[#172536]">{result.judge_totals[2]}/25</span>
                        ) : (
                          <span className="text-[#576474]/50">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {result.average_score !== null ? (
                          <span className="font-serif font-bold text-sm text-[#96723C]">
                            {result.average_score.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#576474] italic">In Progress</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isDiscrepant ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#B75656] font-bold bg-[#B75656]/10 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Spread &gt; 3</span>
                          </span>
                        ) : result.review_required && result.review_approved ? (
                          <span className="text-[10px] text-[#39836A] font-medium">Approved</span>
                        ) : (
                          <span className="text-[#576474]/40 text-[10px]">OK</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            result.qualification_status === 'QUALIFIED' ||
                            result.qualification_status === 'FINALIST' ||
                            result.qualification_status === 'WINNER'
                              ? 'bg-[#39836A]/10 text-[#39836A]'
                              : result.qualification_status === 'ELIMINATED'
                              ? 'bg-[#B75656]/10 text-[#B75656]'
                              : 'bg-[#E8D4A7]/30 text-[#96723C]'
                          }`}
                        >
                          {result.qualification_status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              if (teamObj) setSelectedTeam(teamObj);
                            }}
                            className="px-3.5 py-1.5 rounded-lg border border-[#E9E3D8] hover:border-[#C5A46D] bg-[#FFFDF8] text-xs font-semibold text-[#172536] hover:text-[#96723C] transition-all cursor-pointer shadow-xs"
                          >
                            Marking Sheet
                          </button>

                          <button
                            onClick={() => handleDeleteTeam(result.team_id, result.team_name)}
                            title="Delete Team"
                            className="p-1.5 rounded-lg border border-[#B75656]/30 text-[#B75656] hover:bg-[#B75656]/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advancement & Qualifier Confirmation Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172536]/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFDF8] rounded-3xl p-8 max-w-xl w-full border border-[#E9E3D8] luxury-shadow">
            <h3 className="font-serif text-2xl font-bold text-[#172536] mb-1">
              Advance Classroom {roomId} to Round {selectedRound + 1}
            </h3>
            <p className="text-xs text-[#576474] mb-4">
              Confirm official qualifying teams based on Round {selectedRound} evaluation. Selected teams ({qualifierSelections.length} / {targetQualifiers} target) will advance.
            </p>

            {advanceError && (
              <div className="mb-4 p-3 rounded-xl bg-[#B75656]/10 border border-[#B75656]/30 text-[#B75656] text-xs">
                {advanceError}
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2 mb-6 pr-2">
              {results.map((r, i) => {
                const isSelected = qualifierSelections.includes(r.team_id);
                return (
                  <label
                    key={r.team_id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#C5A46D] bg-[#E8D4A7]/15'
                        : 'border-[#E9E3D8] bg-[#FAF8F3] hover:bg-[#FFFDF8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleQualifier(r.team_id)}
                        className="rounded border-[#C5A46D] text-[#96723C] focus:ring-0"
                      />
                      <div>
                        <span className="font-serif font-bold text-sm text-[#172536]">
                          #{i + 1} {r.team_name}
                        </span>
                        <div className="text-[10px] text-[#576474]">
                          Avg: {r.average_score !== null ? `${r.average_score.toFixed(2)}/25` : 'Incomplete'}
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold font-mono text-[#96723C]">
                      {isSelected ? 'QUALIFIES' : 'ELIMINATES'}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E9E3D8] flex items-center justify-between">
              <button
                onClick={() => setShowAdvanceModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-bold text-[#172536] hover:bg-[#FFFDF8] cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmAdvance}
                disabled={advancing || qualifierSelections.length === 0}
                className="px-6 py-2.5 rounded-full bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {advancing ? 'ADVANCING...' : 'CONFIRM & ADVANCE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
