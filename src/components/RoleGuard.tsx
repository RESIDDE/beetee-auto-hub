import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { canAccess, type PageKey, type AppRole } from "@/lib/permissions";

interface RoleGuardProps {
  page: PageKey;
  children: React.ReactNode;
}

/**
 * Wraps a protected route. Reads live permissions from Supabase.
 * If the user's role doesn't have view access for this page,
 * redirects to /unauthorized.
 */
export function RoleGuard({ page, children }: RoleGuardProps) {
  const { role, isLoading: authLoading } = useAuth();
  const { permissions, isLoading: permsLoading } = usePermissions();

  // Still resolving auth or permissions — let it through while loading
  if (authLoading || permsLoading) return <>{children}</>;

  if (!canAccess(role as AppRole | null, page, permissions)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
