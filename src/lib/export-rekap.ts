import jsPDF from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  formatTanggal,
  JENIS_LABEL,
  matriksBulanan,
  NAMA_BULAN,
  NAMA_SEKOLAH,
  STATUS_KODE,
  STATUS_LABEL,
  STATUS_RGB,
  type JenisSesi,
  type RekapSiswa,
  type StatusAbsen,
} from "./absensi";

function tandaStatus(status: StatusAbsen): string {
  return status === "hadir" ? "." : STATUS_LABEL[status];
}

function unduh(blob: Blob, nama: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, "-");
}

export function exportSiswaCSV(rekap: RekapSiswa) {
  const baris: string[][] = [
    ["Sekolah", NAMA_SEKOLAH],
    ["No. Absen", String(rekap.nomor)],
    ["Nama", rekap.siswa.nama],
    ["Kelas", rekap.siswa.kelas],
    ["Jenis Kelamin", rekap.siswa.jenis_kelamin],
    [],
    ["Total Hadir", String(rekap.hadir)],
    ["Total Sakit", String(rekap.sakit)],
    ["Total Izin", String(rekap.izin)],
    ["Total Alpa", String(rekap.alfa)],
    [],
    ["Tanggal", "Sesi", "Keterangan", "Jam"],
    ...rekap.harian.map((h) => [
      h.tanggal,
      JENIS_LABEL[h.jenis],
      tandaStatus(h.status),
      h.jam ?? "-",
    ]),
  ];
  const csv = baris
    .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  unduh(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
    `rekap-${slug(rekap.siswa.nama)}.csv`,
  );
}

export function exportSiswaPDF(rekap: RekapSiswa) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(NAMA_SEKOLAH, 14, 16);
  doc.setFontSize(11);
  doc.text("REKAP ABSENSI HARIAN SISWA", 14, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`No. Absen : ${rekap.nomor}`, 14, 32);
  doc.text(`Nama         : ${rekap.siswa.nama}`, 14, 38);
  doc.text(`Kelas         : ${rekap.siswa.kelas}`, 14, 44);
  doc.text(`Jenis Kelamin : ${rekap.siswa.jenis_kelamin}`, 110, 32);
  doc.text(
    `Hadir ${rekap.hadir} | Sakit ${rekap.sakit} | Izin ${rekap.izin} | Alpa ${rekap.alfa}`,
    110,
    38,
  );

  autoTable(doc, {
    startY: 52,
    head: [["No", "Tanggal", "Sesi", "Keterangan", "Jam"]],
    body: rekap.harian.map((h, i) => [
      String(i + 1),
      formatTanggal(h.tanggal),
      JENIS_LABEL[h.jenis],
      tandaStatus(h.status),
      h.jam ?? "-",
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 35, 66], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 20, halign: "center" },
    },
    didParseCell: (d: CellHookData) => {
      if (d.section !== "body" || d.column.index !== 3) return;
      const status = rekap.harian[d.row.index]?.status;
      if (status) d.cell.styles.textColor = STATUS_RGB[status];
    },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(8);
  doc.text('Keterangan: "." = Hadir, Sakit, Izin, Alpa. Jam = waktu siswa melakukan absen.', 14, y);
  doc.save(`rekap-${slug(rekap.siswa.nama)}.pdf`);
}

export function exportSemuaCSV(rekapList: RekapSiswa[]) {
  const baris = [
    ["No Absen", "Nama", "Kelas", "Jenis Kelamin", "Hadir", "Sakit", "Izin", "Alpa", "Total Sesi"],
    ...rekapList.map((r) => [
      String(r.nomor),
      r.siswa.nama,
      r.siswa.kelas,
      r.siswa.jenis_kelamin,
      String(r.hadir),
      String(r.sakit),
      String(r.izin),
      String(r.alfa),
      String(r.total),
    ]),
  ];
  const csv = baris.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  unduh(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), "rekap-semua-siswa.csv");
}

