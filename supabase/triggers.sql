-- =============================================================
-- Arsy Jaya APPS Pro - Database Triggers
-- Run this AFTER schema.sql in Supabase SQL Editor
-- =============================================================

-- TRIGGER 1: Auto-deduct stock when a production log is inserted
CREATE OR REPLACE FUNCTION public.deduct_stock_on_production()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.materials
  SET
    total_stock_m = total_stock_m - NEW.bahan_bruto,
    updated_at = NOW()
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_stock_on_production ON public.production_logs;
CREATE TRIGGER trg_deduct_stock_on_production
  AFTER INSERT ON public.production_logs
  FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_production();


-- TRIGGER 2: Handle stock adjustment when a production log is UPDATED (admin edit)
CREATE OR REPLACE FUNCTION public.adjust_stock_on_production_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Reverse old deduction, apply new deduction
  UPDATE public.materials
  SET
    total_stock_m = total_stock_m + OLD.bahan_bruto - NEW.bahan_bruto,
    updated_at = NOW()
  WHERE id = NEW.material_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_update ON public.production_logs;
CREATE TRIGGER trg_adjust_stock_on_update
  AFTER UPDATE ON public.production_logs
  FOR EACH ROW
  WHEN (OLD.bahan_bruto IS DISTINCT FROM NEW.bahan_bruto OR OLD.material_id IS DISTINCT FROM NEW.material_id)
  EXECUTE FUNCTION public.adjust_stock_on_production_update();


-- TRIGGER 3: Auto-add stock when a stock movement (type=in) is inserted
CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.movement_type = 'in' THEN
    UPDATE public.materials
    SET
      total_stock_m = total_stock_m + NEW.quantity_m,
      updated_at = NOW()
    WHERE id = NEW.material_id;
  ELSIF NEW.movement_type = 'out' THEN
    UPDATE public.materials
    SET
      total_stock_m = total_stock_m - NEW.quantity_m,
      updated_at = NOW()
    WHERE id = NEW.material_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_stock_on_movement ON public.stock_movements;
CREATE TRIGGER trg_update_stock_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_on_movement();
