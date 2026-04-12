import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ShieldAlert, User, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Settings() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: usersData = [], isLoading, error: queryError } = useQuery({
    queryKey: ["users-roles"],
    queryFn: async () => {
      const [{ data: roles, error: rolesError }, { data: profiles, error: profilesError }] = await Promise.all([
        (supabase as any).from("user_roles").select("*"),
        (supabase as any).from("profiles").select("*")
      ]);

      if (rolesError) {
         if (rolesError.code === 'PGRST205') throw new Error("TABLE_MISSING");
         throw rolesError;
      }
      if (profilesError) throw profilesError;

      return roles.map((r: any) => ({
        ...r,
        profiles: profiles.find((p: any) => p.user_id === r.user_id) || null
      }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, newRole }: { id: string, newRole: string }) => {
      const { error } = await (supabase as any)
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-roles"] });
      toast.success("Role updated successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-8 animate-fade-up max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium uppercase tracking-wider text-emerald-500">Administration</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 tracking-tight">
            User Roles & Settings
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Manage your team's access levels and assign roles across the platform.
          </p>
        </div>
        <div className="shrink-0 bg-red-500/10 p-3 rounded-2xl border border-red-500/20">
          <p className="text-xs text-red-500 mb-2 font-bold uppercase tracking-wider text-center">Dev Only</p>
          <Button 
             variant="destructive" 
             className="w-full shadow-lg shadow-red-500/20"
             onClick={async () => {
               if (!user) return toast.error("Not logged in");
               const { error } = await (supabase as any)
                 .from("user_roles")
                 .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });
               
               if (error) {
                 toast.error("Database blocked the claim: " + error.message);
               } else {
                 toast.success("Role claimed! Refreshing...");
                 setTimeout(() => window.location.reload(), 1000);
               }
             }}
          >
            Force Claim Admin
          </Button>
        </div>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] mix-blend-screen pointer-events-none" />
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-500" /> Team Directory
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
               <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : queryError?.message === 'TABLE_MISSING' ? (
          <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center animate-fade-in relative overflow-hidden">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4 relative z-10" />
            <h3 className="text-xl font-bold mb-2 relative z-10">Database Migration Required</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto relative z-10">
              The user role settings require a database structure that hasn't been set up yet. An admin must run the authentication SQL migration in the Supabase console.
            </p>
            <div className="bg-background/80 p-4 rounded-xl border border-white/5 text-sm font-mono text-left max-w-2xl mx-auto overflow-x-auto relative z-10">
              <p className="text-amber-500 mb-2">/* Please run the contents of this file in your Supabase SQL Editor: */</p>
              <p className="text-muted-foreground">supabase/migrations/20260412000000_auth_roles_rls.sql</p>
            </div>
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-destructive/20 blur-[60px] pointer-events-none rounded-full" />
          </div>
        ) : usersData.length === 0 ? (
          <div className="text-center p-8 border border-white/5 bg-white/5 rounded-2xl">
            <p className="text-muted-foreground mb-4">No users found in the system yet.</p>
            <p className="text-xs text-muted-foreground opacity-60">Make sure users have signed up before assigning roles.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {usersData.map((u: any) => {
              const profile = u.profiles;
              const isSelf = u.user_id === user?.id;
              return (
                <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl transition-colors border ${isSelf ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background/40 hover:bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${isSelf ? 'bg-amber-500 text-white' : 'bg-foreground/10 text-foreground'}`}>
                      {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        {profile?.display_name || "Unknown User"}
                        {isSelf && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 tracking-wider uppercase">You</span>}
                      </h3>
                      <p className="text-sm text-muted-foreground">{profile?.phone || "No phone provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {u.role === "admin" && <ShieldAlert className="h-4 w-4 text-emerald-500" />}
                    {u.role === "sales" && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                    
                    <Select
                      value={u.role}
                      onValueChange={(val) => {
                         if (isSelf && val !== "admin") {
                            if (!window.confirm("Warning: Removing your own admin role means you won't be able to access this page anymore. Proceed?")) return;
                         }
                         updateRole.mutate({ id: u.id, newRole: val });
                      }}
                      disabled={updateRole.isPending}
                    >
                      <SelectTrigger className="w-[140px] rounded-xl bg-background/50 border-white/10 h-10 font-medium z-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel font-medium rounded-xl">
                        <SelectItem value="mechanic" className="rounded-lg">Mechanic</SelectItem>
                        <SelectItem value="sales" className="rounded-lg">Sales</SelectItem>
                        <SelectItem value="admin" className="rounded-lg font-bold text-emerald-500">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
