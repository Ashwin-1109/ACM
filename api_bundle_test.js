// api/index.ts
import "dotenv/config";

// server.ts
import dotenv from "dotenv";
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";

// src/server/db.ts
import fs from "fs";
import path from "path";

// src/types/index.ts
var CLASSROOMS = ["K206", "K207", "K208", "K209"];

// src/constants/competition.ts
var COMPETITION_ROUNDS = {
  1: {
    round_number: 1,
    title: "Round 1 \u2014 Cyber Styling",
    subtitle: "All registered teams participate in the theme design challenge",
    max_marks: 25,
    target_qualifiers_per_room: 7,
    tie_breaker_order: ["prompt_quality", "creativity", "functionality", "output", "timing"],
    description: "Create an innovative and responsive web interface using refined prompts.",
    criteria: [
      {
        id: "creativity",
        name: "Creativity / Originality",
        description: "Fresh ideas, not just generic designs",
        max: 5
      },
      {
        id: "functionality",
        name: "Functionality",
        description: "The webpage works correctly, including buttons, links, and scripts",
        max: 5
      },
      {
        id: "timing",
        name: "Timing",
        description: "Submission was completed within the required time",
        max: 5
      },
      {
        id: "output",
        name: "Output Quality",
        description: "Final webpage matches the selected theme and has good visual quality",
        max: 5
      },
      {
        id: "prompt_quality",
        name: "Prompt Quality",
        description: "Prompts are clear, specific, and refined",
        max: 5
      }
    ]
  },
  2: {
    round_number: 2,
    title: "Round 2 \u2014 BugX Hacker",
    subtitle: "Top 7 teams per classroom engage in problem-solving and cyber deciphering",
    max_marks: 25,
    target_qualifiers_per_room: 4,
    tie_breaker_order: ["password", "code_word", "speed"],
    description: "Decipher protected strings, locate vulnerabilities, and solve against the clock.",
    criteria: [
      {
        id: "password",
        name: "Correct Password",
        description: "Deciphered the secret key correctly",
        max: 10
      },
      {
        id: "code_word",
        name: "Correct Code Word",
        description: "Identified the target vulnerability codeword",
        max: 8
      },
      {
        id: "speed",
        name: "Speed Marks (Calculated from Solve Time)",
        description: "<=8m: 7pts | 8-12m: 5pts | 12-16m: 3pts | 16-20m: 1pt | >20m: 0pts",
        max: 7
      }
    ]
  },
  3: {
    round_number: 3,
    title: "Round 3 \u2014 Prompt Rumble",
    subtitle: "Top 4 teams per classroom craft storytelling AI advertising concepts",
    max_marks: 25,
    target_qualifiers_per_room: 2,
    tie_breaker_order: ["creativity", "storytelling", "ai_usage", "ad_quality", "images_and_words"],
    description: "Generate a cohesive commercial campaign incorporating 3 mandatory images and 3 designated keywords.",
    criteria: [
      {
        id: "creativity",
        name: "Creativity",
        description: "Originality of idea and visual treatment",
        max: 5
      },
      {
        id: "images_and_words",
        name: "Use of 3 Images + 3 Words",
        description: "All supplied images and words are incorporated appropriately",
        max: 5
      },
      {
        id: "storytelling",
        name: "Storytelling",
        description: "Clear narrative structure and emotional delivery",
        max: 5
      },
      {
        id: "ai_usage",
        name: "Prompt / AI Usage",
        description: "Effective and specific application of AI tools",
        max: 5
      },
      {
        id: "ad_quality",
        name: "Final Ad Quality",
        description: "Overall polish and quality of the advertisement",
        max: 5
      }
    ]
  },
  4: {
    round_number: 4,
    title: "Round 4 \u2014 Prompt Charades",
    subtitle: "The 8 Grand Finalists compete across all classrooms for the Championship",
    max_marks: 25,
    target_qualifiers_per_room: 0,
    // Final round
    tie_breaker_order: ["similarity", "communication", "prompt_quality", "visual_interpretation"],
    description: "Describers communicate concepts without naming them; guesser generates the closest visual reproduction.",
    criteria: [
      {
        id: "communication",
        name: "Communication",
        description: "Describers communicate effectively without naming the picture",
        max: 5
      },
      {
        id: "prompt_quality",
        name: "Prompt Quality",
        description: "Guesser creates a clear, structured, and detailed prompt",
        max: 5
      },
      {
        id: "visual_interpretation",
        name: "Visual Interpretation",
        description: "Key geometric and artistic components of the picture are understood",
        max: 5
      },
      {
        id: "similarity",
        name: "Similarity to Original",
        description: "Generated output closely matches the original target picture",
        max: 10
      }
    ]
  }
};
function calculateRound2SpeedMarks(solveTimeMinutes) {
  if (solveTimeMinutes === void 0 || solveTimeMinutes === null || isNaN(solveTimeMinutes)) {
    return 0;
  }
  if (solveTimeMinutes <= 8) return 7;
  if (solveTimeMinutes <= 12) return 5;
  if (solveTimeMinutes <= 16) return 3;
  if (solveTimeMinutes <= 20) return 1;
  return 0;
}

