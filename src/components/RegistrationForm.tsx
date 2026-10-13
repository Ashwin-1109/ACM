import React, { useState, useEffect } from 'react';
import { ClassroomId, CLASSROOMS } from '../types';
import { fetchRegistrationStatus, submitRegistration } from '../lib/api';
import { Users, Plus, Trash2, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface RegistrationFormProps {
  navigate: (route: string) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ navigate }) => {
  const [roomId, setRoomId] = useState<ClassroomId>('K206');
  const [teamName, setTeamName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [members, setMembers] = useState<string[]>(['', '']); // min 2 additional members (3 total with leader)
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);
  const [limit, setLimit] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    id: string;
    registration_code: string;
    team_name: string;
    room_id: ClassroomId;
  } | null>(null);

  useEffect(() => {
    fetchRegistrationStatus()
      .then((data) => {
        setIsOpen(data.open);
        setCurrentCount(data.current_count);
        setLimit(data.limit);
      })
      .catch((err) => {
        console.error('Failed to load status:', err);
      })
      .finally(() => setStatusLoading(false));
  }, []);

  const handleAddMember = () => {
    if (members.length < 5) {
      setMembers([...members, '']);
    }
  };

  const handleRemoveMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleMemberChange = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teamName.trim()) {
      setError('Please provide a team name.');
      return;
    }
    if (!leaderName.trim()) {
      setError('Please provide the team leader name.');
      return;
    }

    const filledMembers = members.map((m) => m.trim()).filter(Boolean);
    if (filledMembers.length < 2) {
      setError('Minimum 2 additional team members required (3 participants total including leader).');
      return;
    }

    setLoading(true);
    try {
      const res = await submitRegistration({
        room_id: roomId,
        team_name: teamName.trim(),
        leader_name: leaderName.trim(),
        member_names: filledMembers,
      });

      setSuccessData(res.team);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If successfully registered, show confirmation card
  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-[#FFFDF8] rounded-3xl p-8 sm:p-12 border border-[#C5A46D]/60 luxury-shadow text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#96723C] via-[#C5A46D] to-[#E8D4A7]" />

          <div className="w-16 h-16 mx-auto rounded-full bg-[#39836A]/10 text-[#39836A] flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs uppercase font-sans tracking-[0.3em] text-[#96723C] font-semibold">
            OFFICIAL CONFIRMATION
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536] mt-2 mb-3">
            REGISTRATION SUCCESSFUL
          </h2>

          <p className="font-serif italic text-lg text-[#576474] mb-8">
            Welcome to Visual Intelligence 2.0.
          </p>

          <div className="bg-[#FAF8F3] rounded-2xl p-6 border border-[#E9E3D8] text-left max-w-md mx-auto space-y-4 mb-8">
            <div className="flex justify-between items-center pb-3 border-b border-[#E9E3D8]/70">
              <span className="text-xs uppercase font-sans text-[#576474] tracking-wider">Registration ID</span>
              <span className="font-mono font-bold text-sm text-[#96723C] bg-[#FFFDF8] px-2.5 py-1 rounded-md border border-[#E9E3D8]">
                {successData.registration_code}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-[#E9E3D8]/70">
              <span className="text-xs uppercase font-sans text-[#576474] tracking-wider">Team Name</span>
              <span className="font-serif font-bold text-base text-[#172536]">
                {successData.team_name}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-sans text-[#576474] tracking-wider">Assigned Classroom</span>
              <span className="font-display font-bold text-sm text-[#172536] px-3 py-1 rounded-full bg-[#E8D4A7]/30 border border-[#C5A46D]/40">
                Classroom {successData.room_id}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#576474] max-w-sm mx-auto mb-8">
            Please report to Classroom {successData.room_id} on 14 October 2026 for Round 1 — Cyber Styling.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/leaderboard/' + successData.room_id)}
              className="px-6 py-3 rounded-full bg-[#172536] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#96723C] transition-all cursor-pointer shadow-xs"
            >
              View Room {successData.room_id} Leaderboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-full bg-[#FFFDF8] border border-[#E9E3D8] text-[#172536] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F3] transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration closed state
  if (!statusLoading && !isOpen) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-[#FFFDF8] rounded-3xl p-10 sm:p-14 border border-[#E9E3D8] luxury-shadow">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#B75656]/10 text-[#B75656] flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <span className="text-xs uppercase font-sans tracking-[0.3em] text-[#B75656] font-semibold">
            CAPACITY REACHED / CLOSED
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#172536] mt-2 mb-4">
            REGISTRATION CLOSED
          </h2>
          <p className="text-sm text-[#576474] max-w-md mx-auto mb-8">
            Thank you for your overwhelming interest in Visual Intelligence 2.0. The event registration portal has concluded.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/leaderboard')}
              className="px-6 py-3 rounded-full bg-[#172536] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#96723C] transition-all cursor-pointer"
            >
              View Live Leaderboards
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-full bg-[#FFFDF8] border border-[#E9E3D8] text-[#172536] text-xs font-bold uppercase tracking-wider hover:bg-[#FAF8F3] transition-all cursor-pointer"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
      {/* Editorial Header */}
      <div className="text-center mb-10">
        <span className="text-xs uppercase font-sans tracking-[0.3em] text-[#96723C] font-semibold">
          PARTICIPANT ENROLLMENT
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-[#172536] mt-2 mb-3">
          Begin Your Journey
        </h1>
        <p className="font-serif italic text-lg sm:text-xl text-[#576474]">
          Register your team for Visual Intelligence 2.0.
        </p>

        {/* Capacity badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFDF8] border border-[#E9E3D8] text-xs text-[#576474] mt-4 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#39836A]" />
          <span>
            {currentCount} of {limit} Total Event Slots Claimed
          </span>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="bg-[#FFFDF8] rounded-3xl p-8 sm:p-12 border border-[#E9E3D8] luxury-shadow relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#96723C] via-[#C5A46D] to-[#E8D4A7]" />

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-[#B75656]/10 border border-[#B75656]/30 text-[#B75656] text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Classroom Selection */}
          <div>
            <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-2">
              1. Designated Classroom
            </label>
            <p className="text-xs text-[#576474] mb-3">
              Select your assigned competition room (K206, K207, K208, or K209).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CLASSROOMS.map((room) => {
                const isSelected = roomId === room;
                return (
                  <button
                    type="button"
                    key={room}
                    onClick={() => setRoomId(room)}
                    className={`py-3.5 px-4 rounded-xl border text-center transition-all cursor-pointer font-display font-semibold text-sm ${
                      isSelected
                        ? 'border-[#C5A46D] bg-[#E8D4A7]/20 text-[#172536] shadow-xs'
                        : 'border-[#E9E3D8] bg-[#FAF8F3] text-[#576474] hover:border-[#C5A46D]/50 hover:bg-[#FFFDF8]'
                    }`}
                  >
                    Room {room}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Team Name */}
          <div>
            <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-2">
              2. Team Name *
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Neural Artisans, Cyber Dynamos"
              className="w-full px-4 py-3.5 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none transition-all text-sm font-sans text-[#172536] placeholder-[#576474]/50"
            />
          </div>

          {/* 3. Team Leader Name */}
          <div>
            <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-2">
              3. Team Leader Name *
            </label>
            <input
              type="text"
              required
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="Full name of Team Leader"
              className="w-full px-4 py-3.5 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none transition-all text-sm font-sans text-[#172536] placeholder-[#576474]/50"
            />
          </div>

          {/* 4. Team Member Names (Dynamic 2 to 5 members) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536]">
                4. Team Member Names *
              </label>
              <span className="text-xs text-[#576474]">
                Total Team Size: {1 + members.filter((m) => m.trim().length > 0).length} / 6 (Min 3, Max 6)
              </span>
            </div>
            <p className="text-xs text-[#576474] mb-4">
              Enter 2 to 5 additional members (the team leader is participant #1).
            </p>

            <div className="space-y-3">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#96723C] w-6 text-right">
                    #{idx + 2}
                  </span>
                  <input
                    type="text"
                    required
                    value={member}
                    onChange={(e) => handleMemberChange(idx, e.target.value)}
                    placeholder={`Member ${idx + 2} Full Name`}
                    className="flex-1 px-4 py-3 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none transition-all text-sm font-sans text-[#172536] placeholder-[#576474]/50"
                  />
                  {members.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-3 text-[#576474] hover:text-[#B75656] rounded-xl hover:bg-[#FAF8F3] transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Member button if under 5 additional members */}
            {members.length < 5 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-2 rounded-lg border border-dashed border-[#C5A46D]/60 text-xs font-semibold text-[#96723C] hover:bg-[#E8D4A7]/15 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Team Member</span>
                </button>
              </div>
            )}
          </div>

          {/* Submission button */}
          <div className="pt-6 border-t border-[#E9E3D8] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#576474]">
              No login or payment required. Immediate room placement.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>REGISTERING TEAM...</span>
              ) : (
                <>
                  <span>CONFIRM REGISTRATION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
