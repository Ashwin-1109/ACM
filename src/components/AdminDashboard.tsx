import React, { useState, useEffect } from 'react';
import { ClassroomId, CLASSROOMS, RoundNumber } from '../types';
import {
  adminLogout,
  fetchAdminOverview,
  fetchAuditLogs,
  publishFinalWinnersApi,
  updateSettingsApi,
  resetDatabaseApi,
  fetchAdminTeams,
  deleteTeamApi,
} from '../lib/api';
import { Team } from '../types';
import {
  Shield,
  LogOut,
  Users,
  Trophy,
  Sliders,
  Download,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Trash2,
} from 'lucide-react';

interface AdminDashboardProps {
  navigate: (route: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    total_teams: number;
    registration_limit: number;
    registration_open: boolean;
    winners_published: boolean;
    room_stats: Record<
      ClassroomId,
      { total: number; active_round: RoundNumber; judged_count: number; qualified_count: number }
    >;
    settings: {
      global_active_round: RoundNumber;
      event_title: string;
      event_date: string;
    };
  } | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamRoomFilter, setTeamRoomFilter] = useState<'ALL' | ClassroomId>('ALL');
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; action: string; change_details: string; created_at: string }>>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const overview = await fetchAdminOverview();
      setData(overview);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRegistration = async () => {
    if (!data) return;
    setSavingSettings(true);
    try {
      const updated = await updateSettingsApi({ registration_open: !data.registration_open });
      setData((prev) => prev ? { ...prev, registration_open: updated.settings.registration_open } : prev);
      setStatusMessage(`Registration ${updated.settings.registration_open ? 'Opened' : 'Closed'} successfully.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenAudit = async () => {
    setShowAuditModal(true);
    try {
      const res = await fetchAuditLogs();
      setAuditLogs(res.logs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  const handleOpenTeamsModal = async () => {
    setShowTeamsModal(true);
    try {
      const res = await fetchAdminTeams();
      setAllTeams(res.teams);
    } catch (err) {
      console.error('Failed to load all teams:', err);
    }
  };

  const handleDeleteTeamFromModal = async (teamId: string, teamName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete team "${teamName}"? All scores and submissions will be removed.`
    );
    if (!confirmed) return;

    try {
      await deleteTeamApi(teamId);
      setAllTeams((prev) => prev.filter((t) => t.id !== teamId));
      setStatusMessage(`Team "${teamName}" has been deleted.`);
      loadData();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to delete team.');
    }
  };

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      'WARNING: Are you sure you want to completely reset the database to a fresh state? All test team registrations and judge scores will be cleared for tomorrow.'
    );
    if (!confirmed) return;

    try {
      await resetDatabaseApi();
      setStatusMessage('Database has been completely reset to a clean state with 0 teams.');
      loadData();
      setShowSettingsModal(false);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to reset database.');
    }
  };

  const handleLogoutClick = async () => {
    await adminLogout();
    onLogout();
    navigate('/');
  };

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#C5A46D] border-t-transparent animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#576474]">Loading Control Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-[#E9E3D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#39836A]" />
            <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#96723C] font-semibold">
              OFFICIAL EVENT CONSOLE
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536]">
            Competition Control Center
          </h1>
          <p className="text-xs text-[#576474] mt-1 font-serif italic">
            Visual Intelligence 2.0 • Division of AI/ML × ACM Student Chapter
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenTeamsModal}
            className="px-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] hover:border-[#C5A46D]/60 text-xs font-semibold text-[#172536] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Manage Teams ({data.total_teams})</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] hover:border-[#C5A46D]/60 text-xs font-semibold text-[#172536] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Event Settings</span>
          </button>

          <button
            onClick={handleOpenAudit}
            className="px-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] hover:border-[#C5A46D]/60 text-xs font-semibold text-[#172536] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Audit Log</span>
          </button>

          <a
            href="/api/admin/export-csv"
            download
            className="px-4 py-2.5 rounded-xl border border-[#E9E3D8] bg-[#FFFDF8] hover:border-[#C5A46D]/60 text-xs font-semibold text-[#172536] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A46D]" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleLogoutClick}
            className="px-4 py-2.5 rounded-xl border border-[#B75656]/30 bg-[#B75656]/10 hover:bg-[#B75656]/20 text-xs font-semibold text-[#B75656] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Admin Logout</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 rounded-xl bg-[#39836A]/10 border border-[#39836A]/30 text-[#39836A] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 5 Summary Statistics Cards */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Registered */}
        <div className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#C5A46D]/40 luxury-shadow">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-semibold block mb-1">
            Total Registrations
          </span>
          <div className="font-serif text-3xl sm:text-4xl font-bold text-[#172536]">
            {data.total_teams}
            <span className="text-xs font-sans text-[#576474] font-normal ml-1">
              / {data.registration_limit}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#576474] flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${data.registration_open ? 'bg-[#39836A]' : 'bg-[#B75656]'}`} />
            <span>{data.registration_open ? 'Portal Open' : 'Portal Closed'}</span>
          </div>
        </div>

        {/* Room K206 */}
        <div className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#E9E3D8] luxury-shadow">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#576474] font-semibold block mb-1">
            K206 Registrations
          </span>
          <div className="font-serif text-3xl font-bold text-[#172536]">
            {data.room_stats.K206?.total || 0}
          </div>
          <div className="mt-2 text-[11px] text-[#96723C] font-medium">
            Round {data.room_stats.K206?.active_round || 1} Active
          </div>
        </div>

        {/* Room K207 */}
        <div className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#E9E3D8] luxury-shadow">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#576474] font-semibold block mb-1">
            K207 Registrations
          </span>
          <div className="font-serif text-3xl font-bold text-[#172536]">
            {data.room_stats.K207?.total || 0}
          </div>
          <div className="mt-2 text-[11px] text-[#96723C] font-medium">
            Round {data.room_stats.K207?.active_round || 1} Active
          </div>
        </div>

        {/* Room K208 */}
        <div className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#E9E3D8] luxury-shadow">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#576474] font-semibold block mb-1">
            K208 Registrations
          </span>
          <div className="font-serif text-3xl font-bold text-[#172536]">
            {data.room_stats.K208?.total || 0}
          </div>
          <div className="mt-2 text-[11px] text-[#96723C] font-medium">
            Round {data.room_stats.K208?.active_round || 1} Active
          </div>
        </div>

        {/* Room K209 */}
        <div className="bg-[#FFFDF8] rounded-2xl p-5 border border-[#E9E3D8] luxury-shadow">
          <span className="text-[10px] uppercase font-sans tracking-widest text-[#576474] font-semibold block mb-1">
            K209 Registrations
          </span>
          <div className="font-serif text-3xl font-bold text-[#172536]">
            {data.room_stats.K209?.total || 0}
          </div>
          <div className="mt-2 text-[11px] text-[#96723C] font-medium">
            Round {data.room_stats.K209?.active_round || 1} Active
          </div>
        </div>
      </div>

      {/* Main Classroom Control Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#172536]">
              Classroom Competition Command
            </h2>
            <p className="text-xs text-[#576474]">
              Each classroom advances independently through the four competition rounds.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CLASSROOMS.map((roomId) => {
            const stats = data.room_stats[roomId];
            const roundNumber = stats?.active_round || 1;

            return (
              <div
                key={roomId}
                className="bg-[#FFFDF8] rounded-3xl p-7 border border-[#E9E3D8] hover:border-[#C5A46D]/70 transition-all duration-300 luxury-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] uppercase font-sans tracking-widest text-[#96723C] font-bold">
                        CLASSROOM SECTOR
                      </span>
                      <h3 className="font-serif text-3xl font-bold text-[#172536] mt-0.5">
                        Classroom {roomId}
                      </h3>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#C5A46D]/40 text-xs font-display font-semibold text-[#96723C]">
                      Round {roundNumber} Active
                    </div>
                  </div>

                  {/* Room Metrics grid */}
                  <div className="grid grid-cols-3 gap-3 my-6 p-4 rounded-2xl bg-[#FAF8F3] border border-[#E9E3D8]/80 text-center">
                    <div>
                      <span className="text-[10px] uppercase text-[#576474] block mb-0.5">Total Teams</span>
                      <span className="font-serif text-xl font-bold text-[#172536]">{stats?.total || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[#576474] block mb-0.5">Scored</span>
                      <span className="font-serif text-xl font-bold text-[#96723C]">{stats?.judged_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-[#576474] block mb-0.5">Advanced</span>
                      <span className="font-serif text-xl font-bold text-[#39836A]">{stats?.qualified_count || 0}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#576474] leading-relaxed mb-6">
                    Enter Judge 1, 2, and 3 marks, record Round 2 solve-time speed points, and advance the top qualifiers.
                  </p>
                </div>

                {/* Manage Button */}
                <div className="pt-4 border-t border-[#E9E3D8] flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/leaderboard/${roomId}`)}
                    className="text-xs text-[#576474] hover:text-[#172536] flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Public Board</span>
                  </button>

                  <button
                    onClick={() => navigate(`/admin/room/${roomId}`)}
                    className="px-5 py-2.5 rounded-full bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Manage Room {roomId}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172536]/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFDF8] rounded-3xl p-8 max-w-lg w-full border border-[#E9E3D8] luxury-shadow">
            <h3 className="font-serif text-2xl font-bold text-[#172536] mb-1">
              Event Management Settings
            </h3>
            <p className="text-xs text-[#576474] mb-6">
              Configure student registration status and event publication states.
            </p>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8]">
                <div>
                  <h4 className="font-bold text-xs uppercase text-[#172536] tracking-wider">
                    Student Registration Portal
                  </h4>
                  <p className="text-xs text-[#576474] mt-0.5">
                    {data.registration_open
                      ? 'Registration is currently ACCEPTING submissions (Up to 100 teams).'
                      : 'Registration is currently CLOSED.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleRegistration}
                  disabled={savingSettings}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    data.registration_open
                      ? 'bg-[#B75656] text-white hover:bg-[#964242]'
                      : 'bg-[#39836A] text-white hover:bg-[#2b6451]'
                  }`}
                >
                  {data.registration_open ? 'Close Portal' : 'Open Portal'}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8]">
                <h4 className="font-bold text-xs uppercase text-[#172536] tracking-wider mb-1">
                  Final Winner Podium
                </h4>
                <p className="text-xs text-[#576474] mb-3">
                  {data.winners_published
                    ? 'Grand winners are published and viewable on the public leaderboard.'
                    : 'Grand winners have not been officially published yet.'}
                </p>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    navigate('/leaderboard/overall');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#172536] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#96723C] cursor-pointer"
                >
                  Go to Overall Leaderboard / Winner Podium
                </button>
              </div>

              {/* Fresh Production Database Reset Tool */}
              <div className="p-4 rounded-xl bg-[#B75656]/5 border border-[#B75656]/30">
                <h4 className="font-bold text-xs uppercase text-[#B75656] tracking-wider mb-1">
                  Reset Database to Clean State
                </h4>
                <p className="text-xs text-[#576474] mb-3">
                  Wipes all test team registrations and judge scores. Prepares the database for 100% clean real-world operation.
                </p>
                <button
                  onClick={handleResetDatabase}
                  className="px-4 py-2 rounded-lg bg-[#B75656] hover:bg-[#964242] text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Clear All Test Data (Zero Teams)
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-bold text-[#172536] hover:bg-[#FFFDF8] cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172536]/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFDF8] rounded-3xl p-8 max-w-2xl w-full border border-[#E9E3D8] luxury-shadow max-h-[80vh] flex flex-col">
            <h3 className="font-serif text-2xl font-bold text-[#172536] mb-1">
              Administrative Audit Log
            </h3>
            <p className="text-xs text-[#576474] mb-4">
              Real-time records of score submissions, revisions, and round advancements.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#576474]">No audit entries recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8] text-xs">
                    <div className="flex justify-between items-center text-[10px] text-[#96723C] font-bold uppercase tracking-wider mb-1">
                      <span>{log.action}</span>
                      <span className="text-[#576474] font-normal">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[#172536] font-medium">{log.change_details}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E9E3D8] flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-bold text-[#172536] hover:bg-[#FFFDF8] cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage All Teams Modal */}
      {showTeamsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172536]/40 backdrop-blur-xs p-4">
          <div className="bg-[#FFFDF8] rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-[#E9E3D8] luxury-shadow max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E9E3D8]">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#172536]">
                  Registered Competition Teams ({allTeams.length})
                </h3>
                <p className="text-xs text-[#576474]">
                  Search, review team rosters, and delete student registrations if required.
                </p>
              </div>

              <button
                onClick={() => setShowTeamsModal(false)}
                className="px-5 py-2 rounded-full bg-[#FAF8F3] border border-[#E9E3D8] text-xs font-bold text-[#172536] hover:bg-[#FFFDF8] cursor-pointer"
              >
                Done
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="my-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#576474]" />
                <input
                  type="text"
                  placeholder="Search team or leader..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] text-xs text-[#172536] focus:outline-none focus:border-[#C5A46D]"
                />
              </div>

              <div className="flex rounded-xl bg-[#FAF8F3] p-1 border border-[#E9E3D8] self-stretch sm:self-auto justify-center">
                {(['ALL', 'K206', 'K207', 'K208', 'K209'] as const).map((rm) => (
                  <button
                    key={rm}
                    onClick={() => setTeamRoomFilter(rm)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      teamRoomFilter === rm
                        ? 'bg-[#172536] text-white shadow-xs'
                        : 'text-[#576474] hover:text-[#172536]'
                    }`}
                  >
                    {rm}
                  </button>
                ))}
              </div>
            </div>

            {/* Teams List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {allTeams
                .filter((t) => {
                  if (teamRoomFilter !== 'ALL' && t.room_id !== teamRoomFilter) return false;
                  if (!teamSearchQuery) return true;
                  const q = teamSearchQuery.toLowerCase();
                  return (
                    t.team_name.toLowerCase().includes(q) ||
                    t.registration_code.toLowerCase().includes(q) ||
                    t.leader_name.toLowerCase().includes(q)
                  );
                })
                .map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E9E3D8] hover:border-[#C5A46D]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#96723C] bg-[#FFFDF8] px-2 py-0.5 rounded border border-[#E9E3D8]">
                          {t.registration_code}
                        </span>
                        <span className="font-display font-semibold text-xs text-[#172536] px-2.5 py-0.5 rounded-full bg-[#E8D4A7]/25 border border-[#C5A46D]/40">
                          Room {t.room_id}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-[#172536]">
                        {t.team_name}
                      </h4>

                      <p className="text-xs text-[#576474] mt-0.5">
                        <strong className="text-[#172536]">Leader:</strong> {t.leader_name} •{' '}
                        <strong className="text-[#172536]">Members:</strong> {t.member_names.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleDeleteTeamFromModal(t.id, t.team_name)}
                        className="px-3.5 py-2 rounded-xl border border-[#B75656]/30 bg-[#B75656]/10 hover:bg-[#B75656] hover:text-white text-[#B75656] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Team</span>
                      </button>
                    </div>
                  </div>
                ))}

              {allTeams.length === 0 && (
                <div className="py-12 text-center text-xs text-[#576474]">
                  No teams registered yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
