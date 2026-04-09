import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingPage } from '../components/LandingPage';
import { LoginModal } from '../components/LoginModal';
import { showToast } from '../components/Toast';
import { getUsername, clearAuth, isAuthenticated } from '../auth';

type LocationState = {
  flashMessage?: string;
  redirectAfterLogin?: string;
};

export function LandingPageRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState<string | null>(getUsername);
  /** Avoid duplicate toasts when React Strict Mode runs effects twice in development */
  const flashShownForKeyRef = useRef<string | null>(null);

  const handleLogout = useCallback(() => {
    clearAuth();
    setUsername(null);
  }, []);

  /** 顶栏主动点「Login」：清掉此前访问受保护路由留下的 redirectAfterLogin，登录成功后留在首页 */
  const openLoginFromNavbar = useCallback(() => {
    navigate('/', { replace: true, state: {} });
    setShowLogin(true);
  }, [navigate]);

  const handleLoginSuccess = useCallback(() => {
    setUsername(getUsername());
    setShowLogin(false);
    const st = location.state as LocationState | null;
    if (st?.redirectAfterLogin) {
      navigate(st.redirectAfterLogin, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const st = location.state as LocationState | null;
    if (!st?.flashMessage) return;
    const dedupeKey = `${location.key}:${st.flashMessage}`;
    if (flashShownForKeyRef.current === dedupeKey) return;
    flashShownForKeyRef.current = dedupeKey;
    showToast(st.flashMessage, 'info');
    navigate('.', {
      replace: true,
      state: st.redirectAfterLogin ? { redirectAfterLogin: st.redirectAfterLogin } : undefined,
    });
  }, [location.state, navigate, location.key]);

  useEffect(() => {
    const st = location.state as LocationState | null;
    if (st?.redirectAfterLogin && !isAuthenticated()) {
      setShowLogin(true);
    }
  }, [location.state]);

  return (
    <>
      <LandingPage
        onLogin={openLoginFromNavbar}
        username={username}
        onLogout={handleLogout}
      />
      <LoginModal
        open={showLogin}
        onSuccess={handleLoginSuccess}
        onClose={() => setShowLogin(false)}
      />
    </>
  );
}
