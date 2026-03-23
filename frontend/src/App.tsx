import { useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Toaster } from 'sonner';
import { LoadingScreen } from './components/LoadingScreen';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import CustomCursor from './components/shared/CustomCursor';
import ScrollProgressBar from './components/shared/ScrollProgressBar';

import ScannerDashboardLayout from './pages/ScannerDashboardLayout.jsx';
import ScannerWorkspace from './pages/ScannerWorkspace.jsx';
import ScheduledRoute from './pages/ScheduledRoute.jsx';
import LegacyScanRedirect from './pages/LegacyScanRedirect.jsx';
import DocsPage from './pages/DocsPage.jsx';
import SecurityPage from './pages/SecurityPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProtectedRoute from './components/shared/ProtectedRoute.jsx';

function isScannerShell(pathname: string) {
  if (pathname.startsWith('/app')) return true;
  if (pathname === '/docs' || pathname === '/security') return true;
  return false;
}

export default function App() {
  const location = useLocation();
  const scannerMode = isScannerShell(location.pathname);
  const [isLoading, setIsLoading] = useState(location.pathname === '/');
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (location.pathname !== '/') {
      setIsLoading(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('scanner-mode', scannerMode);
  }, [scannerMode]);

  useEffect(() => {
    if (scannerMode) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      return;
    }
    const lenis = new Lenis({
      autoRaf: true,
      smoothWheel: true,
      duration: 1.2,
      lerp: 0.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [scannerMode]);

  // Session Timeout (30 minutes of inactivity)
  useEffect(() => {
    let timeoutId: number;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Automatically log out after 30 minutes
      timeoutId = window.setTimeout(() => {
        if (localStorage.getItem('sentinel_token')) {
          localStorage.removeItem('sentinel_token');
          window.location.href = '/#/login?expired=true';
        }
      }, 30 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    for (const e of events) {
      window.addEventListener(e, resetTimer, { passive: true });
    }
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      for (const e of events) {
        window.removeEventListener(e, resetTimer);
      }
    };
  }, []);

  const showMarketingChrome = !scannerMode;
  const showLandingLoader = location.pathname === '/' && isLoading;

  return (
    <>
      <Toaster theme="dark" position="bottom-right" />
      {showMarketingChrome && <CustomCursor />}
      {showMarketingChrome && <ScrollProgressBar />}
      {showLandingLoader && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className={showLandingLoader ? 'h-screen overflow-hidden' : ''}>
        <Routes>
          <Route path="/" element={<Home isLoading={isLoading} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app" element={<ProtectedRoute><ScannerDashboardLayout /></ProtectedRoute>}>
            <Route index element={<ScannerWorkspace />} />
            <Route path="scan/:scanId" element={<ScannerWorkspace />} />
            <Route path="scheduled" element={<ScheduledRoute />} />
          </Route>
          <Route path="/scheduled" element={<Navigate to="/app/scheduled" replace />} />
          <Route path="/scan/:scanId" element={<LegacyScanRedirect />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
