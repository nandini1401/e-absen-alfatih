import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Pencil,
  Plus,
  Trash2,
  FileDown,
  FileText,
  Users,
  BarChart3,
  CalendarRange,
  CalendarCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AdminGate, TombolLogoutAdmin } from "@/components/AdminGate";
import { PanelAbsen } from "@/components/PanelAbsen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  buatRekap,
  daftarBulan,
  fetchAbsensi,
  fetchSesi,
  fetchSiswa,
  NAMA_BULAN,
  type Siswa,
} from "@/lib/absensi";
import {
  exportBulananPDF,
  exportSemuaCSV,
  exportSemuaPDF,
  exportSiswaCSV,
  exportSiswaPDF,
} from "@/lib/export-rekap";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel Admin — E-Absensi SMPNT AL-FATIH" },
      {
        name: "description",
        content:
          "Kelola data siswa dan lihat rekap kehadiran total hadir, sakit, izin, dan alpa. Export rekap ke PDF dan CSV.",
      },
      { property: "og:title", content: "Panel Admin — E-Absensi SMPNT AL-FATIH" },
      { property: "og:description", content: "CRUD data siswa dan rekap absensi per siswa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HalamanAdminTerkunci,
});

function HalamanAdminTerkunci() {
  return (
    <AppShell>
      <AdminGate>
        <HalamanAdmin />
      </AdminGate>
    </AppShell>
  );
}

type FormSiswa = { id?: string; nama: string; kelas: string; jenis_kelamin: string };
const kosong: FormSiswa = { nama: "", kelas: "VII", jenis_kelamin: "Laki-laki" };

function HalamanAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormSiswa | null>(null);
  const [hapus, setHapus] = useState<Siswa | null>(null);
  const [periode, setPeriode] = useState<string>("");

  const siswaQ = useQuery({ queryKey: ["siswa"], queryFn: fetchSiswa });
  const sesiQ = useQuery({ queryKey: ["sesi"], queryFn: fetchSesi });
  const absenQ = useQuery({ queryKey: ["absensi"], queryFn: fetchAbsensi });

  const rekap = useMemo(
    () => buatRekap(siswaQ.data ?? [], sesiQ.data ?? [], absenQ.data ?? []),
    [siswaQ.data, sesiQ.data, absenQ.data],
  );

  const bulanTersedia = useMemo(() => daftarBulan(sesiQ.data ?? []), [sesiQ.data]);
  const periodeAktif = periode || (bulanTersedia[0] ? `${bulanTersedia[0].tahun}-${bulanTersedia[0].bulan}` : "");

  const totalL = (siswaQ.data ?? []).filter((s) => s.jenis_kelamin === "Laki-laki").length;
  const totalP = (siswaQ.data ?? []).filter((s) => s.jenis_kelamin === "Perempuan").length;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["siswa"] });
    qc.invalidateQueries({ queryKey: ["absensi"] });
  };

  const simpan = useMutation({
    mutationFn: async (data: FormSiswa) => {
      const payload = {
        nama: data.nama.trim(),
        kelas: data.kelas,
        jenis_kelamin: data.jenis_kelamin,
      };
      if (!payload.nama) throw new Error("Nama wajib diisi");
      if (data.id) {
        const { error } = await supabase.from("siswa").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("siswa").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Data siswa tersimpan");
      setForm(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hapusSiswa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("siswa").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Siswa dihapus");
      setHapus(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="navy-3d mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl px-6 py-6">
        <div>
          <h1 className="text-2xl font-bold">Panel Admin</h1>
          <p className="mt-1 text-sm opacity-80">
            Kelola data siswa dan pantau rekapitulasi kehadiran seluruh siswa.
          </p>
        </div>
        <TombolLogoutAdmin />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Siswa", nilai: rekap.length },
          { label: "Laki-laki", nilai: totalL },
          { label: "Perempuan", nilai: totalP },
        ].map((k) => (
          <div key={k.label} className="surface-3d rounded-2xl p-4 text-center">
            <p className="font-display text-3xl font-extrabold">{k.nilai}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="absen">
        <TabsList className="surface-3d h-11 rounded-xl p-1">
          <TabsTrigger value="absen" className="rounded-lg px-4">
            <CalendarCheck className="mr-2 size-4" /> Menu Absen
          </TabsTrigger>
          <TabsTrigger value="siswa" className="rounded-lg px-4">
            <Users className="mr-2 size-4" /> Data Siswa
          </TabsTrigger>
          <TabsTrigger value="rekap" className="rounded-lg px-4">
            <BarChart3 className="mr-2 size-4" /> Rekap Absensi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="absen" className="mt-5">
          <PanelAbsen />
        </TabsContent>

        <TabsContent value="siswa" className="mt-5">
          <div className="surface-3d rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Daftar Siswa ({rekap.length})</h2>
              <Button className="press-3d" onClick={() => setForm({ ...kosong })}>
                <Plus className="mr-2 size-4" /> Tambah Siswa
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="py-2 pr-3">No. Absen</th>
                    <th className="py-2 pr-3">Nama</th>
                    <th className="py-2 pr-3">Kelas</th>
                    <th className="py-2 pr-3">Jenis Kelamin</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((r) => (
                    <tr key={r.siswa.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-bold">{r.nomor}</td>
                      <td className="py-3 pr-3 font-medium">{r.siswa.nama}</td>
                      <td className="py-3 pr-3">{r.siswa.kelas}</td>
                      <td className="py-3 pr-3">{r.siswa.jenis_kelamin}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="press-3d mr-2"
                          onClick={() => setForm({ ...r.siswa })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="press-3d"
                          onClick={() => setHapus(r.siswa)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rekap.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Belum ada data siswa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rekap" className="mt-5">
          <div className="surface-3d rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Rekap Kehadiran per Siswa</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="press-3d"
                  onClick={() => exportSemuaCSV(rekap)}
                >
                  <FileDown className="mr-2 size-4" /> CSV Semua
                </Button>
                <Button className="press-3d" onClick={() => exportSemuaPDF(rekap)}>
                  <FileText className="mr-2 size-4" /> PDF Semua
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border p-4">
              <div className="space-y-1">
                <Label className="text-xs">Periode Bulan</Label>
                <Select value={periodeAktif} onValueChange={setPeriode}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulanTersedia.map((b) => (
                      <SelectItem key={`${b.tahun}-${b.bulan}`} value={`${b.tahun}-${b.bulan}`}>
                        {NAMA_BULAN[b.bulan]} {b.tahun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="press-3d"
                disabled={!periodeAktif || rekap.length === 0}
                onClick={() => {
                  const [t, b] = periodeAktif.split("-").map(Number);
                  exportBulananPDF(rekap, t, b);
                }}
              >
                <CalendarRange className="mr-2 size-4" /> PDF Absensi Bulanan (Tgl 1-31)
              </Button>
              <p className="text-xs text-muted-foreground">
                Berisi absen masuk & pulang tiap tanggal, berwarna (hadir biru, izin hijau, sakit
                kuning, alpa merah) dan total di kolom akhir.
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                    <th className="py-2 pr-3">No</th>
                    <th className="py-2 pr-3">Nama</th>
                    <th className="py-2 pr-3 text-center">Hadir</th>
                    <th className="py-2 pr-3 text-center">Sakit</th>
                    <th className="py-2 pr-3 text-center">Izin</th>
                    <th className="py-2 pr-3 text-center">Alpa</th>
                    <th className="py-2 text-right">Export</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((r) => (
                    <tr key={r.siswa.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-bold">{r.nomor}</td>
                      <td className="py-3 pr-3 font-medium">{r.siswa.nama}</td>
                      <td className="py-3 pr-3 text-center font-semibold text-success">{r.hadir}</td>
                      <td className="py-3 pr-3 text-center font-semibold text-warning">{r.sakit}</td>
                      <td className="py-3 pr-3 text-center font-semibold text-info">{r.izin}</td>
                      <td className="py-3 pr-3 text-center font-semibold text-danger">{r.alfa}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="press-3d mr-2"
                          onClick={() => exportSiswaCSV(r)}
                        >
                          CSV
                        </Button>
                        <Button size="sm" className="press-3d" onClick={() => exportSiswaPDF(r)}>
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {rekap.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama lengkap siswa"
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select
                    value={form.kelas}
                    onValueChange={(v) => setForm({ ...form, kelas: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["VII", "VII A", "VII B", "VII C"].map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jenis Kelamin</Label>
                  <Select
                    value={form.jenis_kelamin}
                    onValueChange={(v) => setForm({ ...form, jenis_kelamin: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForm(null)}>
              Batal
            </Button>
            <Button
              className="press-3d"
              disabled={simpan.isPending}
              onClick={() => form && simpan.mutate(form)}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!hapus} onOpenChange={(o) => !o && setHapus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus siswa?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Data absensi milik <b>{hapus?.nama}</b> juga akan ikut terhapus permanen.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHapus(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              className="press-3d"
              onClick={() => hapus && hapusSiswa.mutate(hapus.id)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
