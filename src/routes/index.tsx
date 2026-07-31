import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, FileDown, FileText, CalendarDays, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buatRekap,
  fetchAbsensi,
  fetchSesi,
  fetchSiswa,
  formatTanggal,
  NAMA_SEKOLAH,
  STATUS_LABEL,
  type RekapSiswa,
} from "@/lib/absensi";
import { exportSiswaCSV, exportSiswaPDF } from "@/lib/export-rekap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Orang Tua — E-Absensi SMPNT AL-FATIH" },
      {
        name: "description",
        content:
          "Cek kehadiran anak Anda di SMPNT AL-FATIH. Masukkan nama lengkap siswa untuk melihat rekap hadir, sakit, izin, dan alpa.",
      },
      { property: "og:title", content: "Portal Orang Tua — E-Absensi SMPNT AL-FATIH" },
      {
        property: "og:description",
        content: "Masukkan nama lengkap anak untuk melihat rekap absensi hariannya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PortalOrangTua,
});

const warnaStatus: Record<string, string> = {
  hadir: "bg-success/15 text-success",
  sakit: "bg-warning/15 text-warning",
  izin: "bg-info/15 text-info",
  alfa: "bg-danger/15 text-danger",
};

function PortalOrangTua() {
  const [input, setInput] = useState("");
  const [dicari, setDicari] = useState("");

  const siswaQ = useQuery({ queryKey: ["siswa"], queryFn: fetchSiswa });
  const sesiQ = useQuery({ queryKey: ["sesi"], queryFn: fetchSesi });
  const absenQ = useQuery({ queryKey: ["absensi"], queryFn: fetchAbsensi });

  const rekap: RekapSiswa[] = useMemo(
    () => buatRekap(siswaQ.data ?? [], sesiQ.data ?? [], absenQ.data ?? []),
    [siswaQ.data, sesiQ.data, absenQ.data],
  );

  const hasil = useMemo(() => {
    const q = dicari.trim().toLowerCase();
    if (!q) return null;
    return rekap.find((r) => r.siswa.nama.trim().toLowerCase() === q) ?? null;
  }, [dicari, rekap]);

  const memuat = siswaQ.isLoading || sesiQ.isLoading || absenQ.isLoading;

  return (
    <AppShell>
      <section className="navy-3d rounded-3xl px-6 py-10 text-center sm:px-12 sm:py-14">
        <p className="text-[11px] font-semibold tracking-[0.3em] opacity-70">PORTAL ORANG TUA</p>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{NAMA_SEKOLAH}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm opacity-80">
          Halaman ini bersifat privat. Masukkan <b>nama lengkap anak</b> Anda persis seperti yang
          terdaftar di sekolah untuk melihat detail kehadirannya.
        </p>

        <form
          className="mx-auto mt-7 flex max-w-lg flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setDicari(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contoh: Ahmad Fauzi Rahman"
            className="h-12 border-0 bg-primary-foreground text-foreground shadow-inner"
          />
          <Button type="submit" size="lg" className="press-3d h-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Search className="mr-2 size-4" /> Cari
          </Button>
        </form>
      </section>

      {dicari && !memuat && !hasil && (
        <div className="surface-3d mt-8 rounded-2xl p-6 text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Data tidak ditemukan</p>
          <p className="text-sm text-muted-foreground">
            Pastikan penulisan nama lengkap sudah benar dan sesuai data sekolah.
          </p>
        </div>
      )}

      {hasil && (
        <div className="mt-8 space-y-6">
          <div className="surface-3d rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{hasil.siswa.nama}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  No. Absen {hasil.nomor} · Kelas {hasil.siswa.kelas} · {hasil.siswa.jenis_kelamin}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="press-3d" onClick={() => exportSiswaCSV(hasil)}>
                  <FileDown className="mr-2 size-4" /> CSV
                </Button>
                <Button className="press-3d" onClick={() => exportSiswaPDF(hasil)}>
                  <FileText className="mr-2 size-4" /> PDF
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["hadir", "sakit", "izin", "alfa"] as const).map((s) => (
                <div key={s} className="surface-3d rounded-xl p-4 text-center">
                  <p className="text-3xl font-extrabold">{hasil[s]}</p>
                  <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {STATUS_LABEL[s]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-3d rounded-2xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <CalendarDays className="size-5" /> Riwayat Absen Harian
            </h3>
            {hasil.harian.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Belum ada riwayat absensi.</p>
            ) : (
              <ul className="mt-4 divide-y">
                {hasil.harian.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="text-sm font-medium">{formatTanggal(h.tanggal)}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{h.jam ?? "-"}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${warnaStatus[h.status]}`}
                      >
                        {STATUS_LABEL[h.status]}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
