import express, { Request, Response, NextFunction } from 'express';
import { db } from './db.js';
import {
  requireAdminAuth,
  validateSessionToken,
  verifyAdminPassword,
  verifySupabaseLogin,
  invalidateSession,
} from './auth.js';
import { broadcastEvent, registerSseClient } from './sse.js';
import { ClassroomId, CLASSROOMS, RoundNumber } from '../types/index.js';

const app = express();
app.use(express.json());

// Trust proxy for IP logging / rate limiting behind Vercel / reverse proxies
app.set('trust proxy', 1);

// -------------------------------------------------------------
// API ROUTER (Mounted on /api and root fallback)
// -------------------------------------------------------------
export const apiRouter = express.Router();
apiRouter.use(express.json());

// 1. Real-time Server-Sent Events stream
apiRouter.get('/events/stream', (req: Request, res: Response) => {
  try {
    registerSseClient(res);
  } catch (err) {
    console.error('[SSE stream error]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to establish event stream', status: 500 });
    }
  }
});

// 2. Event settings and public info
apiRouter.get('/info', (_req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    const roomStates = db.getRoomStates();
    const totalTeams = db.getAllTeams().length;
    res.json({
      title: settings.event_title,
      date: settings.event_date,
      registration_open: settings.registration_open,
      registration_limit: settings.registration_limit,
      total_registered: totalTeams,
      winners_published: settings.winners_published,
      room_states: roomStates,
    });
  } catch (err) {
    console.error('[Info route error]', err);
    res.status(500).json({ error: 'Failed to load event information', status: 500 });
  }
});

// 3. Registration status
apiRouter.get('/registration/status', (_req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    const teams = db.getAllTeams();
    res.json({
      open: settings.registration_open && teams.length < settings.registration_limit,
      current_count: teams.length,
      limit: settings.registration_limit,
    });
  } catch (err) {
    console.error('[Registration status error]', err);
    res.status(500).json({ error: 'Failed to check registration status', status: 500 });
  }
});

// 4. Submit team registration
apiRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { room_id, team_name, leader_name, member_names } = req.body;

    const result = db.registerTeam({
      room_id: room_id as ClassroomId,
      team_name,
      leader_name,
      member_names,
    });

    if (!result.success || !result.team) {
      return res.status(400).json({ error: result.error || 'Failed to register team.' });
    }

    // Broadcast registration event to admin dashboard
    broadcastEvent('REGISTRATION_CREATED', {
      team_id: result.team.id,
      team_name: result.team.team_name,
      room_id: result.team.room_id,
      total_count: db.getAllTeams().length,
    });

    res.status(201).json({
      success: true,
      team: {
        id: result.team.id,
        registration_code: result.team.registration_code,
        team_name: result.team.team_name,
        room_id: result.team.room_id,
        leader_name: result.team.leader_name,
      },
    });
  } catch (err) {
    console.error('[Register error]', err);
    res.status(500).json({ error: 'Internal registration processing error', status: 500 });
  }
});

// 5. Public leaderboard
apiRouter.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const room = (req.query.room as string) || 'overall';
    const roundParam = req.query.round ? parseInt(req.query.round as string, 10) : undefined;
    const roundNumber = roundParam && roundParam >= 1 && roundParam <= 4 ? (roundParam as RoundNumber) : undefined;

    if (room !== 'overall' && !CLASSROOMS.includes(room as ClassroomId)) {
      return res.status(400).json({ error: 'Invalid room specified.' });
    }

    const data = db.getPublicLeaderboard(room as ClassroomId | 'overall', roundNumber);
    const settings = db.getSettings();
    const roomState = room !== 'overall' ? db.getRoomState(room as ClassroomId) : null;

    res.json({
      room,
      active_round: roundNumber || (roomState ? roomState.active_round : settings.global_active_round),
      winners_published: settings.winners_published,
      leaderboard: data,
    });
  } catch (err) {
    console.error('[Leaderboard error]', err);
    res.status(500).json({ error: 'Failed to retrieve leaderboard', status: 500 });
  }
});