// src/server/db.ts
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.resolve(DATA_DIR, "competition_db.json");
function getInitialDatabase() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    settings: {
      id: "settings_main",
      registration_open: true,
      registration_limit: 100,
      event_title: "VISUAL INTELLIGENCE 2.0",
      event_date: "2026-10-14",
      global_active_round: 1,
      winners_published: false,
      updated_at: now
    },
    room_states: {
      K206: { room_id: "K206", active_round: 1, round_status: "IN_PROGRESS", updated_at: now },
      K207: { room_id: "K207", active_round: 1, round_status: "IN_PROGRESS", updated_at: now },
      K208: { room_id: "K208", active_round: 1, round_status: "IN_PROGRESS", updated_at: now },
      K209: { room_id: "K209", active_round: 1, round_status: "IN_PROGRESS", updated_at: now }
    },
    teams: [],
    judge_scores: [],
    round_attempts: [],
    review_approvals: {},
    qualifications: {},
    audit_logs: []
  };
}
var DatabaseStore = class {
  constructor() {
    this.isSaving = false;
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error("Failed to parse database file, resetting to clean initial state:", err);
        this.data = getInitialDatabase();
        this.persist();
      }
    } else {
      this.data = getInitialDatabase();
      this.persist();
    }
  }
  persist() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error("Database write error:", err);
    } finally {
      this.isSaving = false;
    }
  }
  // --- Settings ---
  getSettings() {
    return { ...this.data.settings };
  }
  updateSettings(partial, auditDetail) {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (auditDetail) {
      this.logAudit("UPDATE_SETTINGS", "settings", this.data.settings.id, auditDetail);
    }
    this.persist();
    return this.getSettings();
  }
  // --- Rooms ---
  getRoomStates() {
    return { ...this.data.room_states };
  }
  getRoomState(roomId) {
    return this.data.room_states[roomId] || {
      room_id: roomId,
      active_round: 1,
      round_status: "IN_PROGRESS",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  updateRoomState(roomId, partial, auditDetail) {
    const existing = this.getRoomState(roomId);
    this.data.room_states[roomId] = {
      ...existing,
      ...partial,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (auditDetail) {
      this.logAudit("UPDATE_ROOM_STATE", "room", roomId, auditDetail);
    }
    this.persist();
    return this.getRoomState(roomId);
  }
  // --- Teams & Real Registration ---
  getAllTeams() {
    return [...this.data.teams];
  }
  getTeamsByRoom(roomId) {
    return this.data.teams.filter((t) => t.room_id === roomId);
  }
  getTeamById(teamId) {
    return this.data.teams.find((t) => t.id === teamId);
  }
  registerTeam(req) {
    if (!this.data.settings.registration_open) {
      return { success: false, error: "Registration is currently closed for Visual Intelligence 2.0." };
    }
    if (this.data.teams.length >= this.data.settings.registration_limit) {
      return {
        success: false,
        error: `Event registration limit of ${this.data.settings.registration_limit} teams has been reached.`
      };
    }
    if (!CLASSROOMS.includes(req.room_id)) {
      return { success: false, error: "Invalid classroom specified. Allowed: K206, K207, K208, K209." };
    }
    const teamName = (req.team_name || "").trim();
    const leaderName = (req.leader_name || "").trim();
    const memberNames = (req.member_names || []).map((m) => m.trim()).filter(Boolean);
    if (!teamName) return { success: false, error: "Team name is required." };
    if (!leaderName) return { success: false, error: "Team leader name is required." };
    if (memberNames.length < 2 || memberNames.length > 5) {
      return {
        success: false,
        error: "Team size must be between 3 and 6 participants (Team Leader + 2 to 5 members)."
      };
    }
    const normalizedName = teamName.toLowerCase().replace(/\s+/g, " ");
    const exists = this.data.teams.some((t) => t.normalized_team_name === normalizedName);
    if (exists) {
      return {
        success: false,
        error: `A team named "${teamName}" is already registered. Please choose a unique name.`
      };
    }
    const roomTeams = this.data.teams.filter((t) => t.room_id === req.room_id);
    const code = `VI2-${req.room_id}-${String(roomTeams.length + 1).padStart(3, "0")}`;
    const id = `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newTeam = {
      id,
      registration_code: code,
      room_id: req.room_id,
      team_name: teamName,
      normalized_team_name: normalizedName,
      leader_name: leaderName,
      member_names: memberNames,
      created_at: now
    };
    this.data.teams.push(newTeam);
    this.data.qualifications[`${newTeam.id}_1`] = "COMPETING";
    this.logAudit("REGISTER_TEAM", "team", id, `Registered team "${teamName}" (${code}) in ${req.room_id}`);
    this.persist();
    return { success: true, team: newTeam };
  }
  deleteTeam(teamId) {
    const teamIndex = this.data.teams.findIndex((t) => t.id === teamId);
    if (teamIndex === -1) {
      return { success: false, error: "Team not found." };
    }
    const removedTeam = this.data.teams[teamIndex];
    this.data.teams.splice(teamIndex, 1);
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
      "DELETE_TEAM",
      "team",
      teamId,
      `Admin deleted team "${removedTeam.team_name}" (${removedTeam.registration_code}) from Classroom ${removedTeam.room_id}`
    );
    this.persist();
    return { success: true, team: removedTeam };
  }
  // --- Round Attempts (Solve Time) ---
  getRoundAttempt(teamId, roundNumber) {
    return this.data.round_attempts.find((a) => a.team_id === teamId && a.round_number === roundNumber);
  }
  saveRoundAttempt(teamId, roundNumber, solveTimeMinutes) {
    const existingIndex = this.data.round_attempts.findIndex(
      (a) => a.team_id === teamId && a.round_number === roundNumber
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existingIndex >= 0) {
      this.data.round_attempts[existingIndex] = {
        team_id: teamId,
        round_number: roundNumber,
        solve_time_minutes: solveTimeMinutes,
        updated_at: now
      };
    } else {
      this.data.round_attempts.push({
        team_id: teamId,
        round_number: roundNumber,
        solve_time_minutes: solveTimeMinutes,
        updated_at: now
      });
    }
    if (roundNumber === 2 && solveTimeMinutes !== void 0) {
      const speedMarks = calculateRound2SpeedMarks(solveTimeMinutes);
      for (const score of this.data.judge_scores) {
        if (score.team_id === teamId && score.round_number === 2) {
          score.criterion_scores["speed"] = speedMarks;
          const pwd = score.criterion_scores["password"] || 0;
          const code = score.criterion_scores["code_word"] || 0;
          score.judge_total = pwd + code + speedMarks;
          score.updated_at = now;
        }
      }
    }
    this.persist();
  }
  // --- Judge Scores ---
  getJudgeScores(teamId, roundNumber) {
    return this.data.judge_scores.filter((s) => s.team_id === teamId && s.round_number === roundNumber);
  }
  saveJudgeScore(params) {
    const { teamId, roundNumber, judgeNumber, criterionScores, judgeNotes, solveTimeMinutes } = params;
    const team = this.getTeamById(teamId);
    if (!team) return { success: false, error: "Team not found." };
    const roundDef = COMPETITION_ROUNDS[roundNumber];
    if (!roundDef) return { success: false, error: "Invalid round number." };
    if (roundNumber === 2) {
      if (solveTimeMinutes !== void 0) {
        this.saveRoundAttempt(teamId, roundNumber, solveTimeMinutes);
      }
      const attempt = this.getRoundAttempt(teamId, roundNumber);
      const speedScore = calculateRound2SpeedMarks(attempt?.solve_time_minutes);
      criterionScores["speed"] = speedScore;
    }
    let total = 0;
    for (const crit of roundDef.criteria) {
      const val = criterionScores[crit.id] ?? 0;
      if (typeof val !== "number" || isNaN(val) || val < 0 || val > crit.max) {
        return {
          success: false,
          error: `Score for "${crit.name}" must be between 0 and ${crit.max}. Received: ${val}.`
        };
      }
      total += Math.round(val);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existingIndex = this.data.judge_scores.findIndex(
      (s) => s.team_id === teamId && s.round_number === roundNumber && s.judge_number === judgeNumber
    );
    let savedScore;
    if (existingIndex >= 0) {
      const prev = this.data.judge_scores[existingIndex];
      savedScore = {
        ...prev,
        criterion_scores: criterionScores,
        judge_total: total,
        is_complete: true,
        judge_notes: judgeNotes,
        updated_at: now
      };
      this.data.judge_scores[existingIndex] = savedScore;
      this.logAudit(
        "EDIT_SCORE",
        "judge_score",
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
        updated_at: now
      };
      this.data.judge_scores.push(savedScore);
      this.logAudit(
        "SUBMIT_SCORE",
        "judge_score",
        savedScore.id,
        `Recorded Judge ${judgeNumber} marks for team ${team.team_name} in Round ${roundNumber}: ${total}/${roundDef.max_marks}`
      );
    }
    this.persist();
    return { success: true, score: savedScore };
  }
  // --- Judge Disagreement Review Approval ---
  approveJudgeReview(teamId, roundNumber, notes) {
    const key = `${teamId}_${roundNumber}`;
    this.data.review_approvals[key] = {
      approved: true,
      notes
    };
    const team = this.getTeamById(teamId);
    this.logAudit(
      "APPROVE_REVIEW",
      "team_round",
      key,
      `Room Lead approved judge review discrepancy for team ${team?.team_name || teamId} in Round ${roundNumber}`
    );
    this.persist();
  }
  // --- Compute Team Round Result ---
  getRoundResult(teamId, roundNumber) {
    const team = this.getTeamById(teamId);
    if (!team) return null;
    const scores = this.getJudgeScores(teamId, roundNumber);
    const j1 = scores.find((s) => s.judge_number === 1 && s.is_complete);
    const j2 = scores.find((s) => s.judge_number === 2 && s.is_complete);
    const j3 = scores.find((s) => s.judge_number === 3 && s.is_complete);
    const totals = [
      j1 ? j1.judge_total : null,
      j2 ? j2.judge_total : null,
      j3 ? j3.judge_total : null
    ];
    const judgingComplete = Boolean(j1 && j2 && j3);
    let averageScore = null;
    let reviewRequired = false;
    if (judgingComplete && j1 && j2 && j3) {
      const sum = j1.judge_total + j2.judge_total + j3.judge_total;
      averageScore = Math.round(sum / 3 * 100) / 100;
      const maxJ = Math.max(j1.judge_total, j2.judge_total, j3.judge_total);
      const minJ = Math.min(j1.judge_total, j2.judge_total, j3.judge_total);
      if (maxJ - minJ > 3) {
        reviewRequired = true;
      }
    }
    const reviewKey = `${teamId}_${roundNumber}`;
    const approval = this.data.review_approvals[reviewKey];
    const reviewApproved = approval?.approved || false;
    const qualStatus = this.data.qualifications[reviewKey] || (roundNumber === 1 ? "COMPETING" : "ELIMINATED");
    const tieValues = {};
    if (judgingComplete && j1 && j2 && j3) {
      const allCritKeys = /* @__PURE__ */ new Set([
        ...Object.keys(j1.criterion_scores),
        ...Object.keys(j2.criterion_scores),
        ...Object.keys(j3.criterion_scores)
      ]);
      for (const k of allCritKeys) {
        const val = ((j1.criterion_scores[k] || 0) + (j2.criterion_scores[k] || 0) + (j3.criterion_scores[k] || 0)) / 3;
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
        judge_3: j3
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
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // --- Qualification Management & Advancing ---
  getEligibleTeamsForRound(roomId, roundNumber) {
    const teamsInRoom = this.getTeamsByRoom(roomId);
    if (roundNumber === 1) {
      return teamsInRoom;
    }
    const prevRound = roundNumber - 1;
    return teamsInRoom.filter((t) => {
      const status = this.data.qualifications[`${t.id}_${prevRound}`];
      return status === "QUALIFIED" || status === "FINALIST";
    });
  }
  getRankedTeamsForRound(roomId, roundNumber) {
    const teams = roomId === "overall" ? this.getAllTeams() : this.getTeamsByRoom(roomId);
    const eligibleTeams = teams.filter((t) => {
      if (roundNumber === 1) return true;
      const prevStatus = this.data.qualifications[`${t.id}_${roundNumber - 1}`];
      return prevStatus === "QUALIFIED" || prevStatus === "FINALIST";
    });
    const results = [];
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
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });
    return results;
  }
  advanceClassroomRound(roomId, currentRound, selectedQualifierTeamIds) {
    const eligibleTeams = this.getEligibleTeamsForRound(roomId, currentRound);
    const nextRound = currentRound + 1;
    for (const team of eligibleTeams) {
      const key = `${team.id}_${currentRound}`;
      if (selectedQualifierTeamIds.includes(team.id)) {
        if (currentRound === 3) {
          this.data.qualifications[key] = "FINALIST";
          this.data.qualifications[`${team.id}_4`] = "FINALIST";
        } else {
          this.data.qualifications[key] = "QUALIFIED";
          this.data.qualifications[`${team.id}_${nextRound}`] = "COMPETING";
        }
      } else {
        this.data.qualifications[key] = "ELIMINATED";
      }
    }
    if (currentRound < 4) {
      this.updateRoomState(roomId, {
        active_round: nextRound,
        round_status: "IN_PROGRESS"
      });
    } else {
      this.updateRoomState(roomId, {
        round_status: "FINALIZED"
      });
    }
    this.logAudit(
      "ADVANCE_ROUND",
      "room",
      roomId,
      `Advanced ${roomId} from Round ${currentRound} to ${nextRound <= 4 ? `Round ${nextRound}` : "Competition Completion"} with ${selectedQualifierTeamIds.length} qualifiers.`
    );
    this.persist();
  }
  publishFinalWinners(championId, runnerUpId, secondRunnerUpId) {
    this.data.qualifications[`${championId}_4`] = "WINNER";
    this.data.qualifications[`${runnerUpId}_4`] = "WINNER";
    this.data.qualifications[`${secondRunnerUpId}_4`] = "WINNER";
    this.updateSettings({ winners_published: true });
    this.logAudit(
      "PUBLISH_WINNERS",
      "event",
      "settings_main",
      `Published Grand Winners: 1st: ${championId}, 2nd: ${runnerUpId}, 3rd: ${secondRunnerUpId}`
    );
    this.persist();
  }
  // --- Leaderboard Generator (Safe Public Data) ---
  getPublicLeaderboard(roomId, roundNumber) {
    const activeRound = roundNumber || (roomId === "overall" ? this.data.settings.global_active_round : this.getRoomState(roomId).active_round);
    const rankedResults = this.getRankedTeamsForRound(roomId, activeRound);
    return rankedResults.map((res, index) => {
      let winnerPos;
      if (activeRound === 4 && this.data.settings.winners_published) {
        if (index === 0) winnerPos = "CHAMPION";
        else if (index === 1) winnerPos = "RUNNER_UP";
        else if (index === 2) winnerPos = "SECOND_RUNNER_UP";
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
          judge_totals: res.judge_totals
        },
        winner_position: winnerPos
      };
    });
  }
  // --- Audit Log ---
  logAudit(action, entityType, entityId, changeDetails) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity_type: entityType,
      entity_id: entityId,
      change_details: changeDetails,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.audit_logs.unshift(entry);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs.pop();
    }
  }
  getAuditLogs() {
    return [...this.data.audit_logs];
  }
  // --- Reset to Pristine 100% Clean Production Database ---
  resetToCleanState() {
    this.data = getInitialDatabase();
    this.persist();
  }
};
var db = new DatabaseStore();

// src/server/auth.ts
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
function getConfiguredAdminPassword() {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return void 0;
  const cleaned = pwd.trim().replace(/^["'](.*)["']$/, "$1");
  return cleaned.length > 0 ? cleaned : void 0;
}
var supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
var serverSupabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith("https://") && !supabaseUrl.includes("your-project-id")) {
  try {
    serverSupabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (err) {
    console.warn("[Auth] Failed to initialize server-side Supabase client:", err);
  }
}
var failedAttempts = /* @__PURE__ */ new Map();
var activeSessions = /* @__PURE__ */ new Map();
var SESSION_TTL_MS = 8 * 60 * 60 * 1e3;
var MAX_FAILED_ATTEMPTS = 5;
var LOCKOUT_MS = 15 * 60 * 1e3;
function cleanOldSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}
function createAdminSession(userMeta) {
  cleanOldSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    user: userMeta
  });
  return token;
}
function verifyAdminPassword(password, clientIp) {
  cleanOldSessions();
  const now = Date.now();
  const configuredPassword = getConfiguredAdminPassword();
  if (!configuredPassword) {
    return {
      success: false,
      error: "Administrator master password is not configured on the server. Please configure ADMIN_PASSWORD in your environment variables or sign in using an authorized Supabase ACM board account."
    };
  }
  const ipRecord = failedAttempts.get(clientIp);
  if (ipRecord && ipRecord.lockedUntil && ipRecord.lockedUntil > now) {
    const remainingMinutes = Math.ceil((ipRecord.lockedUntil - now) / 6e4);
    return {
      success: false,
      error: `Too many failed attempts. Control Center locked for ${remainingMinutes} more minute(s).`
    };
  }
  const trimmedInput = password.trim();
  const passwordBuffer = Buffer.from(trimmedInput);
  const targetBuffer = Buffer.from(configuredPassword);
  let isMatch = false;
  if (passwordBuffer.length === targetBuffer.length) {
    isMatch = crypto.timingSafeEqual(passwordBuffer, targetBuffer);
  }
  if (!isMatch) {
    const record = failedAttempts.get(clientIp) || { count: 0 };
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
    }
    failedAttempts.set(clientIp, record);
    return {
      success: false,
      error: `Incorrect administrator password. Attempt ${record.count} of ${MAX_FAILED_ATTEMPTS}.`
    };
  }
  failedAttempts.delete(clientIp);
  const token = createAdminSession({ role: "admin_master" });
  return { success: true, token };
}
async function verifySupabaseLogin(email, password) {
  if (!serverSupabase) {
    return {
      success: false,
      error: "Supabase authentication is not configured on the server. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) or sign in using the Administrator Master Key."
    };
  }
  try {
    const { data, error } = await serverSupabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || "Invalid ACM board member credentials."
      };
    }
    const token = createAdminSession({
      email: data.user.email,
      role: "board_member"
    });
    return {
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Supabase authentication error";
    return { success: false, error: msg };
  }
}
async function verifySupabaseJwt(token) {
  if (!serverSupabase) return null;
  try {
    const { data: { user }, error } = await serverSupabase.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
function validateSessionToken(token) {
  if (!token) return false;
  cleanOldSessions();
  const session = activeSessions.get(token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}
function invalidateSession(token) {
  activeSessions.delete(token);
}
async function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-admin-token"];
  if (!token) {
    return res.status(401).json({
      error: "Unauthorized. Please sign in to the Competition Control Center."
    });
  }
  if (validateSessionToken(token)) {
    return next();
  }
  if (token.split(".").length === 3) {
    const user = await verifySupabaseJwt(token);
    if (user) {
      req.adminUser = user;
      return next();
    }
  }
  return res.status(401).json({
    error: "Unauthorized or expired session. Please sign in to the Competition Control Center."
  });
}

// src/server/sse.ts
var clients = /* @__PURE__ */ new Set();
function registerSseClient(res) {
  const id = Math.random().toString(36).substring(2, 9);
  const client = { id, res };
  clients.add(client);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write(`event: connected
data: ${JSON.stringify({ clientId: id, timestamp: Date.now() })}

`);
  res.on("close", () => {
    clients.delete(client);
  });
  return id;
}
function broadcastEvent(eventType, payload) {
  const message = `event: ${eventType}
data: ${JSON.stringify(payload)}

`;
  for (const client of clients) {
    try {
      client.res.write(message);
    } catch {
      clients.delete(client);
    }
  }
}
setInterval(() => {
  for (const client of clients) {
    try {
      client.res.write(`: ping

`);
    } catch {
      clients.delete(client);
    }
  }
}, 25e3);

// server.ts
dotenv.config({ override: true });
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var app = express();
app.use(express.json());
app.set("trust proxy", 1);
var apiRouter = express.Router();
apiRouter.use(express.json());
apiRouter.get("/events/stream", (req, res) => {
  registerSseClient(res);
});
apiRouter.get("/info", (_req, res) => {
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
    room_states: roomStates
  });
});
apiRouter.get("/registration/status", (_req, res) => {
  const settings = db.getSettings();
  const teams = db.getAllTeams();
  res.json({
    open: settings.registration_open && teams.length < settings.registration_limit,
    current_count: teams.length,
    limit: settings.registration_limit
  });
});
apiRouter.post("/register", (req, res) => {
  const { room_id, team_name, leader_name, member_names } = req.body;
  const result = db.registerTeam({
    room_id,
    team_name,
    leader_name,
    member_names
  });
  if (!result.success || !result.team) {
    return res.status(400).json({ error: result.error || "Failed to register team." });
  }
  broadcastEvent("REGISTRATION_CREATED", {
    team_id: result.team.id,
    team_name: result.team.team_name,
    room_id: result.team.room_id,
    total_count: db.getAllTeams().length
  });
  res.status(201).json({
    success: true,
    team: {
      id: result.team.id,
      registration_code: result.team.registration_code,
      team_name: result.team.team_name,
      room_id: result.team.room_id,
      leader_name: result.team.leader_name
    }
  });
});
apiRouter.get("/leaderboard", (req, res) => {
  const room = req.query.room || "overall";
  const roundParam = req.query.round ? parseInt(req.query.round, 10) : void 0;
  const roundNumber = roundParam && roundParam >= 1 && roundParam <= 4 ? roundParam : void 0;
  if (room !== "overall" && !CLASSROOMS.includes(room)) {
    return res.status(400).json({ error: "Invalid room specified." });
  }
  const data = db.getPublicLeaderboard(room, roundNumber);
  const settings = db.getSettings();
  const roomState = room !== "overall" ? db.getRoomState(room) : null;
  res.json({
    room,
    active_round: roundNumber || (roomState ? roomState.active_round : settings.global_active_round),
    winners_published: settings.winners_published,
    leaderboard: data
  });
});
apiRouter.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Administrator master key is required." });
  }
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const verification = verifyAdminPassword(password, clientIp);
  if (!verification.success || !verification.token) {
    return res.status(401).json({ error: verification.error || "Invalid administrator master key." });
  }
  res.json({
    success: true,
    token: verification.token,
    message: "Welcome to the Visual Intelligence 2.0 Competition Control Center."
  });
});
apiRouter.post("/admin/supabase-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "ACM member email and password are required." });
  }
  const result = await verifySupabaseLogin(email, password);
  if (!result.success || !result.token) {
    return res.status(401).json({ error: result.error || "Failed to authenticate with Supabase." });
  }
  res.json({
    success: true,
    token: result.token,
    user: result.user,
    message: "Authorized ACM Board Member verified."
  });
});
apiRouter.post("/admin/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-admin-token"];
  if (token) {
    invalidateSession(token);
  }
  res.json({ success: true, message: "Signed out successfully." });
});
apiRouter.get("/admin/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.headers["x-admin-token"];
  const isValid = validateSessionToken(token);
  res.json({ valid: isValid });
});
apiRouter.get("/admin/overview", requireAdminAuth, (_req, res) => {
  const allTeams = db.getAllTeams();
  const settings = db.getSettings();
  const roomStates = db.getRoomStates();
  const roomStats = {
    K206: { total: 0, active_round: roomStates.K206.active_round, judged_count: 0, qualified_count: 0 },
    K207: { total: 0, active_round: roomStates.K207.active_round, judged_count: 0, qualified_count: 0 },
    K208: { total: 0, active_round: roomStates.K208.active_round, judged_count: 0, qualified_count: 0 },
    K209: { total: 0, active_round: roomStates.K209.active_round, judged_count: 0, qualified_count: 0 }
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
    roomStats[roomId].qualified_count = ranked.filter((r) => r.qualification_status === "QUALIFIED" || r.qualification_status === "FINALIST" || r.qualification_status === "WINNER").length;
  }
  res.json({
    total_teams: allTeams.length,
    registration_limit: settings.registration_limit,
    registration_open: settings.registration_open,
    winners_published: settings.winners_published,
    room_stats: roomStats,
    settings,
    room_states: roomStates
  });
});
apiRouter.get("/admin/teams", requireAdminAuth, (req, res) => {
  const room = req.query.room;
  let teams = db.getAllTeams();
  if (room && CLASSROOMS.includes(room)) {
    teams = teams.filter((t) => t.room_id === room);
  }
  res.json({ teams });
});
apiRouter.delete("/admin/teams/:teamId", requireAdminAuth, (req, res) => {
  const { teamId } = req.params;
  const result = db.deleteTeam(teamId);
  if (!result.success || !result.team) {
    return res.status(404).json({ error: result.error || "Team not found." });
  }
  broadcastEvent("TEAM_DELETED", {
    team_id: result.team.id,
    team_name: result.team.team_name,
    room_id: result.team.room_id,
    total_count: db.getAllTeams().length
  });
  res.json({ success: true, message: `Team "${result.team.team_name}" deleted.` });
});
apiRouter.get("/admin/rooms/:roomId", requireAdminAuth, (req, res) => {
  const roomId = req.params.roomId;
  if (!CLASSROOMS.includes(roomId)) {
    return res.status(404).json({ error: "Classroom not found." });
  }
  const roomState = db.getRoomState(roomId);
  const roundParam = req.query.round ? parseInt(req.query.round, 10) : roomState.active_round;
  const round = roundParam >= 1 && roundParam <= 4 ? roundParam : roomState.active_round;
  const results = db.getRankedTeamsForRound(roomId, round);
  const allRoomTeams = db.getTeamsByRoom(roomId);
  res.json({
    roomId,
    room_state: roomState,
    selected_round: round,
    teams_count: allRoomTeams.length,
    results
  });
});
apiRouter.post("/admin/scores", requireAdminAuth, (req, res) => {
  const { team_id, round_number, judge_number, criterion_scores, judge_notes, solve_time_minutes } = req.body;
  if (!team_id || !round_number || !judge_number || !criterion_scores) {
    return res.status(400).json({ error: "Missing required scoring parameters." });
  }
  const result = db.saveJudgeScore({
    teamId: team_id,
    roundNumber: round_number,
    judgeNumber: judge_number,
    criterionScores: criterion_scores,
    judgeNotes: judge_notes,
    solveTimeMinutes: solve_time_minutes !== void 0 ? Number(solve_time_minutes) : void 0
  });
  if (!result.success) {
    return res.status(400).json({ error: result.error || "Failed to save score." });
  }
  const roundResult = db.getRoundResult(team_id, round_number);
  const team = db.getTeamById(team_id);
  broadcastEvent("SCORE_UPDATED", {
    team_id,
    team_name: team?.team_name,
    room_id: team?.room_id,
    round_number,
    round_result: roundResult
  });
  res.json({
    success: true,
    score: result.score,
    round_result: roundResult
  });
});
apiRouter.post("/admin/scores/approve-review", requireAdminAuth, (req, res) => {
  const { team_id, round_number, notes } = req.body;
  if (!team_id || !round_number) {
    return res.status(400).json({ error: "team_id and round_number are required." });
  }
  db.approveJudgeReview(team_id, round_number, notes);
  const roundResult = db.getRoundResult(team_id, round_number);
  const team = db.getTeamById(team_id);
  broadcastEvent("SCORE_UPDATED", {
    team_id,
    team_name: team?.team_name,
    room_id: team?.room_id,
    round_number,
    round_result: roundResult
  });
  res.json({ success: true, round_result: roundResult });
});
apiRouter.post("/admin/room/advance", requireAdminAuth, (req, res) => {
  const { room_id, current_round, qualifier_team_ids } = req.body;
  if (!room_id || !CLASSROOMS.includes(room_id) || !current_round || !Array.isArray(qualifier_team_ids)) {
    return res.status(400).json({ error: "Invalid parameters for advancing round." });
  }
  db.advanceClassroomRound(room_id, current_round, qualifier_team_ids);
  broadcastEvent("ROUND_CHANGED", {
    room_id,
    advanced_from: current_round,
    qualifier_count: qualifier_team_ids.length
  });
  res.json({
    success: true,
    room_state: db.getRoomState(room_id)
  });
});
apiRouter.post("/admin/publish-winners", requireAdminAuth, (req, res) => {
  const { champion_id, runner_up_id, second_runner_up_id } = req.body;
  if (!champion_id || !runner_up_id || !second_runner_up_id) {
    return res.status(400).json({ error: "Champion, Runner-up, and Second Runner-up are all required." });
  }
  db.publishFinalWinners(champion_id, runner_up_id, second_runner_up_id);
  broadcastEvent("WINNERS_PUBLISHED", {
    champion_id,
    runner_up_id,
    second_runner_up_id
  });
  res.json({ success: true, settings: db.getSettings() });
});
apiRouter.post("/admin/settings", requireAdminAuth, (req, res) => {
  const { registration_open, registration_limit, global_active_round, event_title, event_date } = req.body;
  const updated = db.updateSettings(
    {
      ...registration_open !== void 0 && { registration_open: Boolean(registration_open) },
      ...registration_limit !== void 0 && { registration_limit: Number(registration_limit) },
      ...global_active_round !== void 0 && { global_active_round: Number(global_active_round) },
      ...event_title !== void 0 && { event_title: String(event_title) },
      ...event_date !== void 0 && { event_date: String(event_date) }
    },
    "Updated competition settings from Admin Panel"
  );
  broadcastEvent("SETTINGS_UPDATED", updated);
  res.json({ success: true, settings: updated });
});
apiRouter.post("/admin/reset-database", requireAdminAuth, (_req, res) => {
  db.resetToCleanState();
  broadcastEvent("DATABASE_RESET", {});
  res.json({ success: true, message: "Database reset to clean event state." });
});
apiRouter.get("/admin/audit-logs", requireAdminAuth, (_req, res) => {
  const logs = db.getAuditLogs();
  res.json({ logs });
});
apiRouter.get("/admin/export-csv", requireAdminAuth, (_req, res) => {
  const teams = db.getAllTeams();
  const rows = ["Registration Code,Team Name,Room,Leader Name,Members,Created At"];
  for (const t of teams) {
    const members = t.member_names.join("; ");
    rows.push(
      `"${t.registration_code}","${t.team_name}","${t.room_id}","${t.leader_name}","${members}","${t.created_at}"`
    );
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="visual_intelligence_teams.csv"');
  res.send(rows.join("\n"));
});
apiRouter.use((req, res) => {
  res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});
app.use("/api", apiRouter);
app.use((req, res, next) => {
  if (req.path.startsWith("/admin/") || req.path === "/info" || req.path === "/register" || req.path.startsWith("/registration/") || req.path.startsWith("/leaderboard") || req.path.startsWith("/events/")) {
    const acceptHeader = req.headers.accept || "";
    if (req.method !== "GET" || acceptHeader.includes("application/json") || req.path.startsWith("/admin/scores") || req.path.startsWith("/admin/teams")) {
      return apiRouter(req, res, next);
    }
  }
  next();
});
app.use((err, _req, res, _next) => {
  console.error("[Server Error]", err);
  const status = err.status || 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(status).json({
    error: message,
    status
  });
});
var PORT = Number(process.env.PORT) || 3e3;
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path2.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[VI 2.0] Visual Intelligence 2.0 Server running on http://0.0.0.0:${PORT}`);
  });
}
var server_default = app;
if (!process.env.VERCEL) {
  startServer();
}

// api/index.ts
var index_default = server_default;
export {
  index_default as default
};
