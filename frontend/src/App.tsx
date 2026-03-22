import { useEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { LoadingScreen } from './components/LoadingScreen';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import CustomCursor from './components/shared/CustomCursor';
import ScrollProgressBar from './components/shared/ScrollProgressBar';

import ScannerPage from './pages/ScannerPage.jsx';
import DocsPage from './pages/DocsPage.jsx';
import SecurityPage from './pages/SecurityPage.jsx';
import ScheduledPage from './ScheduledPage.jsx';

function isScannerShell(pathname: string) {
  if (pathname === '/app' || pathname === '/scheduled' || pathname === '/docs' || pathname === '/security') {
    return true;
  }
  return pathname.startsWith('/scan');
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

  const showMarketingChrome = !scannerMode;
  const showLandingLoader = location.pathname === '/' && isLoading;

  return (
    <>
      {showMarketingChrome && <CustomCursor />}
      {showMarketingChrome && <ScrollProgressBar />}
      {showLandingLoader && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className={showLandingLoader ? 'h-screen overflow-hidden' : ''}>
        <Routes>
          <Route path="/" element={<Home isLoading={isLoading} />} />
          <Route path="/app" element={<ScannerPage />} />
          <Route path="/scan/:scanId" element={<ScannerPage />} />
          <Route path="/scheduled" element={<ScheduledPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
