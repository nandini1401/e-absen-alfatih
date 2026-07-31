import { supabase } from "@/integrations/supabase/client";

export type StatusAbsen = "hadir" | "sakit" | "izin" | "alfa";

export const STATUS_LIST: StatusAbsen[] = ["hadir", "sakit", "izin", "alfa"];

export const STATUS_LABEL: Record<StatusAbsen, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alfa: "Alpa",
};

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
    .select("id, tanggal, judul")
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

export type RekapSiswa = {
  siswa: Siswa;
  nomor: number;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  total: number;
  harian: { tanggal: string; status: StatusAbsen; jam: string | null }[];
};

export function buatRekap(
  siswaList: Siswa[],
  sesiList: Sesi[],
  absensiList: Absensi[],
): RekapSiswa[] {
  const sesiById = new Map(sesiList.map((s) => [s.id, s]));
  const urut = urutkanSiswa(siswaList);
  return urut.map((siswa, i) => {
    const rows = absensiList
      .filter((a) => a.siswa_id === siswa.id)
      .map((a) => ({
        tanggal: sesiById.get(a.sesi_id)?.tanggal ?? "",
        status: a.status,
        jam: a.jam,
      }))
      .filter((r) => r.tanggal)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

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
