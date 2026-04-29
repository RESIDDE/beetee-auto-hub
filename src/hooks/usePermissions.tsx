import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PERMISSIONS, type PermissionsMap } from "@/lib/permissions";

const SETTINGS_KEY = "permissions";

async function fetchPermissions(): Promise<PermissionsMap> {
  const { data, error } = await (supabase as any)
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .single();

  if (error || !data) return { ...DEFAULT_PERMISSIONS };

  // Merge fetched data with defaults to handle any missing roles/pages
  const fetched = data.value as Partial<PermissionsMap>;
  return {
    admin:    fetched.admin    ?? DEFAULT_PERMISSIONS.admin,
    sales:    fetched.sales    ?? DEFAULT_PERMISSIONS.sales,
    mechanic: fetched.mechanic ?? DEFAULT_PERMISSIONS.mechanic,
  };
}

/**
 * Hook to read and write permissions from Supabase `app_settings`.
 * Falls back to DEFAULT_PERMISSIONS if the table row doesn't exist yet.
 */
export function usePermissions() {
  const queryClient = useQueryClient();

  const { data: permissions = DEFAULT_PERMISSIONS, isLoading } = useQuery<PermissionsMap>({
    queryKey: ["app_settings", "permissions"],
    queryFn: fetchPermissions,
    staleTime: 60 * 1000, // cache for 1 min — short enough to pick up live changes
  });

  const saveMutation = useMutation({
    mutationFn: async (newPerms: PermissionsMap) => {
      const { error } = await (supabase as any)
        .from("app_settings")
        .upsert({ key: SETTINGS_KEY, value: newPerms, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app_settings", "permissions"] });
    },
  });

  return {
    permissions,
    isLoading,
    savePermissions: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
