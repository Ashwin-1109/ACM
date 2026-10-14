import {
  AdminAuditEntry,
  ClassroomId,
  EventSettings,
  LeaderboardEntry,
  RegistrationRequest,
  RoundNumber,
  RoundResult,
  Team,
} from '../types';

const ADMIN_TOKEN_KEY = 'vi2_admin_session_token';

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function removeAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Robust JSON response parser that handles both JSON errors and non-JSON (HTML 404/500/proxy) responses
 * cleanly without throwing unhandled "Unexpected token" SyntaxErrors.
 */
async function parseApiResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error(`${fallbackError} (HTTP ${res.status}): Server returned malformed JSON.`);
    }

    if (!res.ok) {
      const errObj = data as { error?: string; message?: string };
      throw new Error(errObj.error || errObj.message || `${fallbackError} (HTTP ${res.status})`);
    }

    return data as T;
  }

  // Non-JSON response (e.g. HTML 404/500 from deployment proxy, Vercel, or web server)
  const rawText = await res.text();
  const cleanSummary = rawText
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

  const errorDetail = cleanSummary || res.statusText || 'Unexpected non-JSON response';
  throw new Error(
    `${fallbackError} (HTTP ${res.status}): ${errorDetail}. Please ensure backend services are properly configured.`
  );
}

// -------------------------------------------------------------
// PUBLIC API
// -------------------------------------------------------------

export async function fetchEventInfo() {
  const res = await fetch('/api/info');
  return parseApiResponse<{
    title: string;
    date: string;
    registration_open: boolean;
    registration_limit: number;
    total_registered: number;
    winners_published: boolean;
    room_states: Record<ClassroomId, { room_id: ClassroomId; active_round: RoundNumber; round_status: string }>;
  }>(res, 'Failed to fetch event information');
}

export async function fetchRegistrationStatus() {
  const res = await fetch('/api/registration/status');
  return parseApiResponse<{ open: boolean; current_count: number; limit: number }>(
    res,
    'Failed to fetch registration status'
  );
}

export async function submitRegistration(payload: RegistrationRequest) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<{ success: boolean; team: Team }>(res, 'Failed to submit registration');
}

export async function fetchLeaderboard(room: ClassroomId | 'overall', round?: RoundNumber): Promise<{
  room: string;
  active_round: RoundNumber;
  winners_published: boolean;
  leaderboard: LeaderboardEntry[];
}> {
  const url = new URL('/api/leaderboard', window.location.origin);
  url.searchParams.set('room', room);
  if (round) {
    url.searchParams.set('round', String(round));
  }
  const res = await fetch(url.toString());
  return parseApiResponse<{
    room: string;
    active_round: RoundNumber;
    winners_published: boolean;
    leaderboard: LeaderboardEntry[];
  }>(res, 'Failed to fetch live leaderboard');
}

// -------------------------------------------------------------
// ADMIN AUTHENTICATION API
// -------------------------------------------------------------

export async function adminLogin(password: string): Promise<{ success: boolean; token: string; message?: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await parseApiResponse<{ success: boolean; token: string; message?: string }>(
    res,
    'Administrator authentication failed'
  );
  setAdminToken(data.token);
  return data;
}

export async function adminSupabaseLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token: string; user?: unknown; message?: string }> {
  const res = await fetch('/api/admin/supabase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseApiResponse<{ success: boolean; token: string; user?: unknown; message?: string }>(
    res,
    'ACM board authentication failed'
  );
  setAdminToken(data.token);
  return data;
}

export async function adminLogout() {
  const token = getAdminToken();
  if (token) {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    }).catch(() => {});
  }
  removeAdminToken();
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/admin/verify', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.valid);
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// ADMIN DATA API
// -------------------------------------------------------------

export async function fetchAdminOverview() {
  const res = await fetch('/api/admin/overview', {
    headers: { ...getAuthHeaders() },
  });
  return parseApiResponse<{
    total_teams: number;
    registration_limit: number;
    registration_open: boolean;
    winners_published: boolean;
    room_stats: Record<ClassroomId, { total: number; active_round: RoundNumber; judged_count: number; qualified_count: number }>;
    settings: EventSettings;
    room_states: Record<ClassroomId, { room_id: ClassroomId; active_round: RoundNumber; round_status: string }>;
  }>(res, 'Failed to fetch admin overview');
}

export async function fetchAdminTeams(room?: ClassroomId): Promise<{ teams: Team[] }> {
  const url = new URL('/api/admin/teams', window.location.origin);
  if (room) url.searchParams.set('room', room);
  const res = await fetch(url.toString(), {
    headers: { ...getAuthHeaders() },
  });
  return parseApiResponse<{ teams: Team[] }>(res, 'Failed to fetch teams');
}

export async function fetchClassroomDetails(roomId: ClassroomId, round?: RoundNumber): Promise<{
  roomId: ClassroomId;
  room_state: { active_round: RoundNumber; round_status: string };
  selected_round: RoundNumber;
  teams_count: number;
  results: RoundResult[];
}> {
  const url = new URL(`/api/admin/rooms/${roomId}`, window.location.origin);
  if (round) url.searchParams.set('round', String(round));
  const res = await fetch(url.toString(), {
    headers: { ...getAuthHeaders() },
  });
  return parseApiResponse<{
    roomId: ClassroomId;
    room_state: { active_round: RoundNumber; round_status: string };
    selected_round: RoundNumber;
    teams_count: number;
    results: RoundResult[];
  }>(res, 'Failed to fetch classroom details');
}

export async function saveJudgeScoreApi(params: {
  team_id: string;
  round_number: RoundNumber;
  judge_number: 1 | 2 | 3;
  criterion_scores: Record<string, number>;
  judge_notes?: string;
  solve_time_minutes?: number;
}) {
  const res = await fetch('/api/admin/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  return parseApiResponse<{ success: boolean; score: unknown; round_result: RoundResult }>(
    res,
    'Failed to save judge score'
  );
}

export async function approveReviewDiscrepancy(params: {
  team_id: string;
  round_number: RoundNumber;
  notes?: string;
}) {
  const res = await fetch('/api/admin/scores/approve-review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  return parseApiResponse<{ success: boolean; round_result: RoundResult }>(res, 'Failed to approve review');
}

export async function advanceRoomRoundApi(params: {
  room_id: ClassroomId;
  current_round: RoundNumber;
  qualifier_team_ids: string[];
}) {
  const res = await fetch('/api/admin/room/advance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  return parseApiResponse<{ success: boolean; room_state: unknown }>(res, 'Failed to advance round');
}

export async function publishFinalWinnersApi(params: {
  champion_id: string;
  runner_up_id: string;
  second_runner_up_id: string;
}) {
  const res = await fetch('/api/admin/publish-winners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  return parseApiResponse<{ success: boolean; settings: EventSettings }>(res, 'Failed to publish winners');
}

export async function updateSettingsApi(settings: Partial<EventSettings>) {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(settings),
  });
  return parseApiResponse<{ success: boolean; settings: EventSettings }>(res, 'Failed to update settings');
}

export async function fetchAuditLogs(): Promise<{ logs: AdminAuditEntry[] }> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: { ...getAuthHeaders() },
  });
  return parseApiResponse<{ logs: AdminAuditEntry[] }>(res, 'Failed to fetch audit logs');
}

export async function resetDatabaseApi(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/reset-database', {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  return parseApiResponse<{ success: boolean; message: string }>(res, 'Failed to reset database');
}

export async function deleteTeamApi(teamId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admin/teams/${teamId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  return parseApiResponse<{ success: boolean; message: string }>(res, 'Failed to delete team');
}
