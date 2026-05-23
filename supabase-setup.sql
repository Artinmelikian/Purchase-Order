-- Run this in the Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- 1. Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number       TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  department      TEXT NOT NULL,
  responsible     TEXT NOT NULL,
  purpose         TEXT NOT NULL,
  notes           TEXT,
  resp_sig_url    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'downloaded')),
  confirmed_at    TIMESTAMPTZ,
  download_count  INTEGER NOT NULL DEFAULT 0
);

-- 2. Purchase order items table
CREATE TABLE IF NOT EXISTS po_items (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id     UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  nn        INTEGER NOT NULL,
  code      TEXT,
  name      TEXT NOT NULL,
  unit      TEXT,
  quantity  TEXT
);

-- 3. Disable RLS (no login required — anyone with the link can access)
ALTER TABLE purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE po_items DISABLE ROW LEVEL SECURITY;

-- 4. Create the 'signatures' storage bucket
-- Go to: Storage → New bucket → Name: "signatures" → Public: ON
-- Or run via Supabase dashboard UI.

-- 5. (Optional) Storage bucket policy — allow all uploads
-- INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true)
-- ON CONFLICT (id) DO UPDATE SET public = true;
