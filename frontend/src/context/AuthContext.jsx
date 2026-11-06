import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authApi } from "../api/auth.api";
import { tokenStore } from "../api/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const revision = useRef(0);
  function logout() {
    revision.current++;
    tokenStore.clear();
    setUser(null);
    setLoading(false);
    setSessionError("");
  }
  async function restore() {
    const version = ++revision.current;
    setLoading(true);
    setSessionError("");
    if (!tokenStore.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const result = await authApi.me();
      if (version === revision.current) setUser(result.user);
    } catch (error) {
      if (version !== revision.current) return;
      setUser(null);
      if ([401, 404].includes(error.status)) tokenStore.clear();
      else setSessionError(error.message);
    } finally {
      if (version === revision.current) setLoading(false);
    }
  }
  useEffect(() => {
    restore();
    const expired = () => {
      revision.current++;
      setUser(null);
      setLoading(false);
      setSessionError("Your session has expired. Please log in again.");
    };
    window.addEventListener("consultify:expired", expired);
    return () => {
      revision.current++;
      window.removeEventListener("consultify:expired", expired);
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    let timer;
    try {
      const payload = JSON.parse(
        atob(
          tokenStore.get().split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
        ),
      );
      const delay = payload.exp * 1000 - Date.now();
      const expire = () => {
        tokenStore.clear();
        window.dispatchEvent(new Event("consultify:expired"));
      };
      if (delay <= 0) expire();
      else timer = setTimeout(expire, Math.min(delay, 2147483647));
    } catch {
      logout();
    }
    return () => clearTimeout(timer);
  }, [user]);
  async function login(body) {
    const result = await authApi.login(body);
    revision.current++;
    tokenStore.set(result.token);
    setUser(result.user);
    setSessionError("");
    setLoading(false);
    return result.user;
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, sessionError, login, logout, restore }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
