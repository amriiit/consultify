import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi } from "../api/auth.api";
import { getToken, setToken } from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [token, updateToken] = useState(getToken);
  const logout = useCallback((expired = false) => {
    setToken(null);
    updateToken(null);
    setUser(null);
    setError("");
    setLoading(false);
    setNotice(expired ? "Your session has expired. Please sign in again." : "");
  }, []);
  const restore = useCallback(
    async (signal) => {
      const restoringToken = getToken();
      if (!restoringToken) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await authApi.me(signal);
        if (getToken() === restoringToken && !signal?.aborted)
          setUser(data.user);
      } catch (e) {
        if (e.name === "AbortError" || getToken() !== restoringToken) return;
        if ([401, 404].includes(e.status)) logout(true);
        else setError(e.message);
      } finally {
        if (!signal?.aborted && getToken() === restoringToken)
          setLoading(false);
      }
    },
    [logout],
  );
  useEffect(() => {
    const controller = new AbortController();
    restore(controller.signal);
    return () => controller.abort();
  }, [restore]);
  useEffect(() => {
    const expired = () => logout(true);
    window.addEventListener("consultify:expired", expired);
    return () => window.removeEventListener("consultify:expired", expired);
  }, [logout]);
  useEffect(() => {
    if (!token) return;
    try {
      const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const remaining = JSON.parse(atob(encoded)).exp * 1000 - Date.now();
      if (remaining <= 0) {
        logout(true);
        return;
      }
      const timer = setTimeout(
        () => logout(true),
        Math.min(remaining, 2147483647),
      );
      return () => clearTimeout(timer);
    } catch {
      logout(true);
    }
  }, [token, logout]);
  async function login(body) {
    const data = await authApi.login(body);
    const persisted = setToken(data.token);
    updateToken(data.token);
    setUser(data.user);
    setLoading(false);
    setError("");
    setNotice(
      persisted
        ? ""
        : "Session storage is unavailable. You will need to sign in again after refreshing.",
    );
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, notice, login, logout, restore }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
