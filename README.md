# 🏆 QUIZ BOARD ADVENTURE
> **Tagline:** *Jawab Soal, Jalankan Pion, Kuasai Permainan!*

Aplikasi web game edukasi interaktif multiplayer berkelompok dengan konsep permainan papan petualangan klasik (terinspirasi dari board game berkelok-kelok, bernomor 1–100, penuh ilustrasi lingkungan, objek menarik, pion kelompok, dan kotak khusus).

---

## 🚀 Fitur Utama yang Telah Diimplementasikan

### 1. Papan Permainan Petualangan (Board System)
- **Jalur Berkelok Klasik (Snake Path):** 100 kotak bernomor jelas dengan jalur zig-zag dinamis dari **START (1)** hingga **FINISH (100)**.
- **Interaksi Interaktif:**
  - Zoom in, Zoom out, dan Tombol Reset View (100%).
  - Drag & pan untuk menggeser papan di desktop maupun layar sentuh (tablet/smartphone).
  - Tooltip informatif saat kotak disentuh/hover.
  - Jalur garis putus-putus SVG penghubung antar-kotak.
  - Dekorasi lingkungan kartun petualangan (hutan 🌲, desa 🏘️, jembatan 🌉, sungai 🌊, kastil 🏰, padang rumput 🌾, gua 🦇, pantai 🌴, taman ⛲).

### 2. Kotak Spesial (Special Tiles)
- 🚀 **START (1):** Titik awal permainan.
- 🎁 **Kotak Hadiah (Reward):** Memberikan koin bonus (+15 koin).
- ⚡ **Kotak Tantangan (Challenge):** Pertanyaan bonus langsung.
- 🕳️ **Kotak Jebakan (Trap):** Mundur 2 langkah (bisa ditangkal perisai).
- 🏪 **Kotak Toko (Shop):** Membuka Adventure Shop untuk membeli item.
- ❓ **Kotak Misteri (Mystery):** Memicu random events tak terduga.
- ⚔️ **Kotak Duel (Duel):** Menantang kelompok lain dalam pertarungan kuis.
- 🛤️ **Kotak Jalan Pintas (Shortcut):** Melompat langsung ke kotak depan (+10 kotak).
- 😴 **Kotak Istirahat (Rest):** Memberikan proteksi/kebal untuk giliran berikutnya.
- 💸 **Kotak Pajak (Tax):** Membayar sejumlah koin.
- 🏆 **Kotak FINISH (100):** Memasuki *The Grand Final* atau memenangkan permainan.

### 3. Sistem Kelompok & Giliran
- Mendukung 2–6 kelompok dengan 2–3 pemain per kelompok.
- Kustomisasi nama tim, warna pion neon/cerah, dan avatar tim (🦅, 🐯, 🐺, 🦁, 🐉, 🦊, 🦋, dll).
- Pemilihan juru bicara bergiliran antar anggota.
- Panel giliran menampilkan waktu aktif, timer dinamis, koin, skor, dan inventaris aktif.

### 4. Sistem Kuis & Pertanyaan
- Berbagai format soal:
  - Pilihan Ganda (Multiple Choice)
  - Benar atau Salah (True/False)
  - Isian Singkat & Hitungan (Math & Short Answer)
  - Logika & Tantangan Khusus
- Tingkat kesulitan: Mudah, Sedang, Sulit, Sangat Sulit.
- Bonus koin untuk jawaban cepat (*speed bonus*).

### 5. Mode Pergerakan & Dadu
- **Mode Langkah Tetap:** Benar maju langkah tetap, salah diam/mundur jika penalti aktif.
- **Mode Dadu:** Menjawab benar memberikan kesempatan melempar dadu interaktif (1–6).
- **Mode Tantangan:** Langkah proporsional sesuai tingkat kesulitan soal.
- **Mode Strategi:** Kombinasi pergerakan, koin, dan item toko.

