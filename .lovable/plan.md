

# Implement Full RBAC System

## Current State
- **Database**: `user_roles` table, `has_role()` function, `handle_new_user()` function all exist, but **no triggers are attached** (confirmed: "There are no triggers in the database")
- **Auth page**: exists at `src/pages/Auth.tsx` but no route guard — anyone can access the app without logging in
- **Settings page**: exists at `src/pages/Settings.tsx` but has no route in `App.tsx`
- **Sidebar**: no role-based filtering, no logout button, no user display
- **RLS**: all tables still use `public: true` (wide open)

## Step 1: Database Migration
Fix the trigger and tighten RLS in a single migration:

- **Attach trigger**: `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`
- **Tighten RLS** on `vehicles`, `customers`, `sales`, `repairs`, `invoices`, `inspections`, `inquiries`, `vehicle_images`, `invoice_repairs`: drop all `Public *` policies, replace with `authenticated`-only policies for all operations
- **Customer portal access**: add `anon` SELECT on `customers` (by phone) via the existing `get_customer_portal_data` security definer function — no direct anon table access needed

## Step 2: Auth Guard in AppLayout
- Wrap `AppLayout` with `AuthProvider` from `useAuth.tsx`
- Add auth check: if `isLoading`, show spinner; if no `user`, redirect to `/auth`
- Show logged-in user's name + role badge in the header, with a logout button

## Step 3: Role-Based Sidebar Visibility
Define which nav items each role can see:
- **Admin**: everything + Settings
- **Sales**: Dashboard, Vehicles, Customers, Sales, Invoices, Inquiries
- **Mechanic**: Dashboard, Repairs, Inspections

Filter the `items` array in `AppSidebar` using `useAuth().role`. Add Settings link for admins. Add logout button in sidebar footer.

## Step 4: Route Protection
- Add `/settings` route inside `AppLayout` routes
- Add `/auth` route outside `AppLayout` (public)
- Wrap `App` with `AuthProvider`
- In `AppLayout`, redirect to `/auth` if not authenticated

## Step 5: Settings Page Cleanup
The existing `Settings.tsx` already has role management UI. Just need to:
- Remove the "Force Claim Admin" dev button (or keep behind a flag)
- Ensure it's only accessible to admins (sidebar filtering + optional inline role check)

## Files Changed
| File | Action |
|------|--------|
| New migration | Attach trigger, tighten RLS |
| `src/App.tsx` | Add `AuthProvider`, `/auth` route, `/settings` route |
| `src/components/AppLayout.tsx` | Auth guard, user display, logout |
| `src/components/AppSidebar.tsx` | Role-based nav filtering, Settings link, logout in footer |
| `src/pages/Settings.tsx` | Minor cleanup |

## Technical Notes
- The `handle_new_user()` function already assigns `'admin'` to every new user. This should be changed to only assign admin to the first user and default to `'mechanic'` for subsequent users. This will be fixed in the migration.
- The `has_role()` function signature takes only `checking_role` (no user_id param) and uses `auth.uid()` internally — the Settings page cast `(supabase as any)` for `user_roles` because it's not in the generated types. This is fine.

