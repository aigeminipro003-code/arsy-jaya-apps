-- =============================================================
-- Machine maintenance & ink replacement logs — schema + RLS
-- Jalankan di Supabase SQL Editor jika tabel trx_* sudah ada
-- tapi data tidak tampil (SELECT gagal / RLS memfilter baris).
-- =============================================================

-- Pastikan kolom pencatat (untuk RLS & tampilan)
ALTER TABLE IF EXISTS public.trx_maintenance_log
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

ALTER TABLE IF EXISTS public.trx_ink_log
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Default agar insert dari client tanpa kolom tetap terisi
ALTER TABLE IF EXISTS public.trx_maintenance_log
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE IF EXISTS public.trx_ink_log
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE IF EXISTS public.trx_maintenance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trx_ink_log ENABLE ROW LEVEL SECURITY;

-- trx_maintenance_log
DROP POLICY IF EXISTS "trx_maintenance_select_authenticated" ON public.trx_maintenance_log;
CREATE POLICY "trx_maintenance_select_authenticated" ON public.trx_maintenance_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "trx_maintenance_insert_own" ON public.trx_maintenance_log;
CREATE POLICY "trx_maintenance_insert_own" ON public.trx_maintenance_log
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "trx_maintenance_admin_all" ON public.trx_maintenance_log;
CREATE POLICY "trx_maintenance_admin_all" ON public.trx_maintenance_log
  FOR ALL TO authenticated USING (public.is_admin());

-- trx_ink_log
DROP POLICY IF EXISTS "trx_ink_select_authenticated" ON public.trx_ink_log;
CREATE POLICY "trx_ink_select_authenticated" ON public.trx_ink_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "trx_ink_insert_own" ON public.trx_ink_log;
CREATE POLICY "trx_ink_insert_own" ON public.trx_ink_log
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "trx_ink_admin_all" ON public.trx_ink_log;
CREATE POLICY "trx_ink_admin_all" ON public.trx_ink_log
  FOR ALL TO authenticated USING (public.is_admin());
