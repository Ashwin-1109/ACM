import React, { useState, useEffect } from 'react';
import { LuxuryBackground } from './components/LuxuryBackground';
import { IntroExperience } from './components/IntroExperience';
import { EventHeader } from './components/EventHeader';
import { HomePortalCards } from './components/HomePortalCards';
import { RegistrationForm } from './components/RegistrationForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { ClassroomManager } from './components/ClassroomManager';
import { LeaderboardView } from './components/LeaderboardView';
import { fetchEventInfo, verifyAdminSession } from './lib/api';
import { useRealtime } from './hooks/useRealtime';
import { ClassroomId, CLASSROOMS } from './types';
import { Sparkles, Calendar, Award } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    // Only show intro on homepage if not previously seen in this session
    if (window.location.pathname === '/') {
      return !sessionStorage.getItem('vi2_intro_seen');
    }
    return false;
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [eventData, setEventData] = useState<{
    total_registered: number;
    registration_limit: number;
  }>({ total_registered: 0, registration_limit: 100 });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check admin session token validity
  useEffect(() => {
    verifyAdminSession()
      .then((valid) => setIsAdminAuthenticated(valid))
      .catch(() => setIsAdminAuthenticated(false))
      .finally(() => setAuthChecking(false));
  }, []);

  const loadEventInfo = () => {
    fetchEventInfo()
      .then((info) => {
        setEventData({
          total_registered: info.total_registered,
          registration_limit: info.registration_limit,
        });
      })
      .catch((err) => console.error(err));
  };

  // Fetch initial event info (counts, etc.)
  useEffect(() => {
    loadEventInfo();
  }, [currentPath]);

  // Global realtime updates
  useRealtime({
    onRegistrationCreated: () => loadEventInfo(),
    onSettingsUpdated: () => loadEventInfo(),
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('vi2_intro_seen', 'true');
    setShowIntro(false);
  };

  // Route matching
  const renderContent = () => {
    // 1. Homepage: '/'
    if (currentPath === '/' || currentPath === '') {
      return (
        <div>
          {/* Hero Section */}
          <section className="pt-16 sm:pt-24 pb-10 text-center px-4 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFDF8] border border-[#C5A46D]/50 text-xs text-[#96723C] uppercase tracking-[0.25em] font-sans font-semibold mb-6 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>An Experience in Creative Intelligence</span>
            </div>

            <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight text-[#172536] leading-[1.05] mb-4">
              VISUAL <br className="hidden sm:inline" />
              <span className="gold-accent-text">INTELLIGENCE 2.0</span>
            </h1>

            <p className="font-serif italic text-2xl sm:text-3xl text-[#576474] max-w-2xl mx-auto mb-6">
              Think Beyond. Create Beyond. Compete Beyond.
            </p>

            <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-display tracking-wider text-[#172536] mb-10">
              <span>POWERED BY DIVISION OF AI/ML</span>
              <span className="text-[#C5A46D]">×</span>
              <span>ACM STUDENT CHAPTER</span>
            </div>

            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#C5A46D] to-transparent mx-auto" />
          </section>

          {/* Three Primary Navigation Cards */}
          <HomePortalCards
            navigate={navigate}
            registeredCount={eventData.total_registered}
            registrationLimit={eventData.registration_limit}
          />

          {/* Prestige Information Footer Strip */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#E9E3D8]/80 text-center text-xs text-[#576474]">
            <p className="font-serif italic text-sm mb-1">
              Visual Intelligence 2.0 — The Royal Edition • October 14, 2026
            </p>
            <p className="font-sans text-[11px] uppercase tracking-wider text-[#96723C]">
              Division of AI/ML × ACM Student Chapter • Classrooms K206, K207, K208, K209
            </p>
          </div>
        </div>
      );
    }

    // 2. Student Registration: '/register'
    if (currentPath === '/register') {
      return <RegistrationForm navigate={navigate} />;
    }

    // 3. Admin Control Center: '/admin', '/admin/dashboard'
    if (currentPath === '/admin' || currentPath === '/admin/dashboard') {
      if (authChecking) {
        return (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#C5A46D] border-t-transparent animate-spin" />
          </div>
        );
      }

      if (!isAdminAuthenticated) {
        return (
          <AdminLogin
            onSuccess={() => {
              setIsAdminAuthenticated(true);
              navigate('/admin/dashboard');
            }}
            navigate={navigate}
          />
        );
      }

      return (
        <AdminDashboard
          navigate={navigate}
          onLogout={() => setIsAdminAuthenticated(false)}
        />
      );
    }

    // 4. Admin Classroom Management: '/admin/room/:roomId'
    if (currentPath.startsWith('/admin/room/')) {
      const roomId = currentPath.split('/admin/room/')[1]?.toUpperCase() as ClassroomId;
      if (!CLASSROOMS.includes(roomId)) {
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-serif font-bold text-[#172536]">Classroom Not Found</h2>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="mt-4 px-6 py-2 rounded-full bg-[#172536] text-white text-xs font-bold"
            >
              Return to Dashboard
            </button>
          </div>
        );
      }

      if (!isAdminAuthenticated) {
        return (
          <AdminLogin
            onSuccess={() => setIsAdminAuthenticated(true)}
            navigate={navigate}
          />
        );
      }

      return <ClassroomManager roomId={roomId} navigate={navigate} />;
    }

    // 5. Live Leaderboards: '/leaderboard', '/leaderboard/overall', '/leaderboard/:roomId'
    if (currentPath.startsWith('/leaderboard')) {
      let roomTarget: ClassroomId | 'overall' = 'overall';
      if (currentPath.includes('/leaderboard/overall')) {
        roomTarget = 'overall';
      } else {
        const seg = currentPath.split('/leaderboard/')[1]?.toUpperCase();
        if (seg && CLASSROOMS.includes(seg as ClassroomId)) {
          roomTarget = seg as ClassroomId;
        }
      }

      return <LeaderboardView initialRoom={roomTarget} navigate={navigate} />;
    }

    // Default fallback to homepage
    return <HomePortalCards navigate={navigate} registeredCount={eventData.total_registered} registrationLimit={eventData.registration_limit} />;
  };

  return (
    <LuxuryBackground>
      {/* Cinematic Intro (plays once or when replayed) */}
      {showIntro && <IntroExperience onComplete={handleIntroComplete} />}

      {/* Main Persistent Event Header */}
      <EventHeader
        currentRoute={currentPath}
        navigate={navigate}
        onReplayIntro={handleReplayIntro}
      />

      {/* Route Content */}
      <main className="relative z-10">{renderContent()}</main>
    </LuxuryBackground>
  );
}
