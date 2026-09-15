# Kota Komputasional — GitHub Pages

Paket ini sudah disesuaikan agar dapat diterbitkan sebagai website statis di GitHub Pages, termasuk ketika alamat website memakai subfolder nama repositori.

## Cara menerbitkan

1. Buat repositori baru di GitHub, misalnya `kota-komputasional-ipo`.
2. Ekstrak ZIP ini, lalu unggah **seluruh isi folder hasil ekstrak** ke cabang `main`. Pastikan `index.html`, folder `_next`, folder `.github`, dan file `.nojekyll` berada di root repositori.
3. Buka **Settings → Pages** pada repositori.
4. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
5. Buka tab **Actions** dan tunggu workflow **Deploy GitHub Pages** selesai. Alamat website akan muncul pada halaman deployment dan menu Pages.

Setiap perubahan yang dikirim ke cabang `main` akan diterbitkan otomatis.

## Jika mengunggah melalui Git

```bash
git init
git add .
git commit -m "Publish Kota Komputasional"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORI.git
git push -u origin main
```

Ganti `USERNAME` dan `NAMA-REPOSITORI` sesuai akun dan repositori GitHub Anda.

## Fitur

- Mode solo, progres lokal, animasi, audio, permainan, dan ekspor hasil dapat digunakan langsung di GitHub Pages.
- GitHub Pages hanya menyediakan hosting statis dan tidak menjalankan `server.mjs`. Karena itu, ruang multiplayer lintas perangkat memerlukan backend terpisah. Paket ini otomatis memakai demo ruang lokal pada browser/perangkat yang sama ketika backend online tidak tersedia.
- Untuk multiplayer lintas perangkat, hubungkan konfigurasi Firebase atau publikasikan `server.mjs` pada layanan Node.js, lalu arahkan endpoint di `multiplayer-config.json` ke backend tersebut.

## Uji lokal

Website harus dibuka melalui server HTTP, bukan dengan klik dua kali `index.html`. Salah satu cara sederhana:

```bash
npx serve .
```

Lalu buka alamat lokal yang ditampilkan di terminal.
