import { supabase } from "@/integrations/supabase/client";

export type StatusAbsen = "hadir" | "sakit" | "izin" | "alfa";
export type JenisSesi = "masuk" | "pulang";

export const STATUS_LIST: StatusAbsen[] = ["hadir", "sakit", "izin", "alfa"];

export const STATUS_LABEL: Record<StatusAbsen, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alpa",
};

export const STATUS_KODE: Record<StatusAbsen, string> = {
  hadir: "H",
  sakit: "S",
  izin: "I",
  alfa: "A",
};

/** Warna cetak (RGB) sesuai permintaan: hadir biru, izin hijau, sakit kuning, alfa merah. */
export const STATUS_RGB: Record<StatusAbsen, [number, number, number]> = {
  hadir: [37, 99, 235],
  izin: [22, 163, 74],
  sakit: [234, 179, 8],
  alfa: [220, 38, 38],
};

export const JENIS_LABEL: Record<JenisSesi, string> = {
  masuk: "Absen Masuk",
  pulang: "Absen Pulang",
};

export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export type Siswa = {
  id: string;
  nama: string;
  kelas: string;
  jenis_kelamin: string;
  created_at: string;
};

export type Sesi = {
  id: string;
  tanggal: string;
  judul: string;
  jenis: JenisSesi;
};

export type Absensi = {
  id: string;
  sesi_id: string;
  siswa_id: string;
  status: StatusAbsen;
  jam: string | null;
};

export const NAMA_SEKOLAH = "SMPNT AL - FATIH";

export function urutkanSiswa(list: Siswa[]): Siswa[] {
  return [...list].sort((a, b) => a.nama.localeCompare(b.nama, "id", { sensitivity: "base" }));
}

/** Nomor absen mengikuti urutan nama A-Z. */
export function nomorAbsen(list: Siswa[], id: string): number {
  return urutkanSiswa(list).findIndex((s) => s.id === id) + 1;
}

export function tanggalKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatTanggal(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function jamSekarang(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function fetchSiswa(): Promise<Siswa[]> {
  const { data, error } = await supabase.from("siswa").select("*").order("nama");
  if (error) throw error;
  return urutkanSiswa((data ?? []) as Siswa[]);
}

export async function fetchSesi(): Promise<Sesi[]> {
  const { data, error } = await supabase
    .from("sesi_absen")
    .select("id, tanggal, judul, jenis")
    .order("tanggal", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Sesi[];
}

export async function fetchAbsensi(): Promise<Absensi[]> {
  const { data, error } = await supabase
    .from("absensi")
    .select("id, sesi_id, siswa_id, status, jam");
  if (error) throw error;
  return (data ?? []) as Absensi[];
}

export type BarisHarian = {
  tanggal: string;
  jenis: JenisSesi;
  status: StatusAbsen;
  jam: string | null;
};

export type RekapSiswa = {
  siswa: Siswa;
  nomor: number;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  total: number;
  harian: BarisHarian[];
};

export function buatRekap(
  siswaList: Siswa[],
  sesiList: Sesi[],
  absensiList: Absensi[],
): RekapSiswa[] {
  const sesiById = new Map(sesiList.map((s) => [s.id, s]));
  const urut = urutkanSiswa(siswaList);
  return urut.map((siswa, i) => {
    const rows: BarisHarian[] = absensiList
      .filter((a) => a.siswa_id === siswa.id)
      .map((a) => {
        const sesi = sesiById.get(a.sesi_id);
        return {
          tanggal: sesi?.tanggal ?? "",
          jenis: (sesi?.jenis ?? "masuk") as JenisSesi,
          status: a.status,
          jam: a.jam,
        };
      })
      .filter((r) => r.tanggal)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jenis.localeCompare(b.jenis));

    const hitung = (s: StatusAbsen) => rows.filter((r) => r.status === s).length;
    return {
      siswa,
      nomor: i + 1,
      hadir: hitung("hadir"),
      sakit: hitung("sakit"),
      izin: hitung("izin"),
      alfa: hitung("alfa"),
      total: rows.length,
      harian: rows,
    };
  });
}

/** Matriks tanggal 1-31 untuk satu siswa, satu jenis sesi, pada bulan tertentu. */
export function matriksBulanan(
  rekap: RekapSiswa,
  tahun: number,
  bulan: number,
  jenis: JenisSesi,
): {
  sel: (BarisHarian | null)[];
  total: Record<StatusAbsen, number>;
} {
  const sel: (BarisHarian | null)[] = Array.from({ length: 31 }, () => null);
  const total: Record<StatusAbsen, number> = { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
  for (const h of rekap.harian) {
    if (h.jenis !== jenis) continue;
    const [y, m, d] = h.tanggal.split("-").map(Number);
    if (y !== tahun || m !== bulan + 1) continue;
    sel[d - 1] = h;
    total[h.status] += 1;
  }
  return { sel, total };
}

export function daftarBulan(sesiList: Sesi[]): { tahun: number; bulan: number }[] {
  const set = new Set<string>();
  for (const s of sesiList) {
    const [y, m] = s.tanggal.split("-").map(Number);
    set.add(`${y}-${m - 1}`);
  }
  if (set.size === 0) {
    const now = new Date();
    set.add(`${now.getFullYear()}-${now.getMonth()}`);
  }
  return [...set]
    .map((k) => {
      const [tahun, bulan] = k.split("-").map(Number);
      return { tahun, bulan };
    })
    .sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan);
}
