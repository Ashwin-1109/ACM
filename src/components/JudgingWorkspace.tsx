import React, { useState, useEffect } from 'react';
import { ClassroomId, JudgeScore, RoundNumber, RoundResult, Team } from '../types';
import { COMPETITION_ROUNDS, calculateRound2SpeedMarks } from '../constants/competition';
import { approveReviewDiscrepancy, saveJudgeScoreApi } from '../lib/api';
import {
  Shield,
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';

interface JudgingWorkspaceProps {
  roomId: ClassroomId;
  team: Team;
  initialRound: RoundNumber;
  roundResult?: RoundResult | null;
  onClose: () => void;
  onSaved: () => void;
}

export const JudgingWorkspace: React.FC<JudgingWorkspaceProps> = ({
  roomId,
  team,
  initialRound,
  roundResult,
  onClose,
  onSaved,
}) => {
  const [selectedRound, setSelectedRound] = useState<RoundNumber>(initialRound);
  const [activeJudge, setActiveJudge] = useState<1 | 2 | 3>(1);

  // Form states
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>({});
  const [judgeNotes, setJudgeNotes] = useState<string>('');
  const [solveTimeMinutes, setSolveTimeMinutes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review discrepancy approval state
  const [approvingReview, setApprovingReview] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const currentRoundDef = COMPETITION_ROUNDS[selectedRound];

  // Load existing score when active judge or round changes
  useEffect(() => {
    setSaveSuccess(false);
    setError(null);

    const scores = roundResult?.judge_scores;
    const currentJudgeScore: JudgeScore | undefined =
      activeJudge === 1
        ? scores?.judge_1
        : activeJudge === 2
        ? scores?.judge_2
        : scores?.judge_3;

    if (currentJudgeScore) {
      setCriterionScores({ ...currentJudgeScore.criterion_scores });
      setJudgeNotes(currentJudgeScore.judge_notes || '');
    } else {
      // Default to 0 for all criteria
      const initial: Record<string, number> = {};
      currentRoundDef.criteria.forEach((c) => {
        initial[c.id] = 0;
      });
      setCriterionScores(initial);
      setJudgeNotes('');
    }
  }, [activeJudge, selectedRound, roundResult, currentRoundDef]);

  // Compute live judge total
  const liveSpeedMarks =
    selectedRound === 2 ? calculateRound2SpeedMarks(parseFloat(solveTimeMinutes) || undefined) : 0;

  const currentJudgeTotal = currentRoundDef.criteria.reduce((sum, crit) => {
    if (crit.id === 'speed' && selectedRound === 2) {
      return sum + liveSpeedMarks;
    }
    return sum + (criterionScores[crit.id] || 0);
  }, 0);

  const handleScoreChange = (critId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, Math.round(value)));
    setCriterionScores((prev) => ({
      ...prev,
      [critId]: clamped,
    }));
  };

  const handleSaveMarks = async () => {
    setError(null);
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload: {
        team_id: string;
        round_number: RoundNumber;
        judge_number: 1 | 2 | 3;
        criterion_scores: Record<string, number>;
        judge_notes?: string;
        solve_time_minutes?: number;
      } = {
        team_id: team.id,
        round_number: selectedRound,
        judge_number: activeJudge,
        criterion_scores: { ...criterionScores },
        judge_notes: judgeNotes,
      };

      if (selectedRound === 2 && solveTimeMinutes !== '') {
        const timeVal = parseFloat(solveTimeMinutes);
        if (!isNaN(timeVal)) {
          payload.solve_time_minutes = timeVal;
        }
      }

      await saveJudgeScoreApi(payload);
      setSaveSuccess(true);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save judge score.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveDiscrepancy = async () => {
    setApprovingReview(true);
    try {
      await approveReviewDiscrepancy({
        team_id: team.id,
        round_number: selectedRound,
        notes: reviewNotes || 'Acknowledged and approved by Room Lead.',
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setApprovingReview(false);
    }
  };

  // Discrepancy warning check
  const totals = roundResult?.judge_totals || [null, null, null];
  const j1 = totals[0];
  const j2 = totals[1];
  const j3 = totals[2];
  const allJudged = j1 !== null && j2 !== null && j3 !== null;
  const discrepancy = allJudged ? Math.max(j1!, j2!, j3!) - Math.min(j1!, j2!, j3!) : 0;
  const reviewRequired = discrepancy > 3;

  return (
    <div className="bg-[#FFFDF8] rounded-3xl border border-[#E9E3D8] luxury-shadow p-6 sm:p-10 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E9E3D8] gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#FAF8F3] hover:bg-[#E9E3D8]/50 text-[#576474] hover:text-[#172536] transition-colors cursor-pointer"
            aria-label="Back to classroom list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold">
                JUDGING WORKSPACE • ROOM {roomId}
              </span>
              <span className="text-xs text-[#576474]">•</span>
              <span className="text-xs font-mono text-[#576474]">{team.registration_code}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#172536]">
              {team.team_name}
            </h2>
          </div>
        </div>

        {/* Round Switcher Tabs */}
        <div className="flex rounded-xl bg-[#FAF8F3] p-1 border border-[#E9E3D8]">
          {([1, 2, 3, 4] as RoundNumber[]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRound(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer ${
                selectedRound === r
                  ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                  : 'text-[#576474] hover:text-[#172536]'
              }`}
            >
              R{r}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancy Alert Banner */}
      {reviewRequired && (
        <div className="mt-6 p-4 rounded-2xl bg-[#B75656]/10 border border-[#B75656]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B75656] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#B75656]">
                JUDGE REVIEW REQUIRED — Disagreement Exceeds 3 Marks (Spread: {discrepancy} pts)
              </h4>
              <p className="text-xs text-[#576474] mt-0.5">
                The highest and lowest judge marks diverge by more than 3 marks. Room Lead consultation and sign-off required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {roundResult?.review_approved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#39836A] font-bold bg-[#39836A]/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span>Review Approved by Lead</span>
              </span>
            ) : (
              <button
                onClick={handleApproveDiscrepancy}
                disabled={approvingReview}
                className="px-4 py-2 rounded-xl bg-[#B75656] hover:bg-[#964242] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {approvingReview ? 'Approving...' : 'Acknowledge & Approve'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Three Judge Summary Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF8F3] border border-[#E9E3D8]">
        <div className="p-3 bg-[#FFFDF8] rounded-xl border border-[#E9E3D8]">
          <span className="text-[10px] uppercase font-sans tracking-wider text-[#576474] block">Judge 1</span>
          <span className="font-serif text-xl font-bold text-[#172536]">
            {j1 !== null ? `${j1} / 25` : 'Pending'}
          </span>
        </div>
        <div className="p-3 bg-[#FFFDF8] rounded-xl border border-[#E9E3D8]">
          <span className="text-[10px] uppercase font-sans tracking-wider text-[#576474] block">Judge 2</span>
          <span className="font-serif text-xl font-bold text-[#172536]">
            {j2 !== null ? `${j2} / 25` : 'Pending'}
          </span>
        </div>
        <div className="p-3 bg-[#FFFDF8] rounded-xl border border-[#E9E3D8]">
          <span className="text-[10px] uppercase font-sans tracking-wider text-[#576474] block">Judge 3</span>
          <span className="font-serif text-xl font-bold text-[#172536]">
            {j3 !== null ? `${j3} / 25` : 'Pending'}
          </span>
        </div>
        <div className="p-3 bg-[#FFFDF8] rounded-xl border border-[#C5A46D]/50 bg-gradient-to-br from-[#FFFDF8] to-[#FAF8F3]">
          <span className="text-[10px] uppercase font-sans tracking-wider text-[#96723C] font-bold block">
            Final Round Average
          </span>
          <span className="font-serif text-xl font-bold text-[#172536]">
            {allJudged && roundResult && roundResult.average_score !== null
              ? `${roundResult.average_score.toFixed(2)} / 25`
              : 'Awaiting All Judges'}
          </span>
        </div>
      </div>

      {/* Judge Selector Tabs */}
      <div className="mt-8 flex border-b border-[#E9E3D8]">
        {([1, 2, 3] as const).map((num) => (
          <button
            key={num}
            onClick={() => setActiveJudge(num)}
            className={`px-6 py-3 text-xs font-sans font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeJudge === num
                ? 'border-[#96723C] text-[#172536] bg-[#FFFDF8]'
                : 'border-transparent text-[#576474] hover:text-[#172536]'
            }`}
          >
            Judge {num} Evaluation
          </button>
        ))}
      </div>

      {/* Scoring Form Area */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#172536]">
              {currentRoundDef.title}
            </h3>
            <p className="text-xs text-[#576474]">{currentRoundDef.description}</p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#C5A46D]/40 text-right">
            <span className="text-[10px] uppercase text-[#576474] tracking-wider block">
              Current Judge Total
            </span>
            <span className="font-serif text-2xl font-bold text-[#96723C]">
              {currentJudgeTotal} <span className="text-xs text-[#576474]">/ {currentRoundDef.max_marks}</span>
            </span>
          </div>
        </div>

        {/* Special Round 2 Solve-Time Speed Marks */}
        {selectedRound === 2 && (
          <div className="p-5 rounded-2xl bg-[#E8D4A7]/15 border border-[#C5A46D]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>OFFICIAL ROUND 2 SPEED CLOCK</span>
                </span>
                <h4 className="font-serif text-lg font-bold text-[#172536] mt-0.5">
                  Actual Solve Time (Minutes)
                </h4>
                <p className="text-xs text-[#576474]">
                  Bracket: &le;8m = 7pts | 8–12m = 5pts | 12–16m = 3pts | 16–20m = 1pt | &gt;20m = 0pts
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="120"
                  value={solveTimeMinutes}
                  onChange={(e) => setSolveTimeMinutes(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-24 px-3 py-2 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] text-sm font-mono font-bold text-[#172536] focus:border-[#C5A46D] focus:outline-none"
                />
                <div className="px-3 py-2 rounded-xl bg-[#FFFDF8] border border-[#C5A46D]/40 text-xs font-bold text-[#96723C]">
                  +{liveSpeedMarks} Speed Marks
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Criteria Sliders / Steppers */}
        <div className="space-y-4">
          {currentRoundDef.criteria.map((crit) => {
            const isSpeedCrit = crit.id === 'speed' && selectedRound === 2;
            const currentVal = isSpeedCrit ? liveSpeedMarks : criterionScores[crit.id] || 0;

            return (
              <div
                key={crit.id}
                className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E9E3D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="max-w-md">
                  <div className="flex items-center gap-2">
                    <h5 className="font-sans font-bold text-sm text-[#172536]">{crit.name}</h5>
                    <span className="text-[10px] font-mono text-[#96723C] bg-[#FFFDF8] px-2 py-0.5 rounded-md border border-[#E9E3D8]">
                      Max: {crit.max}
                    </span>
                  </div>
                  <p className="text-xs text-[#576474] mt-1">{crit.description}</p>
                </div>

                {/* Score Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  {isSpeedCrit ? (
                    <span className="px-4 py-2 rounded-xl bg-[#FFFDF8] border border-[#E9E3D8] text-sm font-bold text-[#96723C]">
                      {currentVal} / {crit.max} (Calculated)
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleScoreChange(crit.id, currentVal - 1, crit.max)}
                        className="w-9 h-9 rounded-xl bg-[#FFFDF8] border border-[#E9E3D8] text-[#172536] font-bold text-sm hover:border-[#C5A46D] transition-colors cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        max={crit.max}
                        value={currentVal}
                        onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value, 10) || 0, crit.max)}
                        className="w-14 text-center py-2 rounded-xl bg-[#FFFDF8] border border-[#E9E3D8] font-mono font-bold text-base text-[#172536] focus:border-[#C5A46D] focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleScoreChange(crit.id, currentVal + 1, crit.max)}
                        className="w-9 h-9 rounded-xl bg-[#FFFDF8] border border-[#E9E3D8] text-[#172536] font-bold text-sm hover:border-[#C5A46D] transition-colors cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Judge Notes */}
        <div>
          <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-2">
            Judge {activeJudge} Evaluation Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={judgeNotes}
            onChange={(e) => setJudgeNotes(e.target.value)}
            placeholder="Feedback on prompts, execution nuances, or tie-break observations..."
            className="w-full px-4 py-3 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none text-xs text-[#172536]"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#B75656]/10 border border-[#B75656]/30 text-[#B75656] text-xs">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 border-t border-[#E9E3D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#576474]">
            {saveSuccess && (
              <span className="text-[#39836A] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Judge {activeJudge} marks saved to database!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-6 py-3 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-bold uppercase tracking-wider text-[#172536] hover:bg-[#FFFDF8] cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSaveMarks}
              disabled={saving}
              className="w-1/2 sm:w-auto px-8 py-3 rounded-full bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING MARKS...' : `SAVE JUDGE ${activeJudge} MARKS`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
