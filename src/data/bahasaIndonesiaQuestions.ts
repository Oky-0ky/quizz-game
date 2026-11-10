import type { Question } from '@/types/game';

/**
 * BANK SOAL BAHASA INDONESIA (100 SOAL)
 *
 * Sumber: Bahasa_Indonesia.py
 * - Soal 1-100 : Pilihan ganda (BAB 1-4, termasuk soal 71-100 yang awalnya essay
 *   telah diubah menjadi pilihan ganda sesuai Bahasa_Indonesia.py)
 *
 * Tingkat kesulitan dipetakan: MUDAH -> easy, SEDANG -> medium,
 * SULIT -> hard, SANGAT SULIT -> very_hard.
 * Pilihan jawaban disimpan tanpa prefix "A. ", "B. ", dst. karena
 * prefix huruf sudah dirender otomatis oleh UI.
 */

type Tingkat = 'MUDAH' | 'SEDANG' | 'SULIT' | 'SANGAT SULIT';

type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

interface RawQuestion {
  no: number;
  soal: string;
  pilihan?: string[];
  tingkat: Tingkat;
  kunci?: string;
  jawaban?: string;
}

const DIFFICULTY_MAP: Record<Tingkat, Difficulty> = {
  MUDAH: 'easy',
  SEDANG: 'medium',
  SULIT: 'hard',
  'SANGAT SULIT': 'very_hard',
};

const DIFFICULTY_REWARD: Record<Difficulty, { timeLimit: number; coinsReward: number; movementReward: number }> = {
  easy: { timeLimit: 25, coinsReward: 15, movementReward: 2 },
  medium: { timeLimit: 30, coinsReward: 20, movementReward: 4 },
  hard: { timeLimit: 45, coinsReward: 25, movementReward: 6 },
  very_hard: { timeLimit: 60, coinsReward: 35, movementReward: 8 },
};

