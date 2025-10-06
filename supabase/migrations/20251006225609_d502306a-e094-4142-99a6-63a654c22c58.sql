-- Fix 1: Change default role assignment from 'admin' to 'cliente'
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign 'cliente' role by default for security
  -- Admins must be promoted manually
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cliente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 2: Add comprehensive RLS policies for user_roles table
-- Only admins can insert roles
CREATE POLICY "Admins can assign roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Admins can revoke roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Create admin promotion function for secure role management
CREATE OR REPLACE FUNCTION public.promote_to_admin(_user_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only existing admins can promote users
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can promote users';
  END IF;
  
  -- Update role to admin
  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = _user_id;
  
  -- If no role exists, insert admin role
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix 4: Add RLS policies for profiles to prevent email harvesting
-- Only allow users to view profiles of clients assigned to their obras
CREATE POLICY "Admins can view client profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') AND
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.client_id = profiles.id
      AND obras.user_id = auth.uid()
  )
);

-- Allow users to view profiles of admins who manage their obras
CREATE POLICY "Clients can view their admin profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'cliente') AND
  EXISTS (
    SELECT 1 FROM public.obras
    WHERE obras.user_id = profiles.id
      AND obras.client_id = auth.uid()
  )
);