// -------------------------------------------------------------
// ADMIN AUTHENTICATION
// -------------------------------------------------------------

// Master Key Login
apiRouter.post('/admin/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Administrator master key is required.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const verification = verifyAdminPassword(password, clientIp);

    if (!verification.success || !verification.token) {
      return res.status(401).json({ error: verification.error || 'Invalid administrator master key.' });
    }

    res.json({
      success: true,
      token: verification.token,
      message: 'Welcome to the Visual Intelligence 2.0 Competition Control Center.',
    });
  } catch (err) {
    console.error('[Admin login error]', err);
    res.status(500).json({ error: 'Failed to authenticate administrator', status: 500 });
  }
});

// Supabase Board Member Login
apiRouter.post('/admin/supabase-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'ACM member email and password are required.' });
    }

    const result = await verifySupabaseLogin(email, password);
    if (!result.success || !result.token) {
      return res.status(401).json({ error: result.error || 'Failed to authenticate with Supabase.' });
    }

    res.json({
      success: true,
      token: result.token,
      user: result.user,
      message: 'Authorized ACM Board Member verified.',
    });
  } catch (err) {
    console.error('[Supabase login error]', err);
    res.status(500).json({ error: 'Internal error during Supabase authentication', status: 500 });
  }
});

// Logout
apiRouter.post('/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] as string);
  if (token) {
    invalidateSession(token);
  }
  res.json({ success: true, message: 'Signed out successfully.' });
});

// Verify Session
apiRouter.get('/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] as string);
  const isValid = validateSessionToken(token);
  res.json({ valid: isValid });
});

// -------------------------------------------------------------
// ADMIN PRIVILEGED ENDPOINTS (Protected by requireAdminAuth)
// -------------------------------------------------------------

// Dashboard Overview Stats
apiRouter.get('/admin/overview', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const allTeams = db.getAllTeams();
    const settings = db.getSettings();
    const roomStates = db.getRoomStates();

    const roomStats: Record<ClassroomId, { total: number; active_round: RoundNumber; judged_count: number; qualified_count: number }> = {
      K206: { total: 0, active_round: roomStates.K206.active_round, judged_count: 0, qualified_count: 0 },
      K207: { total: 0, active_round: roomStates.K207.active_round, judged_count: 0, qualified_count: 0 },
      K208: { total: 0, active_round: roomStates.K208.active_round, judged_count: 0, qualified_count: 0 },
      K209: { total: 0, active_round: roomStates.K209.active_round, judged_count: 0, qualified_count: 0 },
    };

    for (const t of allTeams) {
      if (roomStats[t.room_id]) {
        roomStats[t.room_id].total += 1;
      }
    }

    for (const roomId of CLASSROOMS) {
      const round = roomStates[roomId].active_round;
      const ranked = db.getRankedTeamsForRound(roomId, round);
      roomStats[roomId].judged_count = ranked.filter((r) => r.judging_complete).length;
      roomStats[roomId].qualified_count = ranked.filter((r) => r.qualification_status === 'QUALIFIED' || r.qualification_status === 'FINALIST' || r.qualification_status === 'WINNER').length;
    }

    res.json({
      total_teams: allTeams.length,
      registration_limit: settings.registration_limit,
      registration_open: settings.registration_open,
      winners_published: settings.winners_published,
      room_stats: roomStats,
      settings,
      room_states: roomStates,
    });
  } catch (err) {
    console.error('[Admin overview error]', err);
    res.status(500).json({ error: 'Failed to retrieve overview statistics', status: 500 });
  }
});

// Get teams list (can filter by room)
apiRouter.get('/admin/teams', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const room = req.query.room as string;
    let teams = db.getAllTeams();
    if (room && CLASSROOMS.includes(room as ClassroomId)) {
      teams = teams.filter((t) => t.room_id === room);
    }
    res.json({ teams });
  } catch (err) {
    console.error('[Admin teams error]', err);
    res.status(500).json({ error: 'Failed to load teams', status: 500 });
  }
});

