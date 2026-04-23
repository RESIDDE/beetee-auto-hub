-- Migration: Disable automatic role assignment for new users (Pending Approval state)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Create a profile for the new user
  -- This ensures they show up in the Team list for the Super Admin
  INSERT INTO public.profiles (user_id, display_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');

  -- 2. Role assignment
  -- We ONLY auto-assign 'admin' to the first user in the system.
  -- All subsequent users will have NO role by default, requiring Super Admin approval.
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$$;
