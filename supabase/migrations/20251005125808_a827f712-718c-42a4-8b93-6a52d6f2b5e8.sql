-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add client_id column to obras table to link projects to clients
ALTER TABLE public.obras ADD COLUMN client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update obras RLS policies to allow clients to view their assigned projects
CREATE POLICY "Clients can view their assigned obras"
ON public.obras
FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = user_id);

-- Update gastos RLS policies to allow clients to view gastos of their obras
CREATE POLICY "Clients can view gastos of their obras"
ON public.gastos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM obras
    WHERE obras.id = gastos.obra_id
    AND (obras.client_id = auth.uid() OR obras.user_id = auth.uid())
  )
);

-- Update receitas RLS policies to allow clients to view receitas of their obras
CREATE POLICY "Clients can view receitas of their obras"
ON public.receitas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM obras
    WHERE obras.id = receitas.obra_id
    AND (obras.client_id = auth.uid() OR obras.user_id = auth.uid())
  )
);

-- Function to automatically assign admin role to first user (for testing)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign admin role by default (you can change this logic as needed)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  RETURN NEW;
END;
$$;

-- Trigger to assign role on user creation
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();