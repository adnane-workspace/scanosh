import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchCurrentUser, loginRequest, logoutRequest, verifyEmailRequest } from '../services/auth.service.js';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/constants.js';
import { parseHost } from '../utils/hosts.js';
import { AuthContext } from './auth-context.js';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function persistSession(token, user) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

function isPublicMenuSurface(pathname, hostname) {
  const host = parseHost(hostname);
  if (host.kind === 'menu') return true;
  return String(pathname || '').startsWith('/menu/');
}

export function AuthProvider({ children }) {
  const { pathname } = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [isReady, setIsReady] = useState(!localStorage.getItem(TOKEN_STORAGE_KEY));

  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem(TOKEN_STORAGE_KEY)) {
        await logoutRequest();
      }
    } catch {
      // Token is cleared locally even if the API call fails.
    }

    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token: nextToken, user: nextUser } = await loginRequest({ email, password });
    persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const verifyEmail = useCallback(async (email, code) => {
    const { token: nextToken, user: nextUser } = await verifyEmailRequest({ email, code });
    persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const acceptSession = useCallback((nextToken, nextUser) => {
    persistSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    if (!token || isPublicMenuSurface(pathname, window.location.hostname)) {
      setIsReady(true);
      return undefined;
    }

    let cancelled = false;

    fetchCurrentUser()
      .then((nextUser) => {
        if (!cancelled) {
          persistSession(token, nextUser);
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, pathname]);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      isAuthenticated: Boolean(token),
      login,
      verifyEmail,
      acceptSession,
      logout,
    }),
    [token, user, isReady, login, verifyEmail, acceptSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
