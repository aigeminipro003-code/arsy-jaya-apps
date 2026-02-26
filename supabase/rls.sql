-- =============================================================
-- Arsy Jaya APPS Pro - Row Level Security
-- Run this AFTER triggers.sql in Supabase SQL Editor
-- =============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- PROFILES policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- MACHINES policies (readable by all, writable by admin)
CREATE POLICY "Anyone can view machines" ON public.machines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage machines" ON public.machines
  FOR ALL TO authenticated USING (public.is_admin());

-- MATERIALS policies (readable by all, writable by admin)
CREATE POLICY "Anyone can view materials" ON public.materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage materials" ON public.materials
  FOR ALL TO authenticated USING (public.is_admin());

-- Allow triggers to update materials stock
CREATE POLICY "System can update material stock" ON public.materials
  FOR UPDATE USING (true);

-- PRODUCTION LOGS policies
CREATE POLICY "Anyone can view production logs" ON public.production_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can insert production logs" ON public.production_logs
  FOR INSERT TO authenticated WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Admins can update/delete production logs" ON public.production_logs
  FOR ALL TO authenticated USING (public.is_admin());

-- STOCK MOVEMENTS policies
CREATE POLICY "Anyone can view stock movements" ON public.stock_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stock movements" ON public.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Admins can manage stock movements" ON public.stock_movements
  FOR ALL TO authenticated USING (public.is_admin());
