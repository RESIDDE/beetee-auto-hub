import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  profile: any | null;
  role: "admin" | "sales" | "mechanic" | null;
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

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await loadUserExtras(session.user);
        } else {
          if (mounted) setState({ user: null, profile: null, role: null, isLoading: false });
        }
      } catch (error) {
        console.error("Session error:", error);
        if (mounted) setState({ user: null, profile: null, role: null, isLoading: false });
      }
    };

    const loadUserExtras = async (user: User) => {
      try {
        const [{ data: profile }, { data: roleData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single(),
        ]);
        
        if (mounted) {
          setState({
            user,
            profile: profile || null,
            role: roleData?.role || "mechanic",
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Error loading user extras:", error);
        if (mounted) setState({ user, profile: null, role: null, isLoading: false });
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore INITIAL_SESSION as fetchSession() handles the initial load 
      // preventing duplicate simultaneous database queries.
      if (event === 'INITIAL_SESSION') return;
      
      if (session?.user) {
        await loadUserExtras(session.user);
      } else {
        if (mounted) setState({ user: null, profile: null, role: null, isLoading: false });
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
