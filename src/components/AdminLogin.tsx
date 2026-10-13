import React, { useState } from 'react';
import { adminLogin } from '../lib/api';
import { Shield, Eye, EyeOff, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  navigate: (route: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, navigate }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the administrator password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminLogin(password);
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid administrator credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
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

        <p className="font-serif italic text-sm text-[#576474] mb-8">
          Authorized Event Management Access
        </p>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#B75656]/10 border border-[#B75656]/30 text-[#B75656] text-xs text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter admin password"
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

        <div className="mt-8 pt-6 border-t border-[#E9E3D8] flex items-center justify-between text-xs text-[#576474]">
          <button
            onClick={() => navigate('/')}
            className="hover:text-[#172536] transition-colors cursor-pointer"
          >
            ← Return to Homepage
          </button>
          <span className="text-[10px] uppercase tracking-wider text-[#96723C]">
            Division of AI/ML
          </span>
        </div>
      </div>
    </div>
  );
};
