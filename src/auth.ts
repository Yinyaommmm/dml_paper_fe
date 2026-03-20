const TOKEN_KEY = 'dml_token';
const USER_KEY  = 'dml_user';

export interface AuthState {
  token: string;
  username: string;
}

export function saveAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USER_KEY);
}

/** Decode JWT payload (no signature verification — server does that). */
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 > Date.now();
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: (data as { detail?: string }).detail ?? '登录失败' };
    }
    const data = await res.json() as { access_token: string; username: string };
    saveAuth(data.access_token, data.username);
    return { success: true };
  } catch {
    return { success: false, error: '网络错误，请稍后重试' };
  }
}
