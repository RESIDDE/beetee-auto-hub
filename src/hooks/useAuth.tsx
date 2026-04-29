import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/logger";

type AuthState = {
  user: User | null;
  profile: any | null;
  role: "super_admin" | "admin" | "sales" | "mechanic" | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    isLoading: true,
  });
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const setUserAndLoadExtras = (user: User) => {
      if (mounted) {
        setState((prev) => ({ ...prev, user }));
        userIdRef.current = user.id;
      }

      Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single(),
      ])
        .then(([{ data: profile }, { data: roleData }]) => {
          if (mounted) {
            setState((prev) => ({
              ...prev,
              profile: profile || null,
              role: roleData?.role ?? null,
              isLoading: false,
            }));
          }
        })
        .catch((err) => {
          console.warn("Could not load profile/role extras:", err);
          if (mounted) {
            setState((prev) => ({ ...prev, isLoading: false, role: null }));
          }
        });
    };


    // ── 1. Resolve initial session ──────────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("getSession error:", error);
        setState({ user: null, profile: null, role: null, isLoading: false });
        return;
      }

      if (session?.user) {
        userIdRef.current = session.user.id;
        setUserAndLoadExtras(session.user);
      } else {
        setState({ user: null, profile: null, role: null, isLoading: false });
      }
    });

    // ── 2. React to subsequent auth events (login, logout, token refresh) ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // INITIAL_SESSION is handled above via getSession() to avoid duplicate work
      if (event === "INITIAL_SESSION") return;

      if (session?.user) {
        if (event === "SIGNED_IN") {
          logAction("LOGIN", "Auth", session.user.id);
        }
        userIdRef.current = session.user.id;
        setUserAndLoadExtras(session.user);
      } else {
        if (event === "SIGNED_OUT") {
          // Use ref to log who actually logged out before state was cleared
          logAction("LOGOUT", "Auth", null, {}, userIdRef.current || undefined);
          userIdRef.current = null;
        }
        setState({ user: null, profile: null, role: null, isLoading: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
