import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatTanggal, NAMA_SEKOLAH, STATUS_LABEL, type RekapSiswa } from "./absensi";

function tandaStatus(status: RekapSiswa["harian"][number]["status"]): string {
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
    ["Tanggal", "Keterangan", "Jam"],
    ...rekap.harian.map((h) => [h.tanggal, tandaStatus(h.status), h.jam ?? "-"]),
  ];
  const csv = baris
    .map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  unduh(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), `rekap-${slug(rekap.siswa.nama)}.csv`);
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
    head: [["No", "Tanggal", "Keterangan", "Jam"]],
    body: rekap.harian.map((h, i) => [
      String(i + 1),
      formatTanggal(h.tanggal),
      tandaStatus(h.status),
      h.jam ?? "-",
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [26, 35, 66], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
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
