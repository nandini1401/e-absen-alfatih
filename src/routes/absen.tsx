import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, Undo2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAbsensi,
  fetchSesi,
  fetchSiswa,
  formatTanggal,
  jamSekarang,
  STATUS_LABEL,
  STATUS_LIST,
  tanggalKey,
  type StatusAbsen,
} from "@/lib/absensi";

export const Route = createFileRoute("/absen")({
  head: () => ({
    meta: [
      { title: "Menu Absen Harian — E-Absensi SMPNT AL-FATIH" },
      {
        name: "description",
        content:
          "Catat kehadiran siswa SMPNT AL-FATIH per tanggal: hadir, sakit, izin, alpa, lengkap dengan jam absen dan tombol batal.",
      },
      { property: "og:title", content: "Menu Absen Harian — E-Absensi SMPNT AL-FATIH" },
      { property: "og:description", content: "Catat kehadiran siswa per sesi harian." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HalamanAbsen,
});

const gayaStatus: Record<StatusAbsen, string> = {
  hadir: "bg-success text-white hover:bg-success/90",
  sakit: "bg-warning text-black hover:bg-warning/90",
  izin: "bg-info text-white hover:bg-info/90",
  alfa: "bg-danger text-white hover:bg-danger/90",
};

function HalamanAbsen() {
  const qc = useQueryClient();
  const [tanggal, setTanggal] = useState<Date>(new Date());

  const siswaQ = useQuery({ queryKey: ["siswa"], queryFn: fetchSiswa });
  const sesiQ = useQuery({ queryKey: ["sesi"], queryFn: fetchSesi });
  const absenQ = useQuery({ queryKey: ["absensi"], queryFn: fetchAbsensi });

  const key = tanggalKey(tanggal);
  const sesiHariIni = (sesiQ.data ?? []).find((s) => s.tanggal === key);
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
      const { error } = await supabase.from("sesi_absen").insert({ tanggal: key });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sesi absen dibuka");
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

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="surface-3d h-fit rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CalendarCheck className="size-5" /> Kalender Sesi
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Tanggal bertanda navy adalah hari yang memiliki sesi absen.
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
            className="mt-3 rounded-xl border p-2"
          />
        </div>

        <div className="space-y-4">
          <div className="navy-3d flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4">
            <div>
              <p className="text-xs opacity-70">Sesi absen</p>
              <p className="font-display text-lg font-bold">{formatTanggal(key)}</p>
            </div>
            {!sesiHariIni && (
              <Button
                className="press-3d bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                onClick={() => bukaSesi.mutate()}
                disabled={bukaSesi.isPending}
              >
                <Plus className="mr-2 size-4" /> Buka Sesi Absen
              </Button>
            )}
          </div>

          {!sesiHariIni ? (
            <div className="surface-3d rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Belum ada sesi absen di tanggal ini. Klik “Buka Sesi Absen” untuk memulai.
            </div>
          ) : (siswaQ.data ?? []).length === 0 ? (
            <div className="surface-3d rounded-2xl p-8 text-center text-sm text-muted-foreground">
              Belum ada data siswa. Tambahkan lewat halaman Admin.
            </div>
          ) : (
            <div className="space-y-3">
              {(siswaQ.data ?? []).map((s, i) => {
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
    </AppShell>
  );
}
