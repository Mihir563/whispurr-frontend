import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({ baseURL: API_BASE });

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = localStorage.getItem("refreshToken");
      if (!rt) throw new Error("No refresh token");
      const { data } = await axios.post(`${API_BASE}/auth/refreshtoken`, { refreshToken: rt });
      const newToken = data?.token;
      if (!newToken) throw new Error("Invalid refresh response");
      localStorage.setItem("token", newToken);
      return newToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};
    if (status === 401 && !original._retry) {
      original._retry = true;
      const hasRT = typeof window !== "undefined" && !!localStorage.getItem("refreshToken");
      if (!hasRT) {
        // guest or no refresh available: do not redirect; let caller handle
        return Promise.reject(err);
      }
      try {
        await refreshAccessToken();
        return api(original);
      } catch (e) {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
        } catch {}
        if (typeof window !== "undefined") {
          // expire auth cookie so middleware redirects
          document.cookie = `auth=; Path=/; Max-Age=0; SameSite=Lax`;
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);
