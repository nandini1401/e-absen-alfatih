import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NAMA_SEKOLAH, type Siswa } from "@/lib/absensi";

/** Isi kode QR: dipakai untuk identifikasi siswa saat absen. */
export function isiQR(siswa: Siswa) {
  return `SMPNT-ALFATIH|${siswa.id}|${siswa.nama}`;
}

export function useQRDataUrl(siswa: Siswa | null) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    let aktif = true;
    if (!siswa) {
      setUrl("");
      return;
    }
    QRCode.toDataURL(isiQR(siswa), {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b1f3a", light: "#ffffff" },
    }).then((d) => aktif && setUrl(d));
    return () => {
      aktif = false;
    };
  }, [siswa]);
  return url;
}

export function DialogQRSiswa({
  siswa,
  nomor,
  onClose,
}: {
  siswa: Siswa | null;
  nomor?: number;
  onClose: () => void;
}) {
  const url = useQRDataUrl(siswa);

  const unduh = () => {
    if (!url || !siswa) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR-${siswa.nama.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  return (
    <Dialog open={!!siswa} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kode QR Siswa</DialogTitle>
        </DialogHeader>
        {siswa && (
          <div className="surface-3d flex flex-col items-center gap-3 rounded-2xl p-6">
            {url ? (
              <img
                src={url}
                alt={`Kode QR untuk ${siswa.nama}`}
                className="size-56 rounded-xl border bg-background p-2"
              />
            ) : (
              <div className="size-56 animate-pulse rounded-xl bg-muted" />
            )}
            <div className="text-center">
              <p className="font-display text-lg font-bold">{siswa.nama}</p>
              <p className="text-sm text-muted-foreground">
                No. Absen {nomor ?? "-"} &middot; Kelas {siswa.kelas}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{NAMA_SEKOLAH}</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button className="press-3d" disabled={!url} onClick={unduh}>
            <Download className="mr-2 size-4" /> Unduh PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
