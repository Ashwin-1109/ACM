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

// Public API
export async function fetchEventInfo() {
  const res = await fetch('/api/info');
  if (!res.ok) throw new Error('Failed to fetch event information');
  return res.json();
}

export async function fetchRegistrationStatus() {
  const res = await fetch('/api/registration/status');
  if (!res.ok) throw new Error('Failed to fetch registration status');
  return res.json();
}

export async function submitRegistration(payload: RegistrationRequest) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit registration');
  }
  return data;
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
  if (!res.ok) throw new Error('Failed to fetch live leaderboard');
  return res.json();
}

// Admin API
export async function adminLogin(password: string): Promise<{ success: boolean; token: string }> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid administrator password');
  }
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

export async function fetchAdminOverview() {
  const res = await fetch('/api/admin/overview', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch admin overview');
  return res.json();
}

export async function fetchAdminTeams(room?: ClassroomId): Promise<{ teams: Team[] }> {
  const url = new URL('/api/admin/teams', window.location.origin);
  if (room) url.searchParams.set('room', room);
  const res = await fetch(url.toString(), {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
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
  if (!res.ok) throw new Error('Failed to fetch classroom details');
  return res.json();
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save judge score');
  return data;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve review');
  return data;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to advance round');
  return data;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to publish winners');
  return data;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}

export async function fetchAuditLogs(): Promise<{ logs: AdminAuditEntry[] }> {
  const res = await fetch('/api/admin/audit-logs', {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function resetDatabaseApi(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/admin/reset-database', {
    method: 'POST',
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset database');
  return data;
}

export async function deleteTeamApi(teamId: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admin/teams/${teamId}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete team');
  return data;
}


