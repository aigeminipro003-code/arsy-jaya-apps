-- =============================================================
-- Arsy Jaya APPS Pro - Database Schema
-- Run this in Supabase SQL Editor
-- =============================================================

-- PROFILES (extended user info, linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatically create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MACHINES
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default machines
INSERT INTO public.machines (name, brand_color, description) VALUES
  ('Omajic UV', '#3B82F6', 'UV Roll Printer'),
  ('Roland', '#F97316', 'Eco Solvent Printer'),
  ('UV Flatbed', '#A855F7', 'Flatbed UV Printer')
ON CONFLICT DO NOTHING;

-- MATERIALS
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  width_cm NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_stock_m NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock_m NUMERIC(10,2) NOT NULL DEFAULT 5,
  price_per_m NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTION LOGS
CREATE TABLE IF NOT EXISTS public.production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES public.profiles(id),
  machine_id UUID NOT NULL REFERENCES public.machines(id),
  material_id UUID NOT NULL REFERENCES public.materials(id),
  panjang_netto NUMERIC(10,2) NOT NULL CHECK (panjang_netto >= 0),
  bahan_bruto NUMERIC(10,2) NOT NULL CHECK (bahan_bruto >= 0),
  waste NUMERIC(10,2) GENERATED ALWAYS AS (bahan_bruto - panjang_netto) STORED,
  category TEXT NOT NULL CHECK (category IN ('order', 'tes_warna', 'maintenance', 'kerusakan')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STOCK MOVEMENTS (for stock in/out tracking)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity_m NUMERIC(10,2) NOT NULL,
  rolls INTEGER DEFAULT 0,
  panjang_per_roll NUMERIC(10,2) DEFAULT 0,
  operator_id UUID NOT NULL REFERENCES public.profiles(id),
  supplier TEXT,
  notes TEXT,
  -- Financial tracking (added v2)
  harga_per_satuan NUMERIC(15,2) NOT NULL DEFAULT 0,
  satuan_harga TEXT NOT NULL DEFAULT 'per_m' CHECK (satuan_harga IN ('per_m', 'per_roll')),
  total_harga_beli NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_logs_operator ON public.production_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_material ON public.production_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_machine ON public.production_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_created ON public.production_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON public.stock_movements(material_id);
