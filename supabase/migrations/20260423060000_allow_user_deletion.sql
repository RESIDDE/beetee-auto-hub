-- Migration: Allow user deletion by Super Admins

-- 1. Ensure Super Admins can delete from user_roles
CREATE POLICY "Super Admins can delete user roles" ON public.user_roles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- 2. Ensure Super Admins can delete from profiles
CREATE POLICY "Super Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);