// Delete team by admin
apiRouter.delete('/admin/teams/:teamId', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const result = db.deleteTeam(teamId);

    if (!result.success || !result.team) {
      return res.status(404).json({ error: result.error || 'Team not found.' });
    }

    broadcastEvent('TEAM_DELETED', {
      team_id: result.team.id,
      team_name: result.team.team_name,
      room_id: result.team.room_id,
      total_count: db.getAllTeams().length,
    });

    res.json({ success: true, message: `Team "${result.team.team_name}" deleted.` });
  } catch (err) {
    console.error('[Delete team error]', err);
    res.status(500).json({ error: 'Failed to delete team', status: 500 });
  }
});

// Classroom specific details & ranked results
apiRouter.get('/admin/rooms/:roomId', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as ClassroomId;
    if (!CLASSROOMS.includes(roomId)) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const roomState = db.getRoomState(roomId);
    const roundParam = req.query.round ? parseInt(req.query.round as string, 10) : roomState.active_round;
    const round = (roundParam >= 1 && roundParam <= 4 ? roundParam : roomState.active_round) as RoundNumber;

    const results = db.getRankedTeamsForRound(roomId, round);
    const allRoomTeams = db.getTeamsByRoom(roomId);

    res.json({
      roomId,
      room_state: roomState,
      selected_round: round,
      teams_count: allRoomTeams.length,
      results,
    });
  } catch (err) {
    console.error('[Admin room details error]', err);
    res.status(500).json({ error: 'Failed to retrieve room details', status: 500 });
  }
});

// Save / edit judge scores
apiRouter.post('/admin/scores', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { team_id, round_number, judge_number, criterion_scores, judge_notes, solve_time_minutes } = req.body;

    if (!team_id || !round_number || !judge_number || !criterion_scores) {
      return res.status(400).json({ error: 'Missing required scoring parameters.' });
    }

    const result = db.saveJudgeScore({
      teamId: team_id,
      roundNumber: round_number as RoundNumber,
      judgeNumber: judge_number as 1 | 2 | 3,
      criterionScores: criterion_scores,
      judgeNotes: judge_notes,
      solveTimeMinutes: solve_time_minutes !== undefined ? Number(solve_time_minutes) : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to save score.' });
    }

    const roundResult = db.getRoundResult(team_id, round_number as RoundNumber);
    const team = db.getTeamById(team_id);

    broadcastEvent('SCORE_UPDATED', {
      team_id,
      team_name: team?.team_name,
      room_id: team?.room_id,
      round_number,
      round_result: roundResult,
    });

    res.json({
      success: true,
      score: result.score,
      round_result: roundResult,
    });
  } catch (err) {
    console.error('[Save score error]', err);
    res.status(500).json({ error: 'Failed to save judge score', status: 500 });
  }
});

// Approve judge disagreement review
apiRouter.post('/admin/scores/approve-review', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { team_id, round_number, notes } = req.body;
    if (!team_id || !round_number) {
      return res.status(400).json({ error: 'team_id and round_number are required.' });
    }

    db.approveJudgeReview(team_id, round_number as RoundNumber, notes);
    const roundResult = db.getRoundResult(team_id, round_number as RoundNumber);
    const team = db.getTeamById(team_id);

    broadcastEvent('SCORE_UPDATED', {
      team_id,
      team_name: team?.team_name,
      room_id: team?.room_id,
      round_number,
      round_result: roundResult,
    });

    res.json({ success: true, round_result: roundResult });
  } catch (err) {
    console.error('[Approve review error]', err);
    res.status(500).json({ error: 'Failed to approve review', status: 500 });
  }
});

// Advance room to next round with qualifiers
apiRouter.post('/admin/room/advance', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { room_id, current_round, qualifier_team_ids } = req.body;

    if (!room_id || !CLASSROOMS.includes(room_id) || !current_round || !Array.isArray(qualifier_team_ids)) {
      return res.status(400).json({ error: 'Invalid parameters for advancing round.' });
    }

    db.advanceClassroomRound(room_id as ClassroomId, current_round as RoundNumber, qualifier_team_ids);

    broadcastEvent('ROUND_CHANGED', {
      room_id,
      advanced_from: current_round,
      qualifier_count: qualifier_team_ids.length,
    });

    res.json({
      success: true,
      room_state: db.getRoomState(room_id as ClassroomId),
    });
  } catch (err) {
    console.error('[Advance round error]', err);
    res.status(500).json({ error: 'Failed to advance round', status: 500 });
  }
});

