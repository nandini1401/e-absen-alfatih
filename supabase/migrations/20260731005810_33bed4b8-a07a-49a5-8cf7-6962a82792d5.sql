DO $$ BEGIN
  CREATE TYPE public.jenis_sesi AS ENUM ('masuk','pulang');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.sesi_absen ADD COLUMN IF NOT EXISTS jenis public.jenis_sesi NOT NULL DEFAULT 'masuk';
ALTER TABLE public.sesi_absen DROP CONSTRAINT IF EXISTS sesi_absen_tanggal_key;
ALTER TABLE public.sesi_absen ADD CONSTRAINT sesi_absen_tanggal_jenis_key UNIQUE (tanggal, jenis);