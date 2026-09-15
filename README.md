# Kota Komputasional — Misteri Input, Proses & Output

Paket ini berisi salinan mandiri website **Kota Komputasional** dengan tampilan, aset, animasi, permainan solo, penyimpanan progres, serta mode ruang bersama.

## Menjalankan di Windows

1. Pastikan [Node.js](https://nodejs.org/) sudah terpasang.
2. Klik dua kali `start.bat`.
3. Jika browser tidak terbuka otomatis, buka `http://localhost:4173`.

## Menjalankan lewat Terminal

```bash
npm start
```

Kemudian buka `http://localhost:4173`.

## Catatan mode bersama

- Semua pemain membuka alamat komputer yang menjalankan server ini.
- Jika pemain memakai perangkat lain pada jaringan Wi-Fi yang sama, gunakan alamat IP lokal komputer server, misalnya `http://192.168.1.10:4173`.
- Ruang aktif disimpan sementara selama server berjalan. Menutup server akan mengakhiri ruang online, sedangkan progres solo tetap tersimpan di browser masing-masing.

## Publikasi

Folder `dist` adalah hasil website statis yang siap diunggah. Untuk mempertahankan ruang online, jalankan melalui `server.mjs` atau implementasikan endpoint `/api/room` pada layanan hosting tujuan.