// Publish Grand Winners
apiRouter.post('/admin/publish-winners', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { champion_id, runner_up_id, second_runner_up_id } = req.body;
    if (!champion_id || !runner_up_id || !second_runner_up_id) {
      return res.status(400).json({ error: 'Champion, Runner-up, and Second Runner-up are all required.' });
    }

    db.publishFinalWinners(champion_id, runner_up_id, second_runner_up_id);

    broadcastEvent('WINNERS_PUBLISHED', {
      champion_id,
      runner_up_id,
      second_runner_up_id,
    });

    res.json({ success: true, settings: db.getSettings() });
  } catch (err) {
    console.error('[Publish winners error]', err);
    res.status(500).json({ error: 'Failed to publish winners', status: 500 });
  }
});

// Update event settings
apiRouter.post('/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { registration_open, registration_limit, global_active_round, event_title, event_date } = req.body;

    const updated = db.updateSettings(
      {
        ...(registration_open !== undefined && { registration_open: Boolean(registration_open) }),
        ...(registration_limit !== undefined && { registration_limit: Number(registration_limit) }),
        ...(global_active_round !== undefined && { global_active_round: Number(global_active_round) as RoundNumber }),
        ...(event_title !== undefined && { event_title: String(event_title) }),
        ...(event_date !== undefined && { event_date: String(event_date) }),
      },
      'Updated competition settings from Admin Panel'
    );

    broadcastEvent('SETTINGS_UPDATED', updated);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('[Settings update error]', err);
    res.status(500).json({ error: 'Failed to update settings', status: 500 });
  }
});

// Reset Database to Fresh Clean State
apiRouter.post('/admin/reset-database', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    db.resetToCleanState();
    broadcastEvent('DATABASE_RESET', {});
    res.json({ success: true, message: 'Database reset to clean event state.' });
  } catch (err) {
    console.error('[Reset database error]', err);
    res.status(500).json({ error: 'Failed to reset database', status: 500 });
  }
});

// Audit Logs
apiRouter.get('/admin/audit-logs', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const logs = db.getAuditLogs();
    res.json({ logs });
  } catch (err) {
    console.error('[Audit logs error]', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs', status: 500 });
  }
});

// CSV Export
apiRouter.get('/admin/export-csv', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const teams = db.getAllTeams();
    const rows: string[] = ['Registration Code,Team Name,Room,Leader Name,Members,Created At'];
    for (const t of teams) {
      const members = t.member_names.join('; ');
      rows.push(
        `"${t.registration_code}","${t.team_name}","${t.room_id}","${t.leader_name}","${members}","${t.created_at}"`
      );
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="visual_intelligence_teams.csv"');
    res.send(rows.join('\n'));
  } catch (err) {
    console.error('[Export CSV error]', err);
    res.status(500).json({ error: 'Failed to export CSV', status: 500 });
  }
});

// Catch-all for API router to ALWAYS return structured JSON 404
apiRouter.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404,
  });
});

// Mount apiRouter on /api
app.use('/api', apiRouter);

// Fallback: If a serverless rewrite forwards requests to root without /api prefix
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    req.path.startsWith('/admin/') ||
    req.path === '/info' ||
    req.path === '/register' ||
    req.path.startsWith('/registration/') ||
    req.path.startsWith('/leaderboard') ||
    req.path.startsWith('/events/')
  ) {
    return apiRouter(req, res, next);
  }
  next();
});

// Global Express Error Handler (ALWAYS returns structured JSON)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err);
  const status = (err as { status?: number }).status || 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(status).json({
    error: message,
    status,
  });
});

export default app;
