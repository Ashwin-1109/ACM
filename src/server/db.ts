import fs from 'fs';
import path from 'path';
import {
  AdminAuditEntry,
  ClassroomId,
  CLASSROOMS,
  EventSettings,
  JudgeScore,
  LeaderboardEntry,
  QualificationStatus,
  RegistrationRequest,
  RoomRoundState,
  RoundAttempt,
  RoundNumber,
  RoundResult,
  Team,
} from '../types';
import { calculateRound2SpeedMarks, COMPETITION_ROUNDS } from '../constants/competition';
import { serverSupabase } from './auth.js';

interface DatabaseSchema {
  settings: EventSettings;
  room_states: Record<ClassroomId, RoomRoundState>;
  teams: Team[];
  judge_scores: JudgeScore[];
  round_attempts: RoundAttempt[];
  review_approvals: Record<string, { approved: boolean; notes?: string }>;
  qualifications: Record<string, QualificationStatus>; // key: `${team_id}_${round_number}`
  audit_logs: AdminAuditEntry[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'competition_db.json');

function getInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    settings: {
      id: 'settings_main',
      registration_open: true,
      registration_limit: 100,
      event_title: 'VISUAL INTELLIGENCE 2.0',
      event_date: '2026-10-14',
      global_active_round: 1,
      winners_published: false,
      updated_at: now,
    },
    room_states: {
      K206: { room_id: 'K206', active_round: 1, round_status: 'IN_PROGRESS', updated_at: now },
      K207: { room_id: 'K207', active_round: 1, round_status: 'IN_PROGRESS', updated_at: now },
      K208: { room_id: 'K208', active_round: 1, round_status: 'IN_PROGRESS', updated_at: now },
      K209: { room_id: 'K209', active_round: 1, round_status: 'IN_PROGRESS', updated_at: now },
    },
    teams: [],
    judge_scores: [],
    round_attempts: [],
    review_approvals: {},
    qualifications: {},
    audit_logs: [],
  };
}

