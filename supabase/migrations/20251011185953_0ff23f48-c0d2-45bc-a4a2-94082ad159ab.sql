-- Fix client registration trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Create categorias table
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'receita')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(nome, tipo, user_id)
);

-- Enable RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categorias
CREATE POLICY "Users can view their own categorias"
  ON public.categorias
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorias"
  ON public.categorias
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorias"
  ON public.categorias
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorias"
  ON public.categorias
  FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default categories for gastos
INSERT INTO public.categorias (nome, tipo, user_id)
SELECT 'Material', 'gasto', id FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.categorias (nome, tipo, user_id)
SELECT 'Mão de Obra', 'gasto', id FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.categorias (nome, tipo, user_id)
SELECT 'Equipamento', 'gasto', id FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.categorias (nome, tipo, user_id)
SELECT 'Transporte', 'gasto', id FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.categorias (nome, tipo, user_id)
SELECT 'Outros', 'gasto', id FROM auth.users WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
ON CONFLICT DO NOTHING;