const RAW_QUESTIONS: RawQuestion[] = [
  // ===== BAB 1: TEKS DESKRIPSI DAN TEKS EKSPLANASI (1-20) =====
  {
    no: 1,
    soal: 'Teks yang bertujuan menggambarkan suatu objek, tempat, atau peristiwa secara rinci sehingga pembaca seolah-olah melihat dan merasakannya sendiri adalah teks...',
    pilihan: ['Eksplanasi', 'Deskripsi', 'Narasi', 'Eksposisi'],
    tingkat: 'MUDAH',
    kunci: 'B. Deskripsi',
  },
  {
    no: 2,
    soal: 'Ciri utama dari teks eksplanasi yang membedakannya dari teks deskripsi adalah...',
    pilihan: [
      'Menggunakan pancaindra secara mendalam',
      'Menjelaskan proses sebab-akibat terjadinya suatu fenomena',
      'Berisi alur cerita fiktif dan tokoh penokohan',
      'Menggunakan ungkapan kiasan dan majas',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Menjelaskan proses sebab-akibat terjadinya suatu fenomena',
  },
  {
    no: 3,
    soal: 'Struktur urutan yang tepat dalam pembuatan teks deskripsi adalah...',
    pilihan: [
      'Pernyataan umum - Urutan sebab akibat - Interpretasi',
      'Identifikasi/Generik - Deskripsi Bagian - Simpulan/Kesan',
      'Orientasi - Komplikasi - Resolusi - Koda',
      'Tesis - Argumentasi - Penegasan Ulang',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Identifikasi/Generik - Deskripsi Bagian - Simpulan/Kesan',
  },
  {
    no: 4,
    soal: 'Berikut yang merupakan bagian dari struktur teks eksplanasi adalah...',
    pilihan: [
      'Deskripsi bagian dan deskripsi manfaat',
      'Identifikasi umum dan penutup',
      'Pernyataan umum, deretan penjelas, dan interpretasi',
      'Orientasi, komplikasi, dan koda',
    ],
    tingkat: 'MUDAH',
    kunci: 'C. Pernyataan umum, deretan penjelas, dan interpretasi',
  },
  {
    no: 5,
    soal: "Bacalah teks berikut: 'Gunung Bromo menjulang tinggi dengan kabut putih menyelimuti puncaknya di pagi hari. Pasir berbisik terhampar luas melingkupi kawasan kawah.' Teks tersebut merupakan contoh...",
    pilihan: [
      'Teks eksplanasi fenomena sosial',
      'Teks deskripsi objek alam',
      'Teks narasi subjektif',
      'Teks eksplanasi proses alam',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Teks deskripsi objek alam',
  },
  {
    no: 6,
    soal: 'Konjungsi kausalitas yang sering ditemukan dalam teks eksplanasi adalah...',
    pilihan: [
      'Kemudian, setelah itu, lalu',
      'Karena, sebab, oleh karena itu',
      'Dan, serta, lagipula',
      'Walaupun, meskipun, namun',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Karena, sebab, oleh karena itu',
  },
  {
    no: 7,
    soal: 'Bagian interpretasi dalam teks eksplanasi berisi tentang...',
    pilihan: [
      'Gambaran fisik objek yang dibahas',
      'Penyebab awal muculnya suatu peristiwa',
      'Intisari atau pandangan penulis atas fenomena yang dipaparkan',
      'Pertentangan antara tokoh utama dan lawan',
    ],
    tingkat: 'SEDANG',
    kunci: 'C. Intisari atau pandangan penulis atas fenomena yang dipaparkan',
  },
  {
    no: 8,
    soal: "Bacalah kalimat berikut: 'Pelangi terbentuk akibat pembiasan cahaya matahari oleh tetesan air hujan di atmosfer.' Kalimat ini sangat cocok ditempatkan pada struktur teks eksplanasi bagian...",
    pilihan: [
      'Identifikasi subjektif',
      'Deretan penjelas / Sebab-akibat',
      'Orientasi naratif',
      'Koda moral',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Deretan penjelas / Sebab-akibat',
  },
  {
    no: 9,
    soal: 'Manakah dari judul berikut yang paling tepat untuk sebuah teks eksplanasi ilmiah?',
    pilihan: [
      'Keindahan Pantai Kuta di Sore Hari',
      'Proses Terjadinya Gerhana Bulan Total',
      'Pengalaman Lucu Liburan ke Rumah Nenek',
      'Sosok Ibuku yang Penyabar dan Tangguh',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Proses Terjadinya Gerhana Bulan Total',
  },
  {
    no: 10,
    soal: 'Mengapa teks deskripsi membutuhkan keterlibatan pancaindra dalam penulisannya?',
    pilihan: [
      'Agar teks terlihat tebal dan panjang',
      'Membantu pembaca membayangkan impresi fisik dan suasana objek secara riil',
      'Menjelaskan hukum fisika yang melatarbelakangi objek',
      'Memudahkan penulis membuat konflik cerita',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Membantu pembaca membayangkan impresi fisik dan suasana objek secara riil',
  },
  {
    no: 11,
    soal: "Perhatikan kalimat berikut: 'Candi Borobudur dibangun menggunakan batu adas hitam melingkar bersusun sembilan tingkat.' Kata bentukan yang menunjukkan identifikasi deskriptif fisik adalah...",
    pilihan: [
      'Dibuat menggunakan',
      'Batu adas hitam melingkar bersusun',
      'Dibangun dengan cepat',
      'Sangat indah dilihat',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Batu adas hitam melingkar bersusun',
  },
  {
    no: 12,
    soal: 'Perbedaan mendasar fokus pembahasan antara teks deskripsi fenomena dan eksplanasi fenomena adalah...',
    pilihan: [
      'Deskripsi berfokus pada visual/ciri fisik, eksplanasi berfokus pada mekanisme/proses terjadinya',
      'Deskripsi bersifat ilmiah, eksplanasi bersifat imajinatif',
      'Deskripsi menggunakan kata kerja aksi, eksplanasi menggunakan kata sifat semata',
      'Deskripsi memuat konflik, eksplanasi memuat pemecahan masalah',
    ],
    tingkat: 'SEDANG',
    kunci: 'A. Deskripsi berfokus pada visual/ciri fisik, eksplanasi berfokus pada mekanisme/proses terjadinya',
  },
  {
    no: 13,
    soal: 'Kalimat berikut yang mengandung cerapan indra penglihatan dan pendengaran secara berturut-turut adalah...',
    pilihan: [
      'Angin bertiup sepoi-sepoi dan rasanya sangat dingin di kulit.',
      'Daun-daun hijau melambai diiringi gemericik air sungai yang merdu.',
      'Bau harum bunga melati menyerbak hingga ke dalam kamar tidur.',
      'Kue brownies itu sangat manis dan teksturnya sangat lembut.',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Daun-daun hijau melambai diiringi gemericik air sungai yang merdu.',
  },
  {
    no: 14,
    soal: 'Ciri bahasa yang dominan pada teks eksplanasi ilmiah adalah penggunaan...',
    pilihan: [
      'Kata pasaran dan istilah populer',
      'Kata denotatif dan istilah teknis/ilmiah',
      'Makna kiasan dan gaya bahasa hiperbola',
      'Kata ganti orang pertama (Aku/Saya)',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Kata denotatif dan istilah teknis/ilmiah',
  },
  {
    no: 15,
    soal: "Dalam teks eksplanasi tentang 'Tsunami', paragraf yang menjelaskan tahap terjadinya gempa tektonik dasar laut hingga air laut surut tiba-tiba masuk ke dalam struktur...",
    pilihan: [
      'Pernyataan Umum',
      'Deretan Penjelas (Proses)',
      'Simpulan Subjektif',
      'Orientasi Peristiwa',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Deretan Penjelas (Proses)',
  },
  {
    no: 16,
    soal: "Bacalah kutipan: 'Limbah plastik yang dibuang ke sungai menyumbat aliran air. Saat curah hujan tinggi, debit air memuncak dan meluap ke pemukiman.' Pola pengembangan teks eksplanasi di atas adalah...",
    pilihan: [
      'Pola spasial/tempat',
      'Pola kausalitas (Sebab-Akibat)',
      'Pola tematis ilustratif',
      'Pola definisi populer',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Pola kausalitas (Sebab-Akibat)',
  },
  {
    no: 17,
    soal: 'Di bawah ini yang merupakan ciri khas teks deskripsi subjektif adalah...',
    pilihan: [
      'Menggambarkan objek murni sesuai fakta tanpa ada opini penulis',
      'Menggambarkan objek berdasarkan opini, tafsiran, dan kesan personal penulis',
      'Menggambarkan urutan langkah-langkah eksperimen laboratorium',
      'Menggambarkan sejarah terbentuknya suatu organisasi',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Menggambarkan objek berdasarkan opini, tafsiran, dan kesan personal penulis',
  },
  {
    no: 18,
    soal: "Perhatikan kalimat eksplanasi: 'Pemanasan global memicu pelelehan es kutub, yang pada gilirannya menaikkan permukaan air laut secara global.' Kalimat tersebut mengandung konjungsi kronologis/proses yaitu...",
    pilihan: [
      'Pemanasan global',
      'Yang pada gilirannya',
      'Memicu pelelehan',
      'Secara global',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Yang pada gilirannya',
  },
  {
    no: 19,
    soal: 'Sebuah teks mendeskripsikan aroma tanah basah tersiram hujan, rasa dingin yang menusuk tulang, serta rintik suara di atap seng. Teks ini memanfaatkan penginderaan...',
    pilihan: [
      'Pembau, peraba, dan pendengar',
      'Penglihat, pengecap, dan pembau',
      'Peraba, penglihat, dan perasa',
      'Pendengar, pengecap, dan pembau',
    ],
    tingkat: 'SULIT',
    kunci: 'A. Pembau, peraba, dan pendengar',
  },
  {
    no: 20,
    soal: 'Manakah dari analisis berikut yang tepat mengenai keterkaitan antara fenomena sosial dan teks eksplanasi?',
    pilihan: [
      'Teks eksplanasi fenomena sosial ditulis berdasarkan imajinasi pengarang tentang masa depan',
      'Teks eksplanasi fenomena sosial mengurai sebab-akibat terjadinya dinamika masyarakat seperti kemiskinan atau urbanisasi',
      'Teks eksplanasi fenomena sosial berisi ajakan atau promosi produk sosial',
      'Teks eksplanasi fenomena sosial berisi deskripsi fisik bangunan bersejarah',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Teks eksplanasi fenomena sosial mengurai sebab-akibat terjadinya dinamika masyarakat seperti kemiskinan atau urbanisasi',
  },

  // ===== BAB 2: KARYA SASTRA FIKSI DAN PUISI LINGKUNGAN (21-40) =====
  {
    no: 21,
    soal: 'Karya sastra yang berisi rekaan, khayalan, atau imajinasi pengarang dan bukan kejadian nyata disebut...',
    pilihan: ['Karya Nonfiksi', 'Karya Sastra Fiksi', 'Artikel Ilmiah', 'Biografi'],
    tingkat: 'MUDAH',
    kunci: 'B. Karya Sastra Fiksi',
  },
  {
    no: 22,
    soal: 'Jenis karya sastra fiksi yang berbentuk prosa panjang dan menceritakan kehidupan tokoh secara mendalam beserta konflik kompleksnya adalah...',
    pilihan: ['Cerpen', 'Novel', 'Dongeng', 'Drama'],
    tingkat: 'MUDAH',
    kunci: 'B. Novel',
  },
  {
    no: 23,
    soal: 'Pesan moral atau ajaran kebaikan yang ingin disampaikan pengarang kepada pembaca dalam cerita fiksi dinamakan...',
    pilihan: ['Latar', 'Tema', 'Amanat', 'Alur'],
    tingkat: 'MUDAH',
    kunci: 'C. Amanat',
  },
  {
    no: 24,
    soal: 'Tingkatan puncak ketegangan atau titik balik masalah dalam sebuah alur cerita fiksi disebut...',
    pilihan: ['Orientasi', 'Klimaks', 'Peleraian', 'Koda'],
    tingkat: 'MUDAH',
    kunci: 'B. Klimaks',
  },
  {
    no: 25,
    soal: 'Unsur intrinsik puisi yang merujuk pada persamaan bunyi akhir pada bait-bait puisi adalah...',
    pilihan: ['Majas', 'Rima', 'Diksi', 'Tipografi'],
    tingkat: 'MUDAH',
    kunci: 'B. Rima',
  },
  {
    no: 26,
    soal: 'Cerita fiksi tradisional yang mengisahkan tentang asal-usul suatu tempat atau tokoh masyarakat zaman dahulu disebut...',
    pilihan: ['Fabel', 'Mite', 'Legenda', 'Sage'],
    tingkat: 'SEDANG',
    kunci: 'C. Legenda',
  },
  {
    no: 27,
    soal: 'Perbedaan mendasar antara cerita pendek (cerpen) dan novel terletak pada...',
    pilihan: [
      'Cerpen memuat banyak konflik bercabang, novel hanya fokus pada satu peristiwa penting',
      'Cerpen memiliki keterbatasan jumlah kata dan konsentrasi cerita tunggal, novel lebih kompleks',
      'Cerpen ditulis berdasarkan kisah nyata, novel selalu murni fiksi khayalan',
      'Cerpen tidak membutuhkan latar tempat, novel sangat membutuhkan latar',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Cerpen memiliki keterbatasan jumlah kata dan konsentrasi cerita tunggal, novel lebih kompleks',
  },
  {
    no: 28,
    soal: 'Tokoh yang berperan sebagai penentang atau penjahat utama yang menciptakan konflik dalam fiksi dinamakan tokoh...',
    pilihan: ['Protagonis', 'Antagonis', 'Tritagonis', 'Figuran'],
    tingkat: 'SEDANG',
    kunci: 'B. Antagonis',
  },
  {
    no: 29,
    soal: "Bacalah penggalan puisi berikut: 'Hutanku ringkik menangis / Pohon-pohon tumbang dihantam besi / Sungai tak lagi jernih melukis.' Tema dari penggalan puisi di atas adalah...",
    pilihan: [
      'Kerusakan lingkungan alam',
      'Keindahan pegunungan',
      'Bencana banjir di kota',
      'Kerinduan pada kampung halaman',
    ],
    tingkat: 'SEDANG',
    kunci: 'A. Kerusakan lingkungan alam',
  },
  {
    no: 30,
    soal: "Latar suasana yang tergambar dari baris puisi 'Hutanku ringkik menangis' pada soal nomor 29 adalah...",
    pilihan: [
      'Gembira dan bersuka cita',
      'Sedih, prihatin, dan menyayat hati',
      'Marah dan penuh dendam',
      'Tenang dan damai',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Sedih, prihatin, dan menyayat hati',
  },
  {
    no: 31,
    soal: "Sudut pandang di mana pengarang berada di luar cerita dan menggunakan kata ganti 'dia', 'mereka', atau nama tokoh disebut sudut pandang...",
    pilihan: [
      'Orang pertama pelaku utama',
      'Orang pertama pelaku sampingan',
      'Orang ketiga serbatah / di luar cerita',
      'Orang kedua campur tangan',
    ],
    tingkat: 'SEDANG',
    kunci: 'C. Orang ketiga serbatah / di luar cerita',
  },
  {
    no: 32,
    soal: 'Penggunaan pemilihan kata yang cermat dan berbobot dalam menulis puisi lingkungan hidup disebut...',
    pilihan: ['Tipografi', 'Diksi', 'Imajinasi', 'Enjambemen'],
    tingkat: 'SEDANG',
    kunci: 'B. Diksi',
  },
  {
    no: 33,
    soal: "Bacalah kutipan: 'Dahulu kala, seekor kancil cerdik mengerjai buaya agar bisa menyeberangi sungai deras.' Jenis karya sastra fiksi ini tergolong ke dalam...",
    pilihan: ['Sage', 'Fabel', 'Mite', 'Epos'],
    tingkat: 'SEDANG',
    kunci: 'B. Fabel',
  },
  {
    no: 34,
    soal: 'Unsur ekstrinsik karya sastra fiksi yang memengaruhi jalannya cerita adalah...',
    pilihan: [
      'Watak dan sifat penokohan',
      'Latar belakang sosial budaya dan pengalaman hidup pengarang',
      'Jeda dan intonasi pembacaan',
      'Setting tempat dan waktu',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Latar belakang sosial budaya dan pengalaman hidup pengarang',
  },
  {
    no: 35,
    soal: 'Teks fiksi yang menceritakan peristiwa sejarah dengan bumbu imajinasi dan kehebatan pahlawan dinamakan...',
    pilihan: ['Sage', 'Fabel', 'Novela', 'Roman'],
    tingkat: 'SEDANG',
    kunci: 'A. Sage',
  },
  {
    no: 36,
    soal: "Perhatikan bait puisi berikut: 'Sampah menggunung di sudut kota / Bau menyengat menusuk hidung / Mana tangan manusia yang peduli?'. Citraan yang dominan pada bait tersebut adalah...",
    pilihan: [
      'Citraan penglihatan dan penciuman',
      'Citraan pendengaran dan perabaan',
      'Citraan gerak dan perasa',
      'Citraan pengecap dan peraba',
    ],
    tingkat: 'SULIT',
    kunci: 'A. Citraan penglihatan dan penciuman',
  },
  {
    no: 37,
    soal: 'Dalam cerita fiksi, alur yang dimulai dari penyelesaian masalah terlebih dahulu, kemudian mundur menceritakan masa lalu tokoh dinamakan alur...',
    pilihan: [
      'Maju (Progresif)',
      'Mundur (Regresif/Flashback)',
      'Campuran',
      'Sorot silang',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Mundur (Regresif/Flashback)',
  },
  {
    no: 38,
    soal: 'Berikut ini yang merupakan ciri khas bentuk tipografi dalam puisi modern adalah...',
    pilihan: [
      'Harus terikat aturan 4 baris per bait',
      'Wajib menggunakan rima akhir a-b-a-b',
      'Bebas dalam pengaturan baris, tata letak huruf, dan bentuk visual susunan bait',
      'Harus menggunakan bahasa Melayu kuno',
    ],
    tingkat: 'SULIT',
    kunci: 'C. Bebas dalam pengaturan baris, tata letak huruf, dan bentuk visual susunan bait',
  },
  {
    no: 39,
    soal: 'Apa fungsi utama dari penokohan tritagonis dalam struktur fiksi?',
    pilihan: [
      'Menjadi penjahat yang memperkeruh suasana',
      'Penengah atau pembantu penyelesaian konflik antara antagonis dan protagonis',
      'Tokoh pelengkap yang muncul sekali tanpa dialog',
      'Menjadi pencerita sudut pandang utama',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Penengah atau pembantu penyelesaian konflik antara antagonis dan protagonis',
  },
  {
    no: 40,
    soal: "Analisis yang tepat mengenai makna lambang 'sungai yang menangis hitam' dalam puisi bernuansa lingkungan adalah...",
    pilihan: [
      'Air sungai yang jernih bergelombang',
      'Sungai yang tercemar berat oleh limbah dan kerusakan ekosistem',
      'Sungai yang dihuni oleh banyak makhluk gaib',
      'Air sungai yang meluap karena hujan lebat',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Sungai yang tercemar berat oleh limbah dan kerusakan ekosistem',
  },

  // ===== BAB 3: TEKS NARASI (41-55) =====
  {
    no: 41,
    soal: 'Teks yang menyajikan karangan berisi rangkaian peristiwa secara kronologis (berurutan waktu) disebut teks...',
    pilihan: ['Deskripsi', 'Eksplanasi', 'Narasi', 'Persuasi'],
    tingkat: 'MUDAH',
    kunci: 'C. Narasi',
  },
  {
    no: 42,
    soal: 'Ciri utama yang WAJIB ada di dalam sebuah teks narasi adalah...',
    pilihan: [
      'Data statistik angka akurat',
      'Tokoh, alur peristiwa, dan latar (tempat/waktu)',
      'Tabel perbandingan harga',
      'Rumus ilmiah kausalitas',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Tokoh, alur peristiwa, dan latar (tempat/waktu)',
  },
  {
    no: 43,
    soal: 'Urutan struktur teks narasi yang benar dan berurutan dari awal hingga akhir adalah...',
    pilihan: [
      'Komplikasi - Orientasi - Resolusi - Koda',
      'Orientasi - Komplikasi - Resolusi - Koda/Reorientasi',
      'Resolusi - Orientasi - Komplikasi',
      'Koda - Orientasi - Argumentasi',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Orientasi - Komplikasi - Resolusi - Koda/Reorientasi',
  },
  {
    no: 44,
    soal: 'Bagian teks narasi yang berisi pengenalan tokoh, latar tempat, latar waktu, dan pengantar cerita disebut...',
    pilihan: ['Komplikasi', 'Orientasi', 'Resolusi', 'Reorientasi'],
    tingkat: 'MUDAH',
    kunci: 'B. Orientasi',
  },
  {
    no: 45,
    soal: 'Resolusi dalam struktur teks narasi menandakan bagian...',
    pilihan: [
      'Kemunculan konflik atau masalah utama',
      'Pengenalan latar belakang cerita',
      'Peleraian atau jalan keluar pemecahan masalah',
      'Pesan penutup dari pengarang',
    ],
    tingkat: 'MUDAH',
    kunci: 'C. Peleraian atau jalan keluar pemecahan masalah',
  },
  {
    no: 46,
    soal: 'Unsur pembangun narasi yang menjadi landasan dasar utama topik cerita dinamakan...',
    pilihan: ['Tema', 'Sudut pandang', 'Gaya bahasa', 'Amanat'],
    tingkat: 'SEDANG',
    kunci: 'A. Tema',
  },
  {
    no: 47,
    soal: 'Kalimat berikut yang mengandung kata kerja aksi (action verb) yang cocok untuk teks narasi adalah...',
    pilihan: [
      'Dia merasa sangat bahagia hari ini.',
      'Budi berlari kencang lalu melompati pagar rumahnya.',
      'Kota Jakarta adalah ibu kota Indonesia.',
      'Udara di pegunungan sangat sejuk.',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Budi berlari kencang lalu melompati pagar rumahnya.',
  },
  {
    no: 48,
    soal: "Perhatikan paragraf: 'Matahari mulai tenggelam di ufuk barat. Aris mempercepat langkah kakinya menyusuri jalan setapak hutan yang makin gelap.' Paragraf tersebut memuat unsur narasi berupa...",
    pilihan: [
      'Konflik dan resolusi',
      'Tokoh, latar waktu, dan latar tempat',
      'Koda dan pesan moral',
      'Penjelasan ilmiah',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Tokoh, latar waktu, dan latar tempat',
  },
  {
    no: 49,
    soal: 'Ciri khas kalimat yang digunakan dalam narasi sugestif adalah...',
    pilihan: [
      'Berorientasi menyajikan fakta faktual tanpa rekaan',
      'Membangun imajinasi dan emosi pembaca melalui cerita naratif dramatis',
      'Menyajikan panduan instruksi teknis',
      'Menggunakan ragam bahasa baku dan formula matematis',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Membangun imajinasi dan emosi pembaca melalui cerita naratif dramatis',
  },
  {
    no: 50,
    soal: 'Bagian komplikasi pada teks narasi ditandai dengan...',
    pilihan: [
      'Karakter hidup damai tanpa kendala',
      'Timbulnya masalah, persoalan, atau percekcokan yang dialami tokoh',
      'Masalah telah selesai dan cerita berakhir',
      'Penjelasan definisi istilah cerita',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Timbulnya masalah, persoalan, atau percekcokan yang dialami tokoh',
  },
  {
    no: 51,
    soal: 'Mengapa kronologi atau urutan waktu sangat penting dalam penyusunan teks narasi?',
    pilihan: [
      'Agar teks tampak indah saat dibaca',
      'Menjaga alur cerita tetap logis dan tidak membingungkan pembaca mengenai jalannya peristiwa',
      'Agar cerita dapat langsung diubah menjadi puisi',
      'Mencegah penggunaan majas secara berlebihan',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Menjaga alur cerita tetap logis dan tidak membingungkan pembaca mengenai jalannya peristiwa',
  },
  {
    no: 52,
    soal: "Bacalah kutipan: 'Akhirnya setelah berjuang keras melintasi badai, Rian berhasil menemukan obat untuk ibunya. Mereka pun hidup bahagia.' Paragraf ini menduduki fungsi struktur...",
    pilihan: [
      'Orientasi dan klimaks',
      'Komplikasi awal',
      'Resolusi dan Koda',
      'Deskripsi fisik',
    ],
    tingkat: 'SEDANG',
    kunci: 'C. Resolusi dan Koda',
  },
  {
    no: 53,
    soal: 'Perbedaan teks narasi ekspositoris dan narasi sugestif terletak pada...',
    pilihan: [
      'Ekspositoris bertujuan memberi informasi nyata berdasar fakta, sugestif bertujuan memberi pengalaman estetis imajinatif',
      'Ekspositoris berisi cerita fiksi hantu, sugestif berisi cerita sejarah',
      'Ekspositoris berbentuk puisi, sugestif berbentuk paragraf deskripsi',
      'Ekspositoris tidak memiliki tokoh, sugestif memiliki banyak tokoh',
    ],
    tingkat: 'SULIT',
    kunci: 'A. Ekspositoris bertujuan memberi informasi nyata berdasar fakta, sugestif bertujuan memberi pengalaman estetis imajinatif',
  },
  {
    no: 54,
    soal: 'Manakah urutan kronologis yang runtut untuk menyusun narasi pendek di bawah ini?\n1) Ia mengemas tasnya dan berlari ke stasiun.\n2) Kereta api ternyata sudah membunyikan peluit keberangkatan.\n3) Alarm Dito berdering pukul 06.00 pagi.\n4) Dengan napas tersengal, ia melompat masuk tepat sebelum pintu tertutup.',
    pilihan: ['3 - 1 - 2 - 4', '1 - 3 - 2 - 4', '3 - 2 - 1 - 4', '2 - 1 - 3 - 4'],
    tingkat: 'SULIT',
    kunci: 'A. 3 - 1 - 2 - 4',
  },
  {
    no: 55,
    soal: 'Unsur narasi yang bertugas membangun suasana perasaan batin para tokoh ketika menghadapi kemalangan dinamakan...',
    pilihan: [
      'Latar suasana',
      'Latar alat',
      'Alur campuran',
      'Sudut pandang serbatah',
    ],
    tingkat: 'SULIT',
    kunci: 'A. Latar suasana',
  },

  // ===== BAB 4: MAJAS DAN MAKNA DENOTATIF-KONOTATIF (56-70) =====
  {
    no: 56,
    soal: 'Gaya bahasa atau pemanfaatan kekayaan bahasa untuk memperoleh efek tertentu dalam karya sastra disebut...',
    pilihan: ['Diksi', 'Majas / Gaya Bahasa', 'Ejaan', 'Gramatika'],
    tingkat: 'MUDAH',
    kunci: 'B. Majas / Gaya Bahasa',
  },
  {
    no: 57,
    soal: 'Makna denotatif adalah makna kata yang bersifat...',
    pilihan: [
      'Makna kiasan atau tersirat',
      'Makna sebenarnya, lugas, dan sesuai kamus',
      'Makna yang menimbulkan konotasi negatif',
      'Makna yang dipengaruhi emosi pengarang',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Makna sebenarnya, lugas, dan sesuai kamus',
  },
  {
    no: 58,
    soal: 'Majas yang membandingkan dua hal secara langsung tanpa menggunakan kata pembanding (seperti, bagai) dinamakan majas...',
    pilihan: ['Simile', 'Metafora', 'Personifikasi', 'Ironi'],
    tingkat: 'MUDAH',
    kunci: 'B. Metafora',
  },
  {
    no: 59,
    soal: 'Majas yang menganggap benda mati dapat berprilaku atau bertindak seperti manusia adalah majas...',
    pilihan: ['Personifikasi', 'Hiperbola', 'Litotes', 'Sarkasme'],
    tingkat: 'MUDAH',
    kunci: 'A. Personifikasi',
  },
  {
    no: 60,
    soal: 'Majas yang mengungkapkan sesuatu dengan cara melebih-lebihkan kenyataan hingga tak masuk akal disebut...',
    pilihan: ['Ironi', 'Litotes', 'Hiperbola', 'Metafora'],
    tingkat: 'MUDAH',
    kunci: 'C. Hiperbola',
  },
  {
    no: 61,
    soal: "Bacalah kalimat: 'Pena menari-nari di atas kertas putih.' Kalimat tersebut mengandung majas...",
    pilihan: ['Hiperbola', 'Personifikasi', 'Metafora', 'Sarkasme'],
    tingkat: 'SEDANG',
    kunci: 'B. Personifikasi',
  },
  {
    no: 62,
    soal: 'Kalimat yang menggunakan majas Simile ditandai dengan kata pembanding...',
    pilihan: [
      'Adalah, merupakan',
      'Seperti, bagaikan, laksana',
      'Yang, untuk, dari',
      'Walaupun, tetapi, melainkan',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Seperti, bagaikan, laksana',
  },
  {
    no: 63,
    soal: 'Manakah kalimat berikut yang memuat majas Litotes (merendahkan diri)?',
    pilihan: [
      'Suaranya menggelegar membelah angkasa.',
      'Mampirlah ke gubuk reotku ini walau sekadar minum air putih.',
      'Wah, indah sekali tulisanmu sampai tidak bisa dibaca!',
      'Dia adalah anak emas dalam keluarga kami.',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Mampirlah ke gubuk reotku ini walau sekadar minum air putih.',
  },
  {
    no: 64,
    soal: "Bacalah kalimat: 'Bagus sekali nilai ujiamu, dari sepuluh soal hanya benar satu!' Kalimat tersebut mengaplikasikan majas...",
    pilihan: ['Ironi', 'Sarkasme', 'Litotes', 'Metafora'],
    tingkat: 'SEDANG',
    kunci: 'A. Ironi',
  },
  {
    no: 65,
    soal: 'Perbedaan utama antara majas Ironi dan majas Sarkasme adalah...',
    pilihan: [
      'Ironi bersifat merendahkan diri sendiri, sarkasme memuji orang lain',
      'Ironi menggunakan sindiran halus secara bertolak belakang, sarkasme menggunakan kata pedas/kasar secara langsung',
      'Ironi membandingkan benda mati, sarkasme melebih-lebihkan fakta',
      'Ironi memiliki makna denotatif, sarkasme bermakna lugas',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Ironi menggunakan sindiran halus secara bertolak belakang, sarkasme menggunakan kata pedas/kasar secara langsung',
  },
  {
    no: 66,
    soal: 'Manakah dari kalimat berikut yang menggunakan ungkapan bermakna KONOTATIF?',
    pilihan: [
      'Kambing hitam milik Pak Ali dipotong saat Iduladha.',
      'Pemuda itu dijadikan kambing hitam atas kasus pencurian tersebut.',
      'Ibu membeli buah apel yang berwarna merah segar.',
      'Tangan kiri Budi terkilir saat bermain bola.',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Pemuda itu dijadikan kambing hitam atas kasus pencurian tersebut.',
  },
  {
    no: 67,
    soal: "Bacalah kalimat: 'Raja siang telah bangkit dari peraduannya di ufuk timur.' Ungkapan 'Raja siang' merupakan majas...",
    pilihan: ['Metafora', 'Personifikasi', 'Simile', 'Litotes'],
    tingkat: 'SEDANG',
    kunci: 'A. Metafora',
  },
  {
    no: 68,
    soal: 'Kalimat berikut yang bermakna DENOTATIF murni adalah...',
    pilihan: [
      'Pak Ahmad gulung tikar karena usahanya bangkrut.',
      'Karena panik, Adik menyenggol dan menggulung tikar di ruang tamu.',
      'Ia dikenal sebagai sosok yang panjang tangan di kampungnya.',
      'Hati-hati berbicara dengan orang yang besar kepala.',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Karena panik, Adik menyenggol dan menggulung tikar di ruang tamu.',
  },
  {
    no: 69,
    soal: "Bacalah sindiran berikut: 'Otakmu benar-benar tumpul seperti batu, penjelasan semudah ini saja tidak paham!' Kalimat kasar di atas dikategorikan sebagai majas...",
    pilihan: ['Ironi', 'Personifikasi', 'Sarkasme', 'Litotes'],
    tingkat: 'SULIT',
    kunci: 'C. Sarkasme',
  },
  {
    no: 70,
    soal: 'Manakah analisis pasangan majas dan kalimat yang BENAR di bawah ini?',
    pilihan: [
      'Hiperbola - Sampah-sampah itu berbisik memanggil pemulung.',
      'Simile - Wajahnya cerah bagaikan rembulan di malam hari.',
      'Litotes - Jeritan tangisnya menguncang isi bumi.',
      'Metafora - Silakan nikmati santapan ala kadarnya di istana ini.',
    ],
    tingkat: 'SULIT',
    kunci: 'B. Simile - Wajahnya cerah bagaikan rembulan di malam hari.',
  },

  // ===== BAGIAN II: SOAL ESSAY YANG DIUBAH MENJADI PILIHAN GANDA (71-100) =====
  // TEKS DESKRIPSI DAN EKSPLANASI (71-78)
  {
    no: 71,
    soal: 'Manakah pernyataan yang paling tepat membedakan fokus utama antara teks deskripsi dan teks eksplanasi?',
    pilihan: [
      'A. Deskripsi berfokus pada gambaran fisik/suasana objek, sedangkan eksplanasi berfokus pada urutan kronologis fiksi',
      'B. Deskripsi berfokus pada gambaran fisik atau suasana suatu objek, sedangkan eksplanasi berfokus pada proses sebab-akibat terjadinya fenomena',
      'C. Deskripsi bertujuan membujuk pembaca, sedangkan eksplanasi menceritakan mitos zaman dahulu',
      'D. Deskripsi memuat fakta ilmiah sains, sedangkan eksplanasi memuat opini pribadi penulis',
    ],
    tingkat: 'MUDAH',
    kunci:
      'B. Deskripsi berfokus pada gambaran fisik atau suasana suatu objek, sedangkan eksplanasi berfokus pada proses sebab-akibat terjadinya fenomena',
  },
  {
    no: 72,
    soal: 'Tiga cerapan pancaindra yang umum digunakan dalam penyusunan teks deskripsi lingkungan sekitar adalah...',
    pilihan: [
      'A. Penglihatan, pendengaran, dan penciuman',
      'B. Pengecap, kalkulasi, dan penglihatan',
      'C. Peraba, ingatan, dan emosi',
      'D. Kognitif, afektif, dan psikomotorik',
    ],
    tingkat: 'MUDAH',
    kunci: 'A. Penglihatan, pendengaran, dan penciuman',
  },
  {
    no: 73,
    soal: 'Struktur baku penyusun teks eksplanasi secara urut dan lengkap terdiri dari...',
    pilihan: [
      'A. Orientasi - Komplikasi - Resolusi',
      'B. Identifikasi - Deskripsi Bagian - Simpulan',
      'C. Pernyataan Umum - Deretan Penjelas - Interpretasi',
      'D. Tesis - Pembuktian - Reorientasi',
    ],
    tingkat: 'SEDANG',
    kunci: 'C. Pernyataan Umum - Deretan Penjelas - Interpretasi',
  },
  {
    no: 74,
    soal: "Bacalah paragraf: 'Ruang kelas kami sangat bersih dan tertata rapi. Lantai keramik putihnya berkilau tanpa ada sebutir debu. Meja berjejer teratur diiringi aroma harum pembersih lantai.' Paragraf tersebut termasuk jenis teks...",
    pilihan: [
      'A. Eksplanasi kausalitas',
      'B. Deskripsi ruangan/spasial',
      'C. Narasi sugestif',
      'D. Eksposisi argumentatif',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Deskripsi ruangan/spasial',
  },
  {
    no: 75,
    soal: 'Di bawah ini yang seluruhnya merupakan konjungsi kausalitas (sebab-akibat) yang tepat untuk teks eksplanasi adalah...',
    pilihan: [
      'A. Lalu, kemudian, selanjutnya',
      'B. Karena, sebab, oleh karena itu',
      'C. Serta, dan, lagipula',
      'D. Seandainya, bilamana, jika',
    ],
    tingkat: 'MUDAH',
    kunci: 'B. Karena, sebab, oleh karena itu',
  },
  {
    no: 76,
    soal: 'Mengapa teks eksplanasi wajib berlandaskan pada data faktual dan kebenaran ilmiah?',
    pilihan: [
      'A. Agar teks disukai oleh pembaca cerita fiksi',
      'B. Karena bertujuan menyampaikan pengetahuan nyata tentang fenomena yang dapat dipertanggungjawabkan',
      'C. Agar dapat dimasukkan ke dalam buku puisi',
      'D. Agar penulis dapat mengekspresikan imajinasinya secara bebas',
    ],
    tingkat: 'SEDANG',
    kunci:
      'B. Karena bertujuan menyampaikan pengetahuan nyata tentang fenomena yang dapat dipertanggungjawabkan',
  },
  {
    no: 77,
    soal: "Manakah di bawah ini yang merupakan ubahan kalimat 'Sungai di desa kami penuh sampah dan baunya busuk' menjadi kalimat eksplanasi kausalitas yang tepat?",
    pilihan: [
      'A. Sungai desa kami terlihat sangat hitam dan dikelilingi sampah plastik yang menumpuk.',
      'B. Penumpukan sampah secara terus-menerus memicu pembusukan zat cair, sehingga menimbulkan aroma busuk dan mencemari air sungai.',
      'C. Budi melemparkan kantong sampah ke sungai sambil tertawa.',
      'D. Alangkah indahnya jika sungai di desa kami tidak penuh dengan sampah busuk.',
    ],
    tingkat: 'SULIT',
    kunci:
      'B. Penumpukan sampah secara terus-menerus memicu pembusukan zat cair, sehingga menimbulkan aroma busuk dan mencemari air sungai.',
  },
  {
    no: 78,
    soal: "Dalam teks eksplanasi, bagian 'Interpretasi' berfungsi untuk...",
    pilihan: [
      'A. Memperkenalkan nama tokoh utama dan wataknya',
      'B. Menyampaikan kesimpulan, ulasan, atau tanggapan kritis penulis terhadap fenomena yang telah dijelaskan',
      'C. Menguraikan perincian sebab-akibat secara mendalam',
      'D. Memberikan gambaran warna dan ukuran fisik objek',
    ],
    tingkat: 'SULIT',
    kunci:
      'B. Menyampaikan kesimpulan, ulasan, atau tanggapan kritis penulis terhadap fenomena yang telah dijelaskan',
  },

  // KARYA SASTRA FIKSI DAN PUISI (79-86)
  {
    no: 79,
    soal: 'Pasangan jenis karya berikut yang seluruhnya tergolong ke dalam karya sastra fiksi adalah...',
    pilihan: [
      'A. Cerpen dan Novel',
      'B. Biografi dan Jurnal Ilmiah',
      'C. Teks Berita dan Laporan Hasil Observasi',
      'D. Makalah dan Artikel Ilmiah',
    ],
    tingkat: 'MUDAH',
    kunci: 'A. Cerpen dan Novel',
  },
  {
    no: 80,
    soal: 'Lima unsur intrinsik yang wajib ada dalam cerita fiksi (novel/cerpen) adalah...',
    pilihan: [
      'A. Diksi, rima, bait, majas, dan tipografi',
      'B. Tema, tokoh/penokohan, latar, alur, dan amanat',
      'C. Pernyataan umum, deretan penjelas, koda, tesis, dan orientasi',
      'D. Judul, penerbit, tahun terbit, tebal halaman, dan harga buku',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Tema, tokoh/penokohan, latar, alur, dan amanat',
  },
  {
    no: 81,
    soal: 'Perbedaan mendasar antara tokoh protagonis dan tokoh antagonis dalam fiksi adalah...',
    pilihan: [
      'A. Protagonis membawa watak baik/pembawa cerita utama, sedangkan antagonis adalah penentang yang memicu konflik',
      'B. Protagonis berwatak jahat, sedangkan antagonis berwatak netral',
      'C. Protagonis muncul sekali, sedangkan antagonis muncul di setiap halaman',
      'D. Protagonis berwujud hewan, sedangkan antagonis selalu berwujud manusia',
    ],
    tingkat: 'MUDAH',
    kunci:
      'A. Protagonis membawa watak baik/pembawa cerita utama, sedangkan antagonis adalah penentang yang memicu konflik',
  },
  {
    no: 82,
    soal: "Perhatikan bait puisi berikut:\n'Air jernih mengalir tenang,\nMenyapa batu di tepi kali.\nHati gembira memandang terang,\nSungai bersih dijaga berseri.'\nBait puisi di atas bertemakan...",
    pilihan: [
      'A. Keindahan dan kecintaan pada kebersihan sungai',
      'B. Bencana banjir bandang menerjang desa',
      'C. Penyesalan manusia merusak pepohonan',
      'D. Perjuangan mencari ikan di laut',
    ],
    tingkat: 'SEDANG',
    kunci: 'A. Keindahan dan kecintaan pada kebersihan sungai',
  },
  {
    no: 83,
    soal: 'Perbedaan mendasar antara cerita rakyat Fabel dan Legenda terletak pada...',
    pilihan: [
      'A. Fabel menokohkan hewan berprilaku seperti manusia, sedangkan legenda menceritakan asal-usul tempat',
      'B. Fabel berisi fakta sejarah, sedangkan legenda berupa puisi singkat',
      'C. Fabel dituis dalam bentuk drama, sedangkan legenda ditulis dalam bentuk berita',
      'D. Fabel tidak ber-amanat, sedangkan legenda dipenuhi rumus matematika',
    ],
    tingkat: 'SEDANG',
    kunci:
      'A. Fabel menokohkan hewan berprilaku seperti manusia, sedangkan legenda menceritakan asal-usul tempat',
  },
  {
    no: 84,
    soal: 'Alur cerita fiksi yang menguraikan peristiwa secara kronologis dari masa kini menuju masa depan disebut alur maju, sedangkan alur mundur (flashback) adalah...',
    pilihan: [
      'A. Cerita yang meloncat-loncat tanpa arah',
      'B. Cerita yang diawali dari kondisi masa kini lalu kembali mengenang peristiwa masa lalu',
      'C. Cerita yang tidak pernah selesai',
      'D. Cerita yang hanya berisi dialog tokoh',
    ],
    tingkat: 'SEDANG',
    kunci:
      'B. Cerita yang diawali dari kondisi masa kini lalu kembali mengenang peristiwa masa lalu',
  },
  {
    no: 85,
    soal: 'Mengapa pemilihan diksi yang cermat sangat penting dalam penulisan puisi lingkungan sekitar?',
    pilihan: [
      'A. Agar jumlah kata dalam puisi menjadi sangat banyak',
      'B. Membantu menciptakan citraan estetik yang kuat dan mengetuk perasaan emosional pembaca tentang alam',
      'C. Menjaga agar puisi dapat dibaca dengan cepat tanpa jeda',
      'D. Menghindari pembaca dari pemahaman isi puisi',
    ],
    tingkat: 'SULIT',
    kunci:
      'B. Membantu menciptakan citraan estetik yang kuat dan mengetuk perasaan emosional pembaca tentang alam',
  },
  {
    no: 86,
    soal: "Fungsi utama dari unsur 'Amanat' bagi pembaca cerita fiksi adalah...",
    pilihan: [
      'A. Memberikan petunjuk alamat tempat pengarang tinggal',
      'B. Menyampaikan pesan moral dan keteladanan positif yang dapat dipetik dalam kehidupan',
      'C. Menjelaskan rincian biaya penerbitan buku',
      'D. Memberikan kritik atas tata bahasa cerita',
    ],
    tingkat: 'SEDANG',
    kunci:
      'B. Menyampaikan pesan moral dan keteladanan positif yang dapat dipetik dalam kehidupan',
  },

  // TEKS NARASI (87-92)
  {
    no: 87,
    soal: 'Teks narasi secara mendasar didefinisikan sebagai...',
    pilihan: [
      'A. Teks yang berisi lukisan fisik suatu benda secara mendalam',
      'B. Teks yang menceritakan urutan peristiwa/kejadian secara kronologis dari waktu ke waktu',
      'C. Teks yang memuat argumen pembuktian hukum alam',
      'D. Teks karangan iklan produk',
    ],
    tingkat: 'MUDAH',
    kunci:
      'B. Teks yang menceritakan urutan peristiwa/kejadian secara kronologis dari waktu ke waktu',
  },
  {
    no: 88,
    soal: 'Struktur baku teks narasi dari tahap awal hingga penutup secara runtut adalah...',
    pilihan: [
      'A. Orientasi - Komplikasi - Resolusi - Koda',
      'B. Pernyataan umum - Deretan penjelas - Interpretasi',
      'C. Identifikasi - Deskripsi bagian - Kesimpulan',
      'D. Pembuka - Isi - Penutup',
    ],
    tingkat: 'MUDAH',
    kunci: 'A. Orientasi - Komplikasi - Resolusi - Koda',
  },
  {
    no: 89,
    soal: "Peristiwa utama yang terjadi pada bagian 'Komplikasi' dalam teks narasi adalah...",
    pilihan: [
      'A. Pengenalan latar dan nama-nama tokoh',
      'B. Munculnya masalah, perselisihan, atau konflik hingga mencapai klimaks',
      'C. Penyelesaian atas semua konflik yang dihadapi tokoh',
      'D. Penjelasan amanat eksplisit penulis',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Munculnya masalah, perselisihan, atau konflik hingga mencapai klimaks',
  },
  {
    no: 90,
    soal: "Sudut pandang orang pertama dalam narasi ditandai dengan penggunaan kata ganti 'Aku/Saya', sedangkan sudut pandang orang ketiga ditandai dengan kata ganti...",
    pilihan: [
      'A. Kamu / Kalian',
      'B. Dia / Mereka / Nama Tokoh',
      'C. Kita / Kami',
      'D. Saya / Aku',
    ],
    tingkat: 'SEDANG',
    kunci: 'B. Dia / Mereka / Nama Tokoh',
  },
  {
    no: 91,
    soal: 'Pasangan kalimat berikut yang memperlihatkan hubungan urutan waktu (kronologis) dalam teks narasi adalah...',
    pilihan: [
      'A. Budi merapikan seragamnya. Kemudian, ia bergegas berlari menuju stasiun kereta.',
      'B. Air laut menguap karena sengatan panas matahari.',
      'C. Rumah tua itu tampak sepi dan berdebu tebal.',
      'D. Gunung Bromo berdiri megah di Jawa Timur.',
    ],
    tingkat: 'SEDANG',
    kunci:
      'A. Budi merapikan seragamnya. Kemudian, ia bergegas berlari menuju stasiun kereta.',
  },
  {
    no: 92,
    soal: "Mengapa bagian 'Resolusi' wajib hadir untuk mengakhiri alur cerita narasi?",
    pilihan: [
      'A. Agar pengarang dapat menambah jumlah tokoh baru',
      'B. Memberikan peleraian dan penyelesaian atas konflik yang dialami para tokoh',
      'C. Mengubah cerita narasi menjadi laporan ilmiah',
      'D. Memperpanjang ketegangan masalah tanpa batas',
    ],
    tingkat: 'SULIT',
    kunci:
      'B. Memberikan peleraian dan penyelesaian atas konflik yang dialami para tokoh',
  },

  // MAJAS DAN MAKNA KATA (93-100)
  {
    no: 93,
    soal: 'Perbedaan mendasar makna Denotatif dan makna Konotatif adalah...',
    pilihan: [
      'A. Denotatif bermakna lugas/sebenarnya sesuai kamus, konotatif bermakna kiasan/tersirat',
      'B. Denotatif bermakna kiasan, konotatif bermakna sebenarnya',
      'C. Denotatif digunakan dalam puisi, konotatif dalam rumus kimia',
      'D. Denotatif bernilai negatif, konotatif bernilai positif',
    ],
    tingkat: 'MUDAH',
    kunci:
      'A. Denotatif bermakna lugas/sebenarnya sesuai kamus, konotatif bermakna kiasan/tersirat',
  },
  {
    no: 94,
    soal: 'Kalimat berikut yang mengandung majas Personifikasi adalah...',
    pilihan: [
      'A. Ombak berkejar-kejaran menghantam karang di tepi pantai.',
      'B. Hatinya hancur berkeping-keping menjadi seribu bagian.',
      'C. Wajahnya bersinar seperti rembulan malam.',
      'D. Mampirlah ke gubuk reot kami ini.',
    ],
    tingkat: 'SEDANG',
    kunci: 'A. Ombak berkejar-kejaran menghantam karang di tepi pantai.',
  },
  {
    no: 95,
    soal: 'Kalimat berikut yang merupakan contoh majas Hiperbola tentang kondisi cuaca panas adalah...',
    pilihan: [
      'A. Sinar matahari siang ini begitu terik membakar dan memanggang kulit hingga mendidih.',
      'B. Hari ini udara cukup hangat seperti biasanya.',
      'C. Matahari menyapa kita dengan senyuman ramah.',
      'D. Dingin sekali udara di siang hari ini.',
    ],
    tingkat: 'MUDAH',
    kunci:
      'A. Sinar matahari siang ini begitu terik membakar dan memanggang kulit hingga mendidih.',
  },
  {
    no: 96,
    soal: "Kalimat 'Wajah gadis itu sangat bersih dan berseri-seri bagaikan bulan purnama' menggunakan majas...",
    pilihan: ['A. Metafora', 'B. Simile', 'C. Litotes', 'D. Sarkasme'],
    tingkat: 'SEDANG',
    kunci: 'B. Simile',
  },
  {
    no: 97,
    soal: 'Perbedaan fungsi antara majas Ironi dan majas Litotes yang paling tepat adalah...',
    pilihan: [
      'A. Ironi berfungsi menyindir orang lain secara halus dengan kata bertolak belakang, sedangkan Litotes merendahkan diri sendiri secara sopan',
      'B. Ironi merendahkan diri sendiri, sedangkan litotes menyindir musuh',
      'C. Ironi membandingkan hewan, sedangkan litotes membandingkan manusia',
      'D. Ironi bermakna denotatif, sedangkan litotes bermakna ilmiah',
    ],
    tingkat: 'SULIT',
    kunci:
      'A. Ironi berfungsi menyindir orang lain secara halus dengan kata bertolak belakang, sedangkan Litotes merendahkan diri sendiri secara sopan',
  },
  {
    no: 98,
    soal: "Tentukan majas yang terkandung dalam kalimat: 'Peluru kendali itu menyambar tubuh musuh dengan sangat cepat.'",
    pilihan: ['A. Metafora', 'B. Personifikasi', 'C. Litotes', 'D. Ironi'],
    tingkat: 'SEDANG',
    kunci: 'B. Personifikasi',
  },
  {
    no: 99,
    soal: "Manakah pasangan kalimat di bawah ini yang menggunakan kata 'berdarah' secara Denotatif (1) dan Konotatif (2)?",
    pilihan: [
      'A. (1) Kaki Budi berdarah terkena kaca. (2) Para pejuang berdarah-darah merebut kemerdekaan.',
      'B. (1) Bajunya berdarah terkena sirup. (2) Lukanya berdarah.',
      'C. (1) Pejuang berdarah-darah di medan perang. (2) Kaki Budi berdarah.',
      'D. (1) Daging ini berdarah. (2) Ikan itu berdarah.',
    ],
    tingkat: 'SULIT',
    kunci:
      'A. (1) Kaki Budi berdarah terkena kaca. (2) Para pejuang berdarah-darah merebut kemerdekaan.',
  },
  {
    no: 100,
    soal: 'Mengapa penggunaan majas Sarkasme sebaiknya dihindari dalam komunikasi sehari-hari?',
    pilihan: [
      'A. Karena mengandung bahasa kiasan yang sulit dipahami',
      'B. Karena bersifat sangat pedas dan kasar sehingga dapat melukai perasaan lawan bicara',
      'C. Karena majas sarkasme membuat kalimat menjadi terlalu panjang',
      'D. Karena sarkasme hanya boleh digunakan oleh pejabat',
    ],
    tingkat: 'SULIT',
    kunci:
      'B. Karena bersifat sangat pedas dan kasar sehingga dapat melukai perasaan lawan bicara',
  },

];

const OPTION_PREFIX = /^[A-E]\.\s*/;

function stripOptionPrefix(option: string): string {
  return option.replace(OPTION_PREFIX, '').trim();
}

/** Kunci jawaban asli berformat "B. Teks Deskripsi" -> "Teks Deskripsi" */
function normalizeKey(key: string): string {
  return stripOptionPrefix(key);
}

function toQuestion(raw: RawQuestion): Question {
  const difficulty = DIFFICULTY_MAP[raw.tingkat];
  const reward = DIFFICULTY_REWARD[difficulty];
  const isMultipleChoice = Array.isArray(raw.pilihan) && raw.pilihan.length > 0;

  if (isMultipleChoice) {
    const options = raw.pilihan!.map(stripOptionPrefix);
    const correctAnswer = normalizeKey(raw.kunci ?? '');

    return {
      id: `bi_${String(raw.no).padStart(3, '0')}`,
      type: 'multiple_choice',
      difficulty,
      category: 'Bahasa Indonesia',
      subject: 'b_indonesia',
      text: raw.soal,
      options,
      correctAnswer,
      explanation: `Kunci jawaban: ${raw.kunci ?? '-'}`,
      timeLimit: reward.timeLimit,
      coinsReward: reward.coinsReward,
      movementReward: reward.movementReward,
      tags: ['Bahasa Indonesia', difficulty],
    };
  }

  return {
    id: `bi_${String(raw.no).padStart(3, '0')}`,
    type: 'short_answer',
    difficulty,
    category: 'Bahasa Indonesia',
    subject: 'b_indonesia',
    text: raw.soal,
    options: [],
    correctAnswer: raw.jawaban ?? '',
    explanation: `Kunci jawaban: ${raw.jawaban ?? '-'}`,
    timeLimit: reward.timeLimit,
    coinsReward: reward.coinsReward,
    movementReward: reward.movementReward,
    tags: ['Bahasa Indonesia', 'Essay', difficulty],
  };
}

/** 100 soal Bahasa Indonesia yang berasal dari Bahasa_Indonesia.py */
export const BAHASA_INDONESIA_QUESTIONS: Question[] = RAW_QUESTIONS.map(toQuestion);
