import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface IntroExperienceProps {
  onComplete: () => void;
}

export const IntroExperience: React.FC<IntroExperienceProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  // step 0: initial ambient halo (0ms)
  // step 1: VISUAL (500ms)
  // step 2: INTELLIGENCE (1100ms)
  // step 3: 2.0 (1700ms)
  // step 4: Underline & Subtitle (2200ms)
  // step 5: Powered by AI/ML x ACM (2600ms)
  // step 6: Complete & transition (3500ms)

  useEffect(() => {
    // Check if reduced motion is requested
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 950);
    const t3 = setTimeout(() => setStep(3), 1500);
    const t4 = setTimeout(() => setStep(4), 2050);
    const t5 = setTimeout(() => setStep(5), 2550);
    const t6 = setTimeout(() => {
      setStep(6);
      setTimeout(onComplete, 500);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('vi2_intro_seen', 'true');
    onComplete();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF8F3] transition-opacity duration-700 ${
        step === 6 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Soft Champagne Light & Concentric Rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          className={`w-[600px] h-[600px] rounded-full blur-[100px] bg-[#E8D4A7]/30 transition-all duration-1000 ${
            step >= 1 ? 'scale-110 opacity-70' : 'scale-75 opacity-30'
          }`}
        />
        <div
          className={`absolute w-[440px] h-[440px] rounded-full border border-[#C5A46D]/20 transition-all duration-1000 ${
            step >= 1 ? 'scale-100 opacity-60' : 'scale-50 opacity-0'
          }`}
        />
        <div
          className={`absolute w-[620px] h-[620px] rounded-full border border-[#C5A46D]/15 transition-all duration-1000 ${
            step >= 2 ? 'scale-100 opacity-40' : 'scale-70 opacity-0'
          }`}
        />
      </div>

      {/* Main Title Reveal Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        <div className="text-xs uppercase tracking-[0.35em] text-[#96723C] font-display mb-4 transition-all duration-700 opacity-80">
          The Royal Edition • 14 October 2026
        </div>

        {/* Word-by-Word Reveal */}
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl tracking-tight leading-[1.05] flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6">
          {/* Word 1: VISUAL */}
          <span className="overflow-hidden inline-block py-1">
            <span
              className={`inline-block transition-all duration-700 ease-out text-[#172536] font-semibold ${
                step >= 1
                  ? 'translate-y-0 opacity-100 blur-0'
                  : 'translate-y-12 opacity-0 blur-sm'
              }`}
            >
              VISUAL
            </span>
          </span>

          {/* Word 2: INTELLIGENCE */}
          <span className="overflow-hidden inline-block py-1">
            <span
              className={`inline-block transition-all duration-700 ease-out text-[#172536] font-semibold ${
                step >= 2
                  ? 'translate-y-0 opacity-100 blur-0'
                  : 'translate-y-12 opacity-0 blur-sm'
              }`}
            >
              INTELLIGENCE
            </span>
          </span>

          {/* Word 3: 2.0 */}
          <span className="overflow-hidden inline-block py-1">
            <span
              className={`inline-block transition-all duration-700 ease-out font-display font-bold gold-accent-text ${
                step >= 3
                  ? 'translate-y-0 opacity-100 blur-0'
                  : 'translate-y-12 opacity-0 blur-sm'
              }`}
            >
              2.0
            </span>
          </span>
        </h1>

        {/* Dynamic Underline Drawing */}
        <div className="w-full max-w-md h-[1.5px] bg-[#E9E3D8] mt-4 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#96723C] via-[#C5A46D] to-[#96723C] transition-all duration-1000 ease-out"
            style={{
              width: step >= 4 ? '100%' : '0%',
              opacity: step >= 4 ? 1 : 0,
            }}
          />
        </div>

        {/* Scene 3: Tagline */}
        <p
          className={`font-serif italic text-lg sm:text-2xl text-[#576474] mt-4 transition-all duration-700 ease-out ${
            step >= 4
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0'
          }`}
        >
          Where Creativity Meets Intelligence
        </p>

        {/* Organizer Branding */}
        <div
          className={`mt-6 pt-6 border-t border-[#E9E3D8]/70 flex flex-col items-center transition-all duration-700 ease-out ${
            step >= 5
              ? 'translate-y-0 opacity-100'
              : 'translate-y-4 opacity-0'
          }`}
        >
          <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] text-[#96723C] uppercase mb-1">
            Powered By
          </span>
          <div className="font-display font-semibold tracking-wider text-xs sm:text-sm text-[#172536] flex items-center gap-2">
            <span>DIVISION OF AI/ML</span>
            <span className="text-[#C5A46D]">×</span>
            <span>ACM STUDENT CHAPTER</span>
          </div>
        </div>
      </div>

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 text-xs font-sans font-medium text-[#576474] hover:text-[#172536] hover:bg-[#FFFDF8] px-4 py-2 rounded-full border border-[#E9E3D8] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        aria-label="Skip introductory animation"
      >
        <span>Skip Intro</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
