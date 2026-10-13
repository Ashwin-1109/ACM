export type ClassroomId = 'K206' | 'K207' | 'K208' | 'K209';

export const CLASSROOMS: ClassroomId[] = ['K206', 'K207', 'K208', 'K209'];

export type RoundNumber = 1 | 2 | 3 | 4;

export type QualificationStatus = 'COMPETING' | 'QUALIFIED' | 'ELIMINATED' | 'FINALIST' | 'WINNER';

export interface Team {
  id: string;
  registration_code: string;
  room_id: ClassroomId;
  team_name: string;
  normalized_team_name: string;
  leader_name: string;
  member_names: string[];
  created_at: string;
}

export interface PublicTeamInfo {
  id: string;
  registration_code: string;
  room_id: ClassroomId;
  team_name: string;
}

export interface EventSettings {
  id: string;
  registration_open: boolean;
  registration_limit: number;
  event_title: string;
  event_date: string;
  global_active_round: RoundNumber;
  winners_published: boolean;
  updated_at: string;
}

export interface RoomRoundState {
  room_id: ClassroomId;
  active_round: RoundNumber;
  round_status: 'IN_PROGRESS' | 'JUDGING_COMPLETE' | 'FINALIZED';
  updated_at: string;
}

export interface CriterionScoreDefinition {
  id: string;
  name: string;
  description: string;
  max: number;
}

export interface RoundDefinition {
  round_number: RoundNumber;
  title: string;
  subtitle: string;
  max_marks: number;
  criteria: CriterionScoreDefinition[];
  target_qualifiers_per_room: number;
  tie_breaker_order: string[];
  description: string;
}

export interface JudgeScore {
  id: string;
  team_id: string;
  round_number: RoundNumber;
  judge_number: 1 | 2 | 3;
  criterion_scores: Record<string, number>;
  judge_total: number;
  is_complete: boolean;
  judge_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RoundAttempt {
  team_id: string;
  round_number: RoundNumber;
  solve_time_minutes?: number;
  updated_at: string;
}

export interface RoundResult {
  team_id: string;
  team_name: string;
  room_id: ClassroomId;
  round_number: RoundNumber;
  judge_scores: {
    judge_1?: JudgeScore;
    judge_2?: JudgeScore;
    judge_3?: JudgeScore;
  };
  judge_totals: (number | null)[];
  average_score: number | null;
  judging_complete: boolean;
  review_required: boolean;
  review_approved: boolean;
  review_notes?: string;
  finalized: boolean;
  qualification_status: QualificationStatus;
  tie_breaker_values?: Record<string, number>;
  rank?: number;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  room_id: ClassroomId;
  round_number: RoundNumber;
  average_score: number | null;
  qualification_status: QualificationStatus;
  judging_complete: boolean;
  review_required: boolean;
  review_approved: boolean;
  finalized: boolean;
  score_details?: {
    judge_totals: (number | null)[];
  };
  winner_position?: 'CHAMPION' | 'RUNNER_UP' | 'SECOND_RUNNER_UP';
}

export interface AdminAuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  change_details: string;
  created_at: string;
}

export interface RegistrationRequest {
  room_id: ClassroomId;
  team_name: string;
  leader_name: string;
  member_names: string[];
}

export interface AdminSession {
  token: string;
  created_at: number;
  expires_at: number;
}