### 6. Toko Item (Adventure Shop) & Inventaris
- **Item Bantuan:** Kompas Petunjuk (hint), Kartu Kesempatan (retry), Sepatu Kilat (+2 langkah), Peta Rahasia, Kartu Ganda (double coins).
- **Item Strategi:** Meteor Mini (paksa duel lawan), Kabut Misteri, Jebakan Licin, Angin Pendorong, Tukar Posisi (swap position).
- **Item Pertahanan:** Perisai (batalkan efek buruk), Helm Keberuntungan, Kartu Anti-Meteor, Kartu Penyelamat, Kartu Kebal (invincible 1 turn).

### 7. Sistem Duel Antarkelompok
- Fitur tantang kelompok lain secara langsung.
- Soal kompetitif dengan waktu tercepat sebagai penentu kemenangan.
- Taruhan: Koin pemenang, penalti mundur bagi yang kalah, atau pertukaran posisi pion.

### 8. The Grand Final & Podium Kemenangan
- Kotak 100 memicu mode **THE GRAND FINAL**: Tim harus menyelesaikan 3 soal tingkat tinggi berturut-turut.
- Animasi konfeti warna-warni, panggung podium 3D, rekap statistik lengkap, dan penghargaan unik (*Raja Kuis, Juara Duel, Paling Banyak Benar, Kolektor Item*).

### 9. Panel Admin / Host Komprehensif
- Kontrol permainan: Jeda, Lanjut, Lewati Giliran, Selesai.
- Modifikasi real-time: Tambah/kurang koin kelompok, ubah posisi pion secara manual.
- Editor papan visual: Atur jumlah kotak (20–120) dan tambah/hapus kotak spesial.
- Pengaturan aturan & harga item yang fleksibel.

### 10. Monopoli Petualang
- Mode papan persegi START → kotak 1–30 → FINISH yang dapat dipilih terpisah dari Adventure.
- Memakai kelompok yang diatur di aplikasi, dengan saldo, wilayah, bangunan, inventaris, dan riwayat khusus untuk mode ini.
- Setiap giliran dimulai dengan kuis; jawaban benar otomatis melempar dadu dan jawaban salah mengakhiri giliran tanpa lemparan.
- Bank soal Monopoli menggunakan soal pilihan ganda Bahasa Indonesia dari `Bahasa_Indonesia.py`; tingkat MUDAH/SEDANG/SULIT dipertahankan dan SANGAT SULIT dipetakan ke tingkat sulit.
- Mendarat di properti kosong langsung menawarkan pembelian; properti lawan mewajibkan pembayaran sewa, dengan opsi menjawab satu soal sulit untuk diskon 50%.
- Setelah sewa dibayar, pemain dapat mengambil alih properti lawan dengan membayar 2x harga kepada pemiliknya; properti yang sudah mencapai bangunan maksimum (Kastil/Landmark) tidak dapat diambil alih.
- Panel Admin di pengaturan kelompok dapat menukar fitur antar-kotak sebelum pertandingan dimulai; susunan tersimpan dan START/FINISH tetap.
- Papan juga mencakup Kartu Kesempatan, Dana Umum, dan penjara yang perlu dibebaskan lewat kuis.
- Kartu Kesempatan dan Dana Umum menampilkan pop-up bonus, denda, atau perpindahan posisi.
- Durasi dapat ditentukan berdasarkan 10/15/20 putaran atau batas waktu.
- Panel Admin menyediakan bobot peluang relatif untuk tiap angka dadu (1–6); bobot lebih kecil membuat angka lebih sulit muncul dan pengaturannya berlaku pada permainan berikutnya.

### 11. Database PostgreSQL / Supabase
- 20 tabel lengkap (`users`, `game_rooms`, `teams`, `team_members`, `board_configs`, `board_tiles`, `questions`, `question_categories`, `game_turns`, `answers`, `team_positions`, `team_coins`, `shop_items`, `team_inventory`, `item_usage`, `random_events`, `missions`, `duels`, `achievements`, `game_results`).
- File schema siap pakai: `supabase/schema.sql`.

---

## 💻 Cara Menjalankan Aplikasi

1. Masuk ke direktori game:
   ```bash
   cd c:\Users\rizky\Documents\edukasi\quiz-board-adventure
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

3. Atau jalankan production build:
   ```bash
   npm run build
   npm start
   ```
