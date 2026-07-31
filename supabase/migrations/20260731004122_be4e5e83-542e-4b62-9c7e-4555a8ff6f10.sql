CREATE TYPE public.status_absen AS ENUM ('hadir','sakit','izin','alfa');

CREATE TABLE public.siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL DEFAULT 'VII',
  jenis_kelamin TEXT NOT NULL DEFAULT 'Laki-laki',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.siswa TO anon, authenticated;
GRANT ALL ON public.siswa TO service_role;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "siswa akses publik" ON public.siswa FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sesi_absen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL UNIQUE,
  judul TEXT NOT NULL DEFAULT 'Absen Harian',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sesi_absen TO anon, authenticated;
GRANT ALL ON public.sesi_absen TO service_role;
ALTER TABLE public.sesi_absen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sesi akses publik" ON public.sesi_absen FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.absensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sesi_id UUID NOT NULL REFERENCES public.sesi_absen(id) ON DELETE CASCADE,
  siswa_id UUID NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  status public.status_absen NOT NULL,
  jam TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sesi_id, siswa_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.absensi TO anon, authenticated;
GRANT ALL ON public.absensi TO service_role;
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "absensi akses publik" ON public.absensi FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_absensi_siswa ON public.absensi(siswa_id);
CREATE INDEX idx_absensi_sesi ON public.absensi(sesi_id);