export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });
  return res;
}