class DatabaseStore {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.data = getInitialDatabase();

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.persist();
      }
    } catch {
      // In read-only environments (e.g. Vercel serverless /var/task), rely on in-memory & Supabase
      this.data = getInitialDatabase();
    }

    this.initSupabaseSync();
  }

  private async initSupabaseSync() {
    if (!serverSupabase) return;
    try {
      const [teamsRes, settingsRes, roomsRes] = await Promise.all([
        serverSupabase.from('teams').select('*'),
        serverSupabase.from('event_settings').select('*').eq('id', 'settings_main').maybeSingle(),
        serverSupabase.from('room_round_state').select('*'),
      ]);

      if (teamsRes.data && Array.isArray(teamsRes.data) && teamsRes.data.length > 0) {
        const sbTeams: Team[] = teamsRes.data.map((row) => ({
          id: row.id,
          registration_code: row.registration_code,
          room_id: row.room_id as ClassroomId,
          team_name: row.team_name,
          normalized_team_name: row.normalized_team_name || row.team_name.toLowerCase(),
          leader_name: row.leader_name,
          member_names: row.member_names || [],
          created_at: row.created_at,
        }));
        this.data.teams = sbTeams;
      }

      if (settingsRes.data) {
        this.data.settings = { ...this.data.settings, ...settingsRes.data };
      }

      if (roomsRes.data && Array.isArray(roomsRes.data)) {
        for (const row of roomsRes.data) {
          if (row.room_id && this.data.room_states[row.room_id as ClassroomId]) {
            this.data.room_states[row.room_id as ClassroomId] = {
              room_id: row.room_id as ClassroomId,
              active_round: row.active_round,
              round_status: row.round_status,
              updated_at: row.updated_at,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase Sync] Hydration skipped or encountered error:', err);
    }
  }

  public persist() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      // In read-only serverless filesystems, disk persist is skipped safely
    } finally {
      this.isSaving = false;
    }
  }

  // --- Settings ---
  public getSettings(): EventSettings {
    return { ...this.data.settings };
  }

  public updateSettings(partial: Partial<EventSettings>, auditDetail?: string): EventSettings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    if (auditDetail) {
      this.logAudit('UPDATE_SETTINGS', 'settings', this.data.settings.id, auditDetail);
    }
    this.persist();
    return this.getSettings();
  }

  // --- Rooms ---
  public getRoomStates(): Record<ClassroomId, RoomRoundState> {
    return { ...this.data.room_states };
  }

  public getRoomState(roomId: ClassroomId): RoomRoundState {
    return (
      this.data.room_states[roomId] || {
        room_id: roomId,
        active_round: 1,
        round_status: 'IN_PROGRESS',
        updated_at: new Date().toISOString(),
      }
    );
  }

  public updateRoomState(
    roomId: ClassroomId,
    partial: Partial<RoomRoundState>,
    auditDetail?: string
  ): RoomRoundState {
    const existing = this.getRoomState(roomId);
    this.data.room_states[roomId] = {
      ...existing,
      ...partial,
      updated_at: new Date().toISOString(),
    };
    if (auditDetail) {
      this.logAudit('UPDATE_ROOM_STATE', 'room', roomId, auditDetail);
    }
    this.persist();
    return this.getRoomState(roomId);
  }

  // --- Teams & Real Registration ---
  public getAllTeams(): Team[] {
    return [...this.data.teams];
  }

  public getTeamsByRoom(roomId: ClassroomId): Team[] {
    return this.data.teams.filter((t) => t.room_id === roomId);
  }

  public getTeamById(teamId: string): Team | undefined {
    return this.data.teams.find((t) => t.id === teamId);
  }

  public registerTeam(req: RegistrationRequest): { success: boolean; team?: Team; error?: string } {
    // 1. Check if registration is open
    if (!this.data.settings.registration_open) {
      return { success: false, error: 'Registration is currently closed for Visual Intelligence 2.0.' };
    }

    // 2. Check total team limit
    if (this.data.teams.length >= this.data.settings.registration_limit) {
      return {
        success: false,
        error: `Event registration limit of ${this.data.settings.registration_limit} teams has been reached.`,
      };
    }

    // 3. Validate classroom
    if (!CLASSROOMS.includes(req.room_id)) {
      return { success: false, error: 'Invalid classroom specified. Allowed: K206, K207, K208, K209.' };
    }

    // 4. Validate names
    const teamName = (req.team_name || '').trim();
    const leaderName = (req.leader_name || '').trim();
    const memberNames = (req.member_names || []).map((m) => m.trim()).filter(Boolean);

    if (!teamName) return { success: false, error: 'Team name is required.' };
    if (!leaderName) return { success: false, error: 'Team leader name is required.' };

    // Member count rule: min 3 total, max 6 total including leader (so 2 to 5 additional members)
    if (memberNames.length < 2 || memberNames.length > 5) {
      return {
        success: false,
        error: 'Team size must be between 3 and 6 participants (Team Leader + 2 to 5 members).',
      };
    }

    // 5. Unique normalized team name check
    const normalizedName = teamName.toLowerCase().replace(/\s+/g, ' ');
    const exists = this.data.teams.some((t) => t.normalized_team_name === normalizedName);
    if (exists) {
      return {
        success: false,
        error: `A team named "${teamName}" is already registered. Please choose a unique name.`,
      };
    }

    // 6. Generate registration code & ID
    const roomTeams = this.data.teams.filter((t) => t.room_id === req.room_id);
    const code = `VI2-${req.room_id}-${String(roomTeams.length + 1).padStart(3, '0')}`;
    const id = `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newTeam: Team = {
      id,
      registration_code: code,
      room_id: req.room_id,
      team_name: teamName,
      normalized_team_name: normalizedName,
      leader_name: leaderName,
      member_names: memberNames,
      created_at: now,
    };

    this.data.teams.push(newTeam);
    this.data.qualifications[`${newTeam.id}_1`] = 'COMPETING';

    if (serverSupabase) {
      serverSupabase
        .from('teams')
        .insert([{
          id: newTeam.id,
          registration_code: newTeam.registration_code,
          room_id: newTeam.room_id,
          team_name: newTeam.team_name,
          normalized_team_name: newTeam.normalized_team_name,
          leader_name: newTeam.leader_name,
          member_names: newTeam.member_names,
          created_at: newTeam.created_at,
        }])
        .then(
          ({ error }) => {
            if (error) console.error('[Supabase Sync] Team registration failed in Supabase:', error.message);
          },
          (err: unknown) => {
            console.error('[Supabase Sync] Team insert error:', err);
          }
        );
    }

    this.logAudit('REGISTER_TEAM', 'team', id, `Registered team "${teamName}" (${code}) in ${req.room_id}`);
    this.persist();

    return { success: true, team: newTeam };
  }

  public deleteTeam(teamId: string): { success: boolean; team?: Team; error?: string } {
    const teamIndex = this.data.teams.findIndex((t) => t.id === teamId);
    if (teamIndex === -1) {
      return { success: false, error: 'Team not found.' };
    }

    const removedTeam = this.data.teams[teamIndex];
    this.data.teams.splice(teamIndex, 1);

    if (serverSupabase) {
      serverSupabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .then(
          () => {},
          () => {}
        );
    }

    // Remove associated scores, attempts, qualifications, and approvals
    this.data.judge_scores = this.data.judge_scores.filter((s) => s.team_id !== teamId);
    this.data.round_attempts = this.data.round_attempts.filter((a) => a.team_id !== teamId);

    for (const key of Object.keys(this.data.qualifications)) {
      if (key.startsWith(`${teamId}_`)) {
        delete this.data.qualifications[key];
      }
    }

    for (const key of Object.keys(this.data.review_approvals)) {
      if (key.startsWith(`${teamId}_`)) {
        delete this.data.review_approvals[key];
      }
    }

    this.logAudit(
      'DELETE_TEAM',
      'team',
      teamId,
      `Admin deleted team "${removedTeam.team_name}" (${removedTeam.registration_code}) from Classroom ${removedTeam.room_id}`
    );

    this.persist();
    return { success: true, team: removedTeam };
  }

  // --- Round Attempts (Solve Time) ---
  public getRoundAttempt(teamId: string, roundNumber: RoundNumber): RoundAttempt | undefined {
    return this.data.round_attempts.find((a) => a.team_id === teamId && a.round_number === roundNumber);
  }

  public saveRoundAttempt(teamId: string, roundNumber: RoundNumber, solveTimeMinutes?: number) {
    const existingIndex = this.data.round_attempts.findIndex(
      (a) => a.team_id === teamId && a.round_number === roundNumber
    );
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
      this.data.round_attempts[existingIndex] = {
        team_id: teamId,
        round_number: roundNumber,
        solve_time_minutes: solveTimeMinutes,
        updated_at: now,
      };
    } else {
      this.data.round_attempts.push({
        team_id: teamId,
        round_number: roundNumber,
        solve_time_minutes: solveTimeMinutes,
        updated_at: now,
      });
    }

    // If Round 2 solve time is updated, update speed scores on existing judge entries
    if (roundNumber === 2 && solveTimeMinutes !== undefined) {
      const speedMarks = calculateRound2SpeedMarks(solveTimeMinutes);
      for (const score of this.data.judge_scores) {
        if (score.team_id === teamId && score.round_number === 2) {
          score.criterion_scores['speed'] = speedMarks;
          const pwd = score.criterion_scores['password'] || 0;
          const code = score.criterion_scores['code_word'] || 0;
          score.judge_total = pwd + code + speedMarks;
          score.updated_at = now;
        }
      }
    }

    this.persist();
  }

  // --- Judge Scores ---
  public getJudgeScores(teamId: string, roundNumber: RoundNumber): JudgeScore[] {
    return this.data.judge_scores.filter((s) => s.team_id === teamId && s.round_number === roundNumber);
  }

  public saveJudgeScore(params: {
    teamId: string;
    roundNumber: RoundNumber;
    judgeNumber: 1 | 2 | 3;
    criterionScores: Record<string, number>;
    judgeNotes?: string;
    solveTimeMinutes?: number;
  }): { success: boolean; score?: JudgeScore; error?: string } {
    const { teamId, roundNumber, judgeNumber, criterionScores, judgeNotes, solveTimeMinutes } = params;
    const team = this.getTeamById(teamId);
    if (!team) return { success: false, error: 'Team not found.' };

    const roundDef = COMPETITION_ROUNDS[roundNumber];
    if (!roundDef) return { success: false, error: 'Invalid round number.' };

    // If round 2, ensure solve time is saved and speed marks applied
    if (roundNumber === 2) {
      if (solveTimeMinutes !== undefined) {
        this.saveRoundAttempt(teamId, roundNumber, solveTimeMinutes);
      }
      const attempt = this.getRoundAttempt(teamId, roundNumber);
      const speedScore = calculateRound2SpeedMarks(attempt?.solve_time_minutes);
      criterionScores['speed'] = speedScore;
    }

    // Validate criterion bounds
    let total = 0;
    for (const crit of roundDef.criteria) {
      const val = criterionScores[crit.id] ?? 0;
      if (typeof val !== 'number' || isNaN(val) || val < 0 || val > crit.max) {
        return {
          success: false,
          error: `Score for "${crit.name}" must be between 0 and ${crit.max}. Received: ${val}.`,
        };
      }
      total += Math.round(val);
    }

    const now = new Date().toISOString();
    const existingIndex = this.data.judge_scores.findIndex(
      (s) => s.team_id === teamId && s.round_number === roundNumber && s.judge_number === judgeNumber
    );

    let savedScore: JudgeScore;
    if (existingIndex >= 0) {
      const prev = this.data.judge_scores[existingIndex];
      savedScore = {
        ...prev,
        criterion_scores: criterionScores,
        judge_total: total,
        is_complete: true,
        judge_notes: judgeNotes,
        updated_at: now,
      };
      this.data.judge_scores[existingIndex] = savedScore;
      this.logAudit(
        'EDIT_SCORE',
        'judge_score',
        savedScore.id,
        `Revised Judge ${judgeNumber} marks for team ${team.team_name} in Round ${roundNumber}: ${total}/${roundDef.max_marks}`
      );
    } else {
      savedScore = {
        id: `score_${teamId}_r${roundNumber}_j${judgeNumber}`,
        team_id: teamId,
        round_number: roundNumber,
        judge_number: judgeNumber,
        criterion_scores: criterionScores,
        judge_total: total,
        is_complete: true,
        judge_notes: judgeNotes,
        created_at: now,
        updated_at: now,
      };
      this.data.judge_scores.push(savedScore);
      this.logAudit(
        'SUBMIT_SCORE',
        'judge_score',
        savedScore.id,
        `Recorded Judge ${judgeNumber} marks for team ${team.team_name} in Round ${roundNumber}: ${total}/${roundDef.max_marks}`
      );
    }

    this.persist();
    return { success: true, score: savedScore };
  }

  // --- Judge Disagreement Review Approval ---
  public approveJudgeReview(teamId: string, roundNumber: RoundNumber, notes?: string) {
    const key = `${teamId}_${roundNumber}`;
    this.data.review_approvals[key] = {
      approved: true,
      notes,
    };
    const team = this.getTeamById(teamId);
    this.logAudit(
      'APPROVE_REVIEW',
      'team_round',
      key,
      `Room Lead approved judge review discrepancy for team ${team?.team_name || teamId} in Round ${roundNumber}`
    );
    this.persist();
  }

  // --- Compute Team Round Result ---
  public getRoundResult(teamId: string, roundNumber: RoundNumber): RoundResult | null {
    const team = this.getTeamById(teamId);
    if (!team) return null;

    const scores = this.getJudgeScores(teamId, roundNumber);
    const j1 = scores.find((s) => s.judge_number === 1 && s.is_complete);
    const j2 = scores.find((s) => s.judge_number === 2 && s.is_complete);
    const j3 = scores.find((s) => s.judge_number === 3 && s.is_complete);

    const totals: (number | null)[] = [
      j1 ? j1.judge_total : null,
      j2 ? j2.judge_total : null,
      j3 ? j3.judge_total : null,
    ];

    const judgingComplete = Boolean(j1 && j2 && j3);
    let averageScore: number | null = null;
    let reviewRequired = false;

    if (judgingComplete && j1 && j2 && j3) {
      const sum = j1.judge_total + j2.judge_total + j3.judge_total;
      averageScore = Math.round((sum / 3) * 100) / 100;
      const maxJ = Math.max(j1.judge_total, j2.judge_total, j3.judge_total);
      const minJ = Math.min(j1.judge_total, j2.judge_total, j3.judge_total);
      if (maxJ - minJ > 3) {
        reviewRequired = true;
      }
    }

    const reviewKey = `${teamId}_${roundNumber}`;
    const approval = this.data.review_approvals[reviewKey];
    const reviewApproved = approval?.approved || false;

    const qualStatus: QualificationStatus =
      this.data.qualifications[reviewKey] || (roundNumber === 1 ? 'COMPETING' : 'ELIMINATED');

    const tieValues: Record<string, number> = {};
    if (judgingComplete && j1 && j2 && j3) {
      const allCritKeys = new Set([
        ...Object.keys(j1.criterion_scores),
        ...Object.keys(j2.criterion_scores),
        ...Object.keys(j3.criterion_scores),
      ]);
      for (const k of allCritKeys) {
        const val =
          ((j1.criterion_scores[k] || 0) +
            (j2.criterion_scores[k] || 0) +
            (j3.criterion_scores[k] || 0)) /
          3;
        tieValues[k] = Math.round(val * 100) / 100;
      }
    }

    return {
      team_id: team.id,
      team_name: team.team_name,
      room_id: team.room_id,
      round_number: roundNumber,
      judge_scores: {
        judge_1: j1,
        judge_2: j2,
        judge_3: j3,
      },
      judge_totals: totals,
      average_score: averageScore,
      judging_complete: judgingComplete,
      review_required: reviewRequired,
      review_approved: reviewApproved,
      review_notes: approval?.notes,
      finalized: judgingComplete && (!reviewRequired || reviewApproved),
      qualification_status: qualStatus,
      tie_breaker_values: tieValues,
      updated_at: new Date().toISOString(),
    };
  }

  // --- Qualification Management & Advancing ---
  public getEligibleTeamsForRound(roomId: ClassroomId, roundNumber: RoundNumber): Team[] {
    const teamsInRoom = this.getTeamsByRoom(roomId);
    if (roundNumber === 1) {
      return teamsInRoom;
    }
    const prevRound = (roundNumber - 1) as RoundNumber;
    return teamsInRoom.filter((t) => {
      const status = this.data.qualifications[`${t.id}_${prevRound}`];
      return status === 'QUALIFIED' || status === 'FINALIST';
    });
  }

  public getRankedTeamsForRound(roomId: ClassroomId | 'overall', roundNumber: RoundNumber): RoundResult[] {
    const teams = roomId === 'overall' ? this.getAllTeams() : this.getTeamsByRoom(roomId);

    // Filter eligible teams for this round
    const eligibleTeams = teams.filter((t) => {
      if (roundNumber === 1) return true;
      const prevStatus = this.data.qualifications[`${t.id}_${roundNumber - 1}`];
      return prevStatus === 'QUALIFIED' || prevStatus === 'FINALIST';
    });

    const results: RoundResult[] = [];
    for (const t of eligibleTeams) {
      const res = this.getRoundResult(t.id, roundNumber);
      if (res) results.push(res);
    }

    const roundDef = COMPETITION_ROUNDS[roundNumber];

    results.sort((a, b) => {
      if (a.average_score === null && b.average_score === null) return 0;
      if (a.average_score === null) return 1;
      if (b.average_score === null) return -1;

      if (b.average_score !== a.average_score) {
        return b.average_score - a.average_score;
      }

      // Tie breaker order
      if (roundDef?.tie_breaker_order) {
        for (const critKey of roundDef.tie_breaker_order) {
          const valA = a.tie_breaker_values?.[critKey] || 0;
          const valB = b.tie_breaker_values?.[critKey] || 0;
          if (valB !== valA) {
            return valB - valA;
          }
        }
      }

      return a.team_name.localeCompare(b.team_name);
    });

    // Assign sequential ranks
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return results;
  }

  public advanceClassroomRound(roomId: ClassroomId, currentRound: RoundNumber, selectedQualifierTeamIds: string[]) {
    const eligibleTeams = this.getEligibleTeamsForRound(roomId, currentRound);
    const nextRound = (currentRound + 1) as RoundNumber;

    for (const team of eligibleTeams) {
      const key = `${team.id}_${currentRound}`;
      if (selectedQualifierTeamIds.includes(team.id)) {
        if (currentRound === 3) {
          this.data.qualifications[key] = 'FINALIST';
          this.data.qualifications[`${team.id}_4`] = 'FINALIST';
        } else {
          this.data.qualifications[key] = 'QUALIFIED';
          this.data.qualifications[`${team.id}_${nextRound}`] = 'COMPETING';
        }
      } else {
        this.data.qualifications[key] = 'ELIMINATED';
      }
    }

    if (currentRound < 4) {
      this.updateRoomState(roomId, {
        active_round: nextRound,
        round_status: 'IN_PROGRESS',
      });
    } else {
      this.updateRoomState(roomId, {
        round_status: 'FINALIZED',
      });
    }

    this.logAudit(
      'ADVANCE_ROUND',
      'room',
      roomId,
      `Advanced ${roomId} from Round ${currentRound} to ${
        nextRound <= 4 ? `Round ${nextRound}` : 'Competition Completion'
      } with ${selectedQualifierTeamIds.length} qualifiers.`
    );

    this.persist();
  }

  public publishFinalWinners(championId: string, runnerUpId: string, secondRunnerUpId: string) {
    this.data.qualifications[`${championId}_4`] = 'WINNER';
    this.data.qualifications[`${runnerUpId}_4`] = 'WINNER';
    this.data.qualifications[`${secondRunnerUpId}_4`] = 'WINNER';

    this.updateSettings({ winners_published: true });
    this.logAudit(
      'PUBLISH_WINNERS',
      'event',
      'settings_main',
      `Published Grand Winners: 1st: ${championId}, 2nd: ${runnerUpId}, 3rd: ${secondRunnerUpId}`
    );
    this.persist();
  }

  // --- Leaderboard Generator (Safe Public Data) ---
  public getPublicLeaderboard(roomId: ClassroomId | 'overall', roundNumber?: RoundNumber): LeaderboardEntry[] {
    const activeRound =
      roundNumber ||
      (roomId === 'overall' ? this.data.settings.global_active_round : this.getRoomState(roomId).active_round);
    const rankedResults = this.getRankedTeamsForRound(roomId, activeRound);

    return rankedResults.map((res, index) => {
      let winnerPos: 'CHAMPION' | 'RUNNER_UP' | 'SECOND_RUNNER_UP' | undefined;
      if (activeRound === 4 && this.data.settings.winners_published) {
        if (index === 0) winnerPos = 'CHAMPION';
        else if (index === 1) winnerPos = 'RUNNER_UP';
        else if (index === 2) winnerPos = 'SECOND_RUNNER_UP';
      }

      return {
        rank: index + 1,
        team_id: res.team_id,
        team_name: res.team_name,
        room_id: res.room_id,
        round_number: activeRound,
        average_score: res.average_score,
        qualification_status: res.qualification_status,
        judging_complete: res.judging_complete,
        review_required: res.review_required,
        review_approved: res.review_approved,
        finalized: res.finalized,
        score_details: {
          judge_totals: res.judge_totals,
        },
        winner_position: winnerPos,
      };
    });
  }

  // --- Audit Log ---
  public logAudit(action: string, entityType: string, entityId: string, changeDetails: string) {
    const entry: AdminAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity_type: entityType,
      entity_id: entityId,
      change_details: changeDetails,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(entry);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
  }

  public getAuditLogs(): AdminAuditEntry[] {
    return [...this.data.audit_logs];
  }

  // --- Reset to Pristine 100% Clean Production Database ---
  public resetToCleanState() {
    this.data = getInitialDatabase();
    this.persist();
  }
}

export const db = new DatabaseStore();
