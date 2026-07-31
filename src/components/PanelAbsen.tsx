import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, Undo2, Plus, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAbsensi,
  fetchSesi,
  fetchSiswa,
  formatTanggal,
  jamSekarang,
  JENIS_LABEL,
  STATUS_LABEL,
  STATUS_LIST,
  tanggalKey,
  type JenisSesi,
  type StatusAbsen,
} from "@/lib/absensi";

const gayaStatus: Record<StatusAbsen, string> = {
  hadir: "bg-success text-white hover:bg-success/90",
  sakit: "bg-warning text-black hover:bg-warning/90",
  izin: "bg-info text-white hover:bg-info/90",
  alfa: "bg-danger text-white hover:bg-danger/90",
};

export function PanelAbsen() {
  const qc = useQueryClient();
  const [tanggal, setTanggal] = useState<Date>(new Date());
  const [jenis, setJenis] = useState<JenisSesi>("masuk");

  const siswaQ = useQuery({ queryKey: ["siswa"], queryFn: fetchSiswa });
  const sesiQ = useQuery({ queryKey: ["sesi"], queryFn: fetchSesi });
  const absenQ = useQuery({ queryKey: ["absensi"], queryFn: fetchAbsensi });

  const key = tanggalKey(tanggal);
  const sesiHariIni = (sesiQ.data ?? []).find((s) => s.tanggal === key && s.jenis === jenis);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sesi"] });
    qc.invalidateQueries({ queryKey: ["absensi"] });
  };

  const tanggalSesi = useMemo(
    () =>
      (sesiQ.data ?? []).map((s) => {
        const [y, m, d] = s.tanggal.split("-").map(Number);
        return new Date(y, m - 1, d);
      }),
    [sesiQ.data],
  );

  const bukaSesi = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("sesi_absen")
        .insert({ tanggal: key, jenis, judul: JENIS_LABEL[jenis] });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${JENIS_LABEL[jenis]} dibuka`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ siswaId, status }: { siswaId: string; status: StatusAbsen }) => {
      if (!sesiHariIni) throw new Error("Sesi belum dibuka");
      const { error } = await supabase.from("absensi").upsert(
        {
          sesi_id: sesiHariIni.id,
          siswa_id: siswaId,
          status,
          jam: jamSekarang(),
        },
        { onConflict: "sesi_id,siswa_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Absen tersimpan");
      qc.invalidateQueries({ queryKey: ["absensi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const batal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("absensi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Absen dibatalkan");
      qc.invalidateQueries({ queryKey: ["absensi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const absenSesi = (absenQ.data ?? []).filter((a) => a.sesi_id === sesiHariIni?.id);
  const siswa = siswaQ.data ?? [];
  const hitung = (s: StatusAbsen) => absenSesi.filter((a) => a.status === s).length;
  const belum = siswa.length - absenSesi.length;

  const ringkasan: { label: string; nilai: number; kelas: string }[] = [
    { label: "Hadir", nilai: hitung("hadir"), kelas: "text-success" },
    { label: "Sakit", nilai: hitung("sakit"), kelas: "text-warning" },
    { label: "Izin", nilai: hitung("izin"), kelas: "text-info" },
    { label: "Alpa", nilai: hitung("alfa"), kelas: "text-danger" },
  ];

  return (
    <>
      <div className="navy-3d mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
        <div>
          <p className="text-xs opacity-70">Sesi absen</p>
          <p className="font-display text-lg font-bold">{formatTanggal(key)}</p>
        </div>
        <Tabs value={jenis} onValueChange={(v) => setJenis(v as JenisSesi)}>
          <TabsList className="h-10 bg-primary-foreground/10">
            <TabsTrigger value="masuk" className="px-4 text-xs sm:text-sm">
              <LogIn className="mr-2 size-4" /> Absen Masuk
            </TabsTrigger>
            <TabsTrigger value="pulang" className="px-4 text-xs sm:text-sm">
              <LogOut className="mr-2 size-4" /> Absen Pulang
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="surface-3d rounded-2xl p-4">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <CalendarCheck className="size-5" /> Kalender Sesi
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Tanggal bertanda navy memiliki sesi absen.
            </p>
            <Calendar
              mode="single"
              required
              selected={tanggal}
              onSelect={(d) => d && setTanggal(d)}
              modifiers={{ sesi: tanggalSesi }}
              modifiersClassNames={{
                sesi: "bg-navy text-primary-foreground font-bold rounded-md shadow-[0_4px_10px_-4px_rgba(0,0,0,0.6)]",
              }}
              className="mt-3 w-full rounded-xl border p-2"
            />
          </div>

          <div className="surface-3d rounded-2xl p-4">
            <p className="text-sm font-bold">Ringkasan {JENIS_LABEL[jenis]}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {ringkasan.map((r) => (
                <div key={r.label} className="rounded-xl border p-3 text-center">
                  <p className={`text-xl font-extrabold ${r.kelas}`}>{r.nilai}</p>
                  <p className="text-[11px] text-muted-foreground">{r.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Belum diabsen: <b>{Math.max(belum, 0)}</b> dari {siswa.length} siswa.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {!sesiHariIni ? (
            <div className="surface-3d rounded-2xl p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Belum ada {JENIS_LABEL[jenis].toLowerCase()} di tanggal ini.
              </p>
              <Button
                className="press-3d mt-4"
                onClick={() => bukaSesi.mutate()}
                disabled={bukaSesi.isPending}
              >
                <Plus className="mr-2 size-4" /> Buka {JENIS_LABEL[jenis]}
              </Button>
            </div>
          ) : siswa.length === 0 ? (
            <div className="surface-3d rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Belum ada data siswa. Tambahkan lewat tab Data Siswa.
            </div>
          ) : (
            <div className="space-y-3">
              {siswa.map((s, i) => {
                const rec = absenSesi.find((a) => a.siswa_id === s.id);
                return (
                  <div key={s.id} className="surface-3d rounded-2xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy text-sm font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold">{s.nama}</p>
                          <p className="text-xs text-muted-foreground">
                            Kelas {s.kelas} · {s.jenis_kelamin}
                            {rec ? ` · ${STATUS_LABEL[rec.status]} ${rec.jam ?? ""}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_LIST.map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={rec?.status === st ? "default" : "outline"}
                            className={`press-3d ${rec?.status === st ? gayaStatus[st] : ""}`}
                            onClick={() => setStatus.mutate({ siswaId: s.id, status: st })}
                          >
                            {STATUS_LABEL[st]}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!rec}
                          onClick={() => rec && batal.mutate(rec.id)}
                        >
                          <Undo2 className="mr-1 size-4" /> Batal
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
