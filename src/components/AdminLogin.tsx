import React, { useState } from 'react';
import { adminLogin, adminSupabaseLogin } from '../lib/api';
import { isSupabaseConfigured } from '../lib/supabase';
import { Shield, Eye, EyeOff, Lock, ArrowRight, AlertCircle, KeyRound, UserCheck, HelpCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  navigate: (route: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, navigate }) => {
  const [authMode, setAuthMode] = useState<'master_key' | 'supabase'>('master_key');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [boardPassword, setBoardPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBoardPassword, setShowBoardPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMasterKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setError('Please enter the administrator master key.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminLogin(cleanPassword);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid administrator credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !boardPassword) {
      setError('Please enter both your ACM member email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminSupabaseLogin(email, boardPassword);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Supabase authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-20">
      <div className="bg-[#FFFDF8] rounded-3xl p-8 sm:p-10 border border-[#E9E3D8] luxury-shadow relative overflow-hidden text-center">
        {/* Subtle top gold accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#96723C] via-[#C5A46D] to-[#E8D4A7]" />

        {/* Shield Icon container */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FAF8F3] border border-[#E9E3D8] flex items-center justify-center text-[#96723C] mb-6 shadow-xs">
          <Shield className="w-8 h-8" />
        </div>

        <span className="text-[11px] uppercase font-sans tracking-[0.25em] text-[#96723C] font-semibold">
          RESTRICTED PROTOCOL
        </span>

        <h2 className="font-serif text-3xl font-bold text-[#172536] mt-1 mb-2">
          Competition Control Center
        </h2>

        <p className="font-serif italic text-sm text-[#576474] mb-6">
          Authorized Event Management Access
        </p>

        {/* Auth Method Selector */}
        <div className="mb-6 p-1 bg-[#FAF8F3] rounded-xl border border-[#E9E3D8] flex gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('master_key');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-sans font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'master_key'
                ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                : 'text-[#576474] hover:text-[#172536]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Master Key</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('supabase');
              setError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-sans font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'supabase'
                ? 'bg-[#172536] text-[#FFFDF8] shadow-xs'
                : 'text-[#576474] hover:text-[#172536]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ACM Account</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#B75656]/10 border border-[#B75656]/30 text-[#B75656] text-xs text-left flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Authentication Alert</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {authMode === 'master_key' ? (
          <form onSubmit={handleMasterKeySubmit} className="space-y-6">
            <div className="text-left">
              <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-2">
                Administrator Master Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#576474]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator master key"
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none transition-all text-sm font-sans text-[#172536]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#576474] hover:text-[#172536] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#576474] font-sans flex items-center justify-between">
                <span>Default Master Key:</span>
                <code className="text-[#96723C] font-semibold bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E9E3D8] text-xs">
                  ACM@1109
                </code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <span>VERIFYING CREDENTIALS...</span>
              ) : (
                <>
                  <span>UNLOCK CONTROL CENTER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleBoardMemberSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-1.5">
                ACM Member Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="board.member@acm.org"
                className="w-full px-3.5 py-3 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none transition-all text-sm font-sans text-[#172536]"
              />
            </div>

            <div className="text-left">
              <label className="block text-xs uppercase font-sans font-bold tracking-wider text-[#172536] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showBoardPassword ? 'text' : 'password'}
                  required
                  value={boardPassword}
                  onChange={(e) => setBoardPassword(e.target.value)}
                  placeholder="Enter account password"
                  className="w-full pl-3.5 pr-11 py-3 rounded-xl border border-[#E9E3D8] bg-[#FAF8F3] focus:bg-[#FFFDF8] focus:border-[#C5A46D] focus:outline-none transition-all text-sm font-sans text-[#172536]"
                />
                <button
                  type="button"
                  onClick={() => setShowBoardPassword(!showBoardPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#576474] hover:text-[#172536] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showBoardPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isSupabaseConfigured && (
              <div className="p-3 rounded-xl bg-[#FAF8F3] border border-[#E9E3D8] text-[11px] text-[#576474] text-left flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#96723C] shrink-0 mt-0.5" />
                <span>
                  Supabase Auth is enabled when <code className="text-[#96723C]">VITE_SUPABASE_URL</code> and{' '}
                  <code className="text-[#96723C]">VITE_SUPABASE_ANON_KEY</code> are configured. You can also sign in using the Master Key.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#172536] hover:bg-[#96723C] text-[#FFFDF8] font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>AUTHENTICATING BOARD MEMBER...</span>
              ) : (
                <>
                  <span>SIGN IN AS BOARD MEMBER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#E9E3D8] flex items-center justify-between text-xs text-[#576474]">
          <button
            onClick={() => navigate('/')}
            className="hover:text-[#172536] transition-colors cursor-pointer"
          >
            ← Return to Homepage
          </button>
          <span className="text-[10px] uppercase tracking-wider text-[#96723C]">
            Division of AI/ML × ACM
          </span>
        </div>
      </div>
    </div>
  );
};
