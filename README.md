# Kota Komputasional — GitHub Pages + Multiplayer

Paket ini sudah disesuaikan agar game **Kota Komputasional** dapat dipasang pada
GitHub Pages, termasuk ketika alamatnya berada di subfolder repository seperti:

`https://nama-akun.github.io/kota-komputasional-ipo/`

Mode solo berjalan sepenuhnya di browser. Mode bersama memakai Firebase Realtime
Database karena GitHub Pages tidak menjalankan server Node.js atau endpoint API.

## Yang sudah disiapkan

- asset dan modul memakai alamat relatif agar tidak 404 di GitHub Pages;
- file `.nojekyll` agar folder `_next` ikut diterbitkan;
- workflow GitHub Actions untuk menerbitkan folder `dist`;
- dukungan ruang bersama hingga 8 pemain melalui Firebase;
- aturan dasar keamanan Realtime Database pada `firebase.rules.json`;
- server Node.js lama tetap tersedia untuk pengujian lokal atau hosting non-GitHub.

## A. Aktifkan mode bersama melalui Firebase

Langkah ini hanya dilakukan sekali.

1. Buka Firebase Console dan buat sebuah project.
2. Buka **Build → Authentication → Sign-in method**, lalu aktifkan **Anonymous**.
3. Pada pengaturan Authentication, tambahkan `nama-akun.github.io` ke daftar
   **Authorized domains** bila domain tersebut belum tercantum.
4. Buka **Build → Realtime Database**, buat database, dan catat URL databasenya.
5. Pada halaman **Project settings → General**, tambahkan Web App jika belum ada,
   lalu salin nilai `apiKey`.
6. Buka file `dist/multiplayer-config.json`, lalu ganti dua nilai bertanda
   `GANTI_...` dengan nilai milik project Firebase Anda.
7. Pada Realtime Database, buka tab **Rules**, salin seluruh isi
   `firebase.rules.json`, lalu klik **Publish**.

Contoh konfigurasi akhir:

```json
{
  "provider": "firebase",
  "firebase": {
    "apiKey": "AIzaSyCONTOH123",
    "databaseURL": "https://kota-komputasional-default-rtdb.asia-southeast1.firebasedatabase.app"
  },
  "movingIntervalMs": 350,
  "idleIntervalMs": 1200,
  "maxPlayers": 8
}
```

`apiKey` Firebase untuk Web App memang berada di sisi klien. Perlindungan data
tetap ditentukan oleh Authentication dan Realtime Database Rules, sehingga
jangan memakai mode test/public rules untuk website produksi.

## B. Unggah ke GitHub

1. Buat repository baru, misalnya `kota-komputasional-ipo`.
2. Ekstrak ZIP ini, lalu unggah **seluruh isi folder** `kota-komputasional-ipo`
   ke root repository. Pastikan folder `.github` ikut terunggah.
3. Commit ke branch `main`.
4. Buka **Settings → Pages → Build and deployment → Source**, pilih
   **GitHub Actions**.
5. Buka tab **Actions** dan tunggu workflow
   **Deploy Kota Komputasional to GitHub Pages** selesai.
6. Alamat game akan muncul pada hasil workflow dan halaman Settings → Pages.

Setelah aktif, pemain pertama memilih **Main bersama → Buat ruang**. Pemain lain
membuka URL GitHub Pages yang sama, memilih **Gabung ruang**, lalu memasukkan kode
6 karakter. Jangan menguji multiplayer hanya dengan duplikasi tab yang memakai
sesi browser sama; gunakan browser/perangkat berbeda atau jendela samaran.

## C. Pengujian sebelum diunggah

Pastikan Node.js terpasang, lalu jalankan:

```bash
npm run validate
npm start
```

Buka `http://localhost:4173`. Jika konfigurasi Firebase sudah diisi, mode solo
dan mode bersama dapat diuji dari browser/perangkat berbeda.

## Mengapa server.mjs masih disertakan?

`server.mjs` adalah alternatif backend berbasis memori untuk hosting yang dapat
menjalankan Node.js. Ia bekerja saat website dan API berada pada server yang
sama, tetapi tidak dijalankan oleh GitHub Pages. Untuk publikasi GitHub Pages,
gunakan Firebase sebagaimana langkah A.

## Pemeriksaan cepat bila multiplayer gagal

- Pesan **Firebase belum siap**: pastikan Anonymous Authentication sudah aktif.
- Pesan **Firebase menolak permintaan**: periksa `databaseURL` dan Rules.
- Ruang tidak ditemukan: pastikan kode benar dan ruang belum melewati 24 jam.
- Pemain tidak terlihat: pastikan semua pemain memakai URL deployment yang sama
  dan project Firebase yang sama.
