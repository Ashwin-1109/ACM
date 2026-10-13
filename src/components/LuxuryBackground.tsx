import React from 'react';

export const LuxuryBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F3] text-[#172536] overflow-x-hidden">
      {/* Dynamic ambient luxury light effects */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft champagne-gold ambient glow in top center */}
        <div
          className="absolute -top-36 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-45 mix-blend-multiply transition-all duration-1000 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #E8D4A7 0%, rgba(197, 164, 109, 0.3) 50%, transparent 75%)',
            animationDuration: '10s',
          }}
        />

        {/* Soft ice blue and pearl glow in bottom right */}
        <div
          className="absolute -bottom-48 right-[-10%] w-[700px] h-[700px] rounded-full blur-[160px] opacity-30"
          style={{
            background: 'radial-gradient(circle, #DCE9F3 0%, rgba(220, 233, 243, 0.4) 60%, transparent 80%)',
          }}
        />

        {/* Soft golden ambient left flank with breathing animation */}
        <div
          className="absolute top-1/3 -left-36 w-[550px] h-[550px] rounded-full blur-[140px] opacity-25 animate-pulse"
          style={{
            background: 'radial-gradient(circle, #E8D4A7 0%, rgba(150, 114, 60, 0.2) 70%, transparent 85%)',
            animationDuration: '14s',
          }}
        />

        {/* Subtle AI geometric grid pattern */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.035]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="ai-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#172536" strokeWidth="0.8" />
              <circle cx="24" cy="24" r="1" fill="#C5A46D" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ai-grid)" />
        </svg>

        {/* Decorative thin concentric gold architectural arcs with gentle rotation */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[980px] h-[490px] border border-[#C5A46D]/15 rounded-b-[490px] pointer-events-none" />
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[820px] h-[410px] border border-[#C5A46D]/10 rounded-b-[410px] pointer-events-none" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[660px] h-[330px] border border-[#C5A46D]/10 rounded-b-[330px] pointer-events-none" />

        {/* Floating Luxury Gold Dust Particles */}
        <div className="absolute top-1/4 left-[15%] w-2 h-2 rounded-full bg-[#C5A46D]/30 blur-[1px] animate-ping" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 right-[18%] w-1.5 h-1.5 rounded-full bg-[#E8D4A7]/50 blur-[0.5px] animate-ping" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 left-[25%] w-2 h-2 rounded-full bg-[#96723C]/25 blur-[1px] animate-ping" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-1/4 right-[28%] w-1.5 h-1.5 rounded-full bg-[#C5A46D]/35 blur-[0.5px] animate-ping" style={{ animationDuration: '9s' }} />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
