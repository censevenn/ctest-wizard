
CREATE TABLE public.library_items (
  id TEXT NOT NULL PRIMARY KEY,
  guest_code TEXT NOT NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT 'Eigener Text',
  level TEXT NOT NULL DEFAULT 'Custom',
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_library_items_guest_code ON public.library_items(guest_code);

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

-- Guest-code based app (no auth). Anyone who knows a 6-digit code may read/write that code's items.
CREATE POLICY "Anyone can read library items by code"
  ON public.library_items FOR SELECT
  USING (guest_code ~ '^\d{6}$');

CREATE POLICY "Anyone can insert library items"
  ON public.library_items FOR INSERT
  WITH CHECK (guest_code ~ '^\d{6}$');

CREATE POLICY "Anyone can update library items"
  ON public.library_items FOR UPDATE
  USING (guest_code ~ '^\d{6}$');

CREATE POLICY "Anyone can delete library items"
  ON public.library_items FOR DELETE
  USING (guest_code ~ '^\d{6}$');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER library_items_set_updated_at
BEFORE UPDATE ON public.library_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
