# Al Fatih Attendance Pro

Buatkan sistem E - Absensi Namanya SMPNT AL - FATIH ubah design menjadi dominan biru navy putih hitam dengan lebih 3d , untuk di calender kalo ada ysng sesi absen tolong highlight, pada halaman admin tolong ada bagian crud di data siswa  , dan bagaimana pun saya mau di halaman admin ada rekapan tiap siswa total hadir sakit alfa , dan halaman publik itu bukan benar publuk tapi orang tua siswa harus masukan nama lengkap anaknya dulu baru kelihatan detail tentang nama itu sendiri, Implementasikan fitur export rekap per siswa ke PDF dan CSV supaya saya bisa mendownload hasilnya.  untuk semua data siswa atau data absen yang sudah masuk di sistem simpan semua ke database permanen secara sinkron, dan dalam menu absen itu ada menu batal juga karena bila mana mau batal klik absen, tolong untuk output cetak pdfnya buat jadi isi absen harian persiswa jika hadir titik saja kalo sakit sakit , izin, alpa, dan ada keterangan jam saat absen juga biar tau dia lambbat atau ngga jam dan menit saja, untuk detail siswa jangan ada NISN hanya Nomer Absen sesuai urutan Nama yang di input A-Z, nama, kelas VII , jenis kelamin

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c3755f45-fed7-4f1c-8873-95fc812f191b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Environment Variables

For deployment, Vercel must have the following environment variables configured:

- `SUPABASE_URL` - your Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY` - your Supabase anon publishable key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only secret)
- `SESSION_SECRET` - random secret used for admin session cookies

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to clients. Set these in Vercel under `Settings` → `Environment Variables`, then redeploy.