export function exportSemuaPDF(rekapList: RekapSiswa[]) {
  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(NAMA_SEKOLAH, 14, 16);
  doc.setFontSize(11);
  doc.text("REKAPITULASI ABSENSI SELURUH SISWA", 14, 23);

  autoTable(doc, {
    startY: 30,
    head: [["No", "Nama", "Kelas", "L/P", "Hadir", "Sakit", "Izin", "Alpa"]],
    body: rekapList.map((r) => [
      String(r.nomor),
      r.siswa.nama,
      r.siswa.kelas,
      r.siswa.jenis_kelamin,
      String(r.hadir),
      String(r.sakit),
      String(r.izin),
      String(r.alfa),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 35, 66], textColor: 255 },
  });
  doc.save("rekap-semua-siswa.pdf");
}

type SelInfo = { status: StatusAbsen; jam: string | null } | null;

/** Rekap bulanan tanggal 1-31, dua baris per siswa (masuk & pulang), berwarna + total. */
export function exportBulananPDF(rekapList: RekapSiswa[], tahun: number, bulan: number) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });
  const jenisList: JenisSesi[] = ["masuk", "pulang"];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(NAMA_SEKOLAH, 10, 13);
  doc.setFontSize(10);
  doc.text(`ABSENSI BULANAN — ${NAMA_BULAN[bulan].toUpperCase()} ${tahun}`, 10, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    "Keterangan warna: H = Hadir (biru), I = Izin (hijau), S = Sakit (kuning), A = Alpa (merah). Baris M = absen masuk, P = absen pulang.",
    10,
    24,
  );

  const info: SelInfo[][] = [];
  const body: (string | { content: string; rowSpan?: number; styles?: object })[][] = [];

  rekapList.forEach((r) => {
    jenisList.forEach((jenis, idx) => {
      const { sel, total } = matriksBulanan(r, tahun, bulan, jenis);
      info.push(sel.map((s) => (s ? { status: s.status, jam: s.jam } : null)));
      const baris: (string | { content: string; rowSpan?: number; styles?: object })[] = [];
      if (idx === 0) {
        baris.push({ content: String(r.nomor), rowSpan: 2, styles: { valign: "middle" } });
        baris.push({ content: r.siswa.nama, rowSpan: 2, styles: { valign: "middle" } });
      }
      baris.push(jenis === "masuk" ? "M" : "P");
      for (let d = 0; d < 31; d++) {
        const s = sel[d];
        baris.push(s ? STATUS_KODE[s.status] : "");
      }
      baris.push(String(total.hadir), String(total.sakit), String(total.izin), String(total.alfa));
      body.push(baris);
    });
  });

  const kolomTanggal: Record<number, object> = {};
  for (let i = 3; i < 34; i++) kolomTanggal[i] = { cellWidth: 6.4, halign: "center" };

  autoTable(doc, {
    startY: 28,
    head: [
      [
        "No",
        "Nama Siswa",
        "Sesi",
        ...Array.from({ length: 31 }, (_, i) => String(i + 1)),
        "H",
        "S",
        "I",
        "A",
      ],
    ],
    body,
    theme: "grid",
    styles: { fontSize: 6.2, cellPadding: 0.9, halign: "center", lineWidth: 0.1 },
    headStyles: { fillColor: [26, 35, 66], textColor: 255, fontSize: 6.2 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 38, halign: "left" },
      2: { cellWidth: 8 },
      ...kolomTanggal,
      34: { cellWidth: 7, fontStyle: "bold" },
      35: { cellWidth: 7, fontStyle: "bold" },
      36: { cellWidth: 7, fontStyle: "bold" },
      37: { cellWidth: 7, fontStyle: "bold" },
    },
    didParseCell: (d: CellHookData) => {
      if (d.section !== "body") return;
      const col = d.column.index;
      if (col >= 3 && col <= 33) {
        const sel = info[d.row.index]?.[col - 3];
        if (sel) {
          d.cell.styles.textColor = STATUS_RGB[sel.status];
          d.cell.styles.fontStyle = "bold";
        }
      }
      if (col >= 34) {
        const map: Record<number, StatusAbsen> = {
          34: "hadir",
          35: "sakit",
          36: "izin",
          37: "alfa",
        };
        d.cell.styles.textColor = STATUS_RGB[map[col]];
      }
    },
  });

  doc.save(`absensi-bulanan-${NAMA_BULAN[bulan].toLowerCase()}-${tahun}.pdf`);
}
