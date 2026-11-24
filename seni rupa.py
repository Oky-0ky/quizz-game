"""
Bank Soal Seni Rupa Kelas 5 SD (100 Soal Pilihan Tanpa Huruf A, B, C, D)
Materi:
- Bab I  : Unsur Rupa Berulang pada Karya Dekoratif (Soal 1-34)
- Bab II : Teknik Mewarnai (Soal 35-67)
- Bab III: Prinsip Rupa Ritme (Soal 68-100)

Distribusi posisi jawaban benar:
Pilihan 1 = 25 soal | Pilihan 2 = 25 soal | Pilihan 3 = 25 soal | Pilihan 4 = 25 soal

Cara menjalankan (ekspor otomatis ke Word .docx):
    pip install python-docx
    python soal_seni_rupa_100.py
"""

from collections import Counter

BANK_SOAL = [
    # ==================== BAB I ====================
    {
        "nomor": 1,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Unsur seni rupa paling dasar yang terbentuk dari gabungan titik-titik yang memanjang disebut ....",
        "pilihan": ["bidang", "garis", "tekstur", "ruang"],
        "jawaban": 2,
    },
    {
        "nomor": 2,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Karya seni rupa yang dibuat dengan tujuan utama untuk menghias permukaan suatu benda agar terlihat lebih indah disebut karya ....",
        "pilihan": ["patung", "lukisan realis", "ilustrasi cerita", "dekoratif"],
        "jawaban": 4,
    },
    {
        "nomor": 3,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Susunan unsur garis atau bidang yang diulang secara teratur pada karya dekoratif disebut ....",
        "pilihan": ["pola", "sketsa", "arsiran", "bayangan"],
        "jawaban": 1,
    },
    {
        "nomor": 4,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Gambar yang disusun dengan pola garis atau bidang tertentu sehingga menipu penglihatan mata dan tampak seolah bergerak disebut ....",
        "pilihan": ["gambar perspektif", "gambar bentuk", "ilusi optik", "lukisan naturalis"],
        "jawaban": 3,
    },
    {
        "nomor": 5,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Gabungan dari beberapa garis yang ujung dan pangkalnya saling bertemu akan membentuk suatu ....",
        "pilihan": ["titik", "bidang", "warna", "gelap terang"],
        "jawaban": 2,
    },
    {
        "nomor": 6,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Efek ilusi optikal sederhana pada kertas gambar dapat diciptakan dengan menyusun garis secara ....",
        "pilihan": ["sejajar dan berulang", "acak dan terputus", "tipis dan samar", "menumpuk di satu sudut"],
        "jawaban": 1,
    },
    {
        "nomor": 7,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Pengulangan unsur rupa pada karya dekoratif bertujuan untuk menciptakan kesan ....",
        "pilihan": ["suram dan kosong", "berantakan dan rumit", "kaku dan membosankan", "keseimbangan dan keindahan"],
        "jawaban": 4,
    },
    {
        "nomor": 8,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Garis yang memiliki bentuk patah-patah naik turun secara tajam disebut garis ....",
        "pilihan": ["lengkung", "spiral", "zig-zag", "mendatar"],
        "jawaban": 3,
    },
    {
        "nomor": 9,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Susunan garis lengkung yang dibuat berulang dan berdekatan dapat menimbulkan kesan seolah gambar tersebut sedang ....",
        "pilihan": ["bergerak atau bergetar", "menghilang dari kertas", "berubah menjadi huruf", "membeku dan diam"],
        "jawaban": 1,
    },
    {
        "nomor": 10,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Contoh penerapan karya dekoratif dengan pola berulang yang terkenal di Indonesia adalah ....",
        "pilihan": ["poster layanan masyarakat", "batik dan ukiran", "foto pemandangan alam", "peta wilayah provinsi"],
        "jawaban": 2,
    },
    {
        "nomor": 11,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Garis yang melingkar secara terus-menerus memusat atau melebar seperti obat nyamuk bakar disebut garis ....",
        "pilihan": ["vertikal", "horizontal", "diagonal", "spiral"],
        "jawaban": 4,
    },
    {
        "nomor": 12,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Alat bantu yang paling tepat digunakan agar garis lurus pada pola geometris dekoratif terlihat rapi adalah ....",
        "pilihan": ["jangka", "kuas lukis", "penggaris", "penghapus"],
        "jawaban": 3,
    },
    {
        "nomor": 13,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Pola dekoratif akan terlihat harmonis apabila jarak antarunsur rupa yang diulang dibuat secara ....",
        "pilihan": ["asal-asalan", "bertabrakan", "teratur", "berjauhan tidak menentu"],
        "jawaban": 3,
    },
    {
        "nomor": 14,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Karya gambar dekoratif yang dibuat di atas kertas merupakan jenis karya seni rupa ....",
        "pilihan": ["dua dimensi", "tiga dimensi", "seni pahat", "seni instalasi"],
        "jawaban": 1,
    },
    {
        "nomor": 15,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Garis bergelombang yang diulang secara horizontal sering digunakan untuk menggambarkan suasana ....",
        "pilihan": ["dinding batu yang keras", "gelombang atau lembut", "ledakan yang tajam", "pagar besi yang runcing"],
        "jawaban": 2,
    },
    {
        "nomor": 16,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Unsur seni rupa yang paling kecil dan menjadi awal dari setiap goresan gambar adalah ....",
        "pilihan": ["bidang", "ruang", "tekstur", "titik"],
        "jawaban": 4,
    },
    {
        "nomor": 17,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Fungsi utama motif hias pada benda kerajinan seperti guci atau kain adalah ....",
        "pilihan": ["menambah berat benda", "menghias permukaan benda agar lebih indah", "menutupi bahan asli agar tidak terlihat", "mengurangi nilai jual benda"],
        "jawaban": 2,
    },
    {
        "nomor": 18,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Pola kotak-kotak hitam dan putih yang disusun berselang-seling menciptakan ilusi optik sederhana menyerupai ....",
        "pilihan": ["jaring laba-laba", "lingkaran obat nyamuk", "papan catur", "ranting pepohonan"],
        "jawaban": 3,
    },
    {
        "nomor": 19,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Agar efek ilusi optikal terlihat lebih kuat dan jelas, pemilihan warna pada pola berulang sebaiknya menggunakan ....",
        "pilihan": ["warna yang hampir sama", "warna pudar semua", "satu warna tipis saja", "kontras antara warna gelap dan terang"],
        "jawaban": 4,
    },
    {
        "nomor": 20,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Variasi ketebalan garis dalam membuat pola ilusi optik dapat dilakukan dengan memadukan garis ....",
        "pilihan": ["tebal dan tipis", "panjang dan pendek saja", "putus dan hilang", "basah dan kering"],
        "jawaban": 1,
    },
    {
        "nomor": 21,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Selain pada kertas gambar, karya dekoratif berpola berulang sering diterapkan pada permukaan ....",
        "pilihan": ["kaca jendela mobil", "layar televisi", "keramik atau vas bunga", "jalan raya aspal"],
        "jawaban": 3,
    },
    {
        "nomor": 22,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Bentuk bidang datar yang sering digunakan dalam pola dekoratif berulang antara lain ....",
        "pilihan": ["persegi, segitiga, dan lingkaran", "kubus, balok, dan tabung", "bola, kerucut, dan limas", "batu, kayu, dan tanah"],
        "jawaban": 1,
    },
    {
        "nomor": 23,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Langkah pertama sebelum membuat karya dekoratif dengan pola berulang adalah ....",
        "pilihan": ["langsung mewarnai seluruh kertas", "membingkai kertas dengan kayu", "menghapus seluruh bagian tengah", "menggambar sketsa pola dasar"],
        "jawaban": 4,
    },
    {
        "nomor": 24,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Susunan bidang persegi yang semakin mengecil ke arah tengah gambar dapat menimbulkan ilusi optik berupa kesan ....",
        "pilihan": ["permukaan yang datar", "kedalaman atau ruang tiga dimensi", "benda yang sangat ringan", "warna yang memudar"],
        "jawaban": 2,
    },
    {
        "nomor": 25,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Ilusi optik berupa tonjolan di tengah bidang datar dapat dibuat dengan menarik garis lurus yang berubah menjadi melengkung saat melewati pola lingkaran, lalu dibuat ....",
        "pilihan": ["terputus di bagian tepi", "sangat jarang dan tipis", "miring ke satu arah saja", "berjarak sangat rapat dan melengkung"],
        "jawaban": 4,
    },
    {
        "nomor": 26,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Bentuk dasar yang diulang-ulang hingga membentuk hiasan pada kain batik disebut ....",
        "pilihan": ["bingkai foto", "garis tepi", "motif hias", "arsiran gelap"],
        "jawaban": 3,
    },
    {
        "nomor": 27,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Garis lurus yang membentang mendatar dari kiri ke kanan disebut garis ....",
        "pilihan": ["horizontal", "vertikal", "diagonal", "melengkung"],
        "jawaban": 1,
    },
    {
        "nomor": 28,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Garis lurus yang berdiri tegak dari atas ke bawah disebut garis ....",
        "pilihan": ["horizontal", "vertikal", "spiral", "bergelombang"],
        "jawaban": 2,
    },
    {
        "nomor": 29,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Garis lurus yang posisi kemiringannya menyudut ke kiri atau ke kanan disebut garis ....",
        "pilihan": ["horizontal", "diagonal", "lengkung", "mendatar"],
        "jawaban": 2,
    },
    {
        "nomor": 30,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Menggambar pola dekoratif yang berulang secara rapi bermanfaat untuk melatih ....",
        "pilihan": ["kekuatan otot kaki", "kecepatan berlari", "kemampuan menghafal rumus", "ketelitian dan kesabaran"],
        "jawaban": 4,
    },
    {
        "nomor": 31,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Prinsip utama dalam menyusun unsur garis dan bidang pada karya dekoratif sederhana adalah ....",
        "pilihan": ["pengulangan", "penghapusan", "pemotongan", "penumpukan acak"],
        "jawaban": 1,
    },
    {
        "nomor": 32,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Motif hias tradisional Nusantara yang berbentuk deretan segitiga sama kaki berulang disebut motif ....",
        "pilihan": ["kawung", "parang", "tumpal", "mega mendung"],
        "jawaban": 3,
    },
    {
        "nomor": 33,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Motif dekoratif yang mengambil bentuk tumbuhan dan hewan sebagai inspirasi polanya disebut motif ....",
        "pilihan": ["flora dan fauna", "geometris murni", "abstrak bebas", "teknologi modern"],
        "jawaban": 1,
    },
    {
        "nomor": 34,
        "bab": "Bab I: Unsur Rupa Berulang pada Karya Dekoratif",
        "pertanyaan": "Jika kita menggambar pola lingkaran sepusat dari ukuran besar ke kecil secara berulang, mata kita akan merasakan efek ....",
        "pilihan": ["garis mendatar yang diam", "berputar menuju pusat", "kotak yang bertumpuk", "sudut yang tajam"],
        "jawaban": 2,
    },

    # ==================== BAB II ====================
    {
        "nomor": 35,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Kegiatan mewarnai bidang gambar yang luas dengan gerakan tangan yang leluasa bermanfaat untuk melatih ....",
        "pilihan": ["kemampuan berhitung", "daya ingat jangka panjang", "motorik kasar", "pendengaran anak"],
        "jawaban": 3,
    },
    {
        "nomor": 36,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik mewarnai yang memadukan dua warna atau lebih sehingga terjadi perubahan warna secara halus dari tua ke muda disebut teknik ....",
        "pilihan": ["blok", "arsir", "pointilis", "gradasi"],
        "jawaban": 4,
    },
    {
        "nomor": 37,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Alat mewarnai berbentuk batangan lunak yang terbuat dari lilin dan pigmen warna serta mudah dicampur untuk teknik gradasi adalah ....",
        "pilihan": ["pensil tulis", "spidol kecil", "pulpen tinta", "krayon atau oil pastel"],
        "jawaban": 4,
    },
    {
        "nomor": 38,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik mewarnai dengan cara menutup seluruh bidang gambar menggunakan satu warna secara rata dan penuh disebut teknik ....",
        "pilihan": ["blok atau plakat", "dusel", "aquarel", "titik-titik"],
        "jawaban": 1,
    },
    {
        "nomor": 39,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik mewarnai menggunakan pensil warna dengan cara menggoreskan garis-garis sejajar atau menyilang secara berulang disebut teknik ....",
        "pilihan": ["sapuan basah", "arsir", "semprot", "cap"],
        "jawaban": 2,
    },
    {
        "nomor": 40,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik mewarnai yang dilakukan dengan membuat kumpulan titik-titik kecil secara rapat maupun renggang disebut teknik ....",
        "pilihan": ["plakat", "gradasi", "pointilis", "dusel"],
        "jawaban": 3,
    },
    {
        "nomor": 41,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik mewarnai dengan cara menggosokkan warna menggunakan jari, kapas, atau tisu agar terlihat halus dan lembut disebut teknik ....",
        "pilihan": ["dusel", "arsir", "blok", "garis tepi"],
        "jawaban": 1,
    },
    {
        "nomor": 42,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik mewarnai menggunakan cat air dengan sapuan warna yang tipis dan transparan disebut teknik ....",
        "pilihan": ["krayon tebal", "kerik", "aquarel", "pointilis"],
        "jawaban": 3,
    },
    {
        "nomor": 43,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Alat mewarnai kering yang memiliki ujung runcing dan sangat cocok untuk mewarnai bagian gambar yang sempit dan detail adalah ....",
        "pilihan": ["kuas besar", "pensil warna", "rol cat", "spons busa"],
        "jawaban": 2,
    },
    {
        "nomor": 44,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Urutan langkah yang tepat saat membuat gradasi warna adalah memulainya dari ....",
        "pilihan": ["bagian luar kertas terlebih dahulu", "warna hitam ke semua bagian", "bagian tengah tanpa batas garis", "warna muda ke warna tua atau sebaliknya"],
        "jawaban": 4,
    },
    {
        "nomor": 45,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Saat mewarnai bidang gambar berukuran besar di atas meja atau papan, bagian tubuh yang banyak bergerak melatih motorik kasar adalah ....",
        "pilihan": ["jari kelingking saja", "pergelangan kaki", "lengan dan bahu", "leher dan kepala"],
        "jawaban": 3,
    },
    {
        "nomor": 46,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Agar hasil mewarnai menggunakan krayon atau pensil warna tampak bersih dan tidak berantakan, arah goresan sebaiknya dilakukan ....",
        "pilihan": ["memutar ke segala arah secara acak", "satu arah agar terlihat rapi", "menekan sekuat tenaga hingga kertas robek", "melompat-lompat dari kiri ke kanan"],
        "jawaban": 2,
    },
    {
        "nomor": 47,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Bahan pencampur yang digunakan untuk mengencerkan cat air saat mewarnai dengan teknik sapuan basah adalah ....",
        "pilihan": ["minyak goreng", "bensin", "lem kertas", "air"],
        "jawaban": 4,
    },
    {
        "nomor": 48,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Jenis pewarna yang membutuhkan kuas dan palet saat digunakan untuk mewarnai adalah ....",
        "pilihan": ["cat air", "krayon lilin", "pensil warna", "spidol papan tulis"],
        "jawaban": 1,
    },
    {
        "nomor": 49,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Media kertas yang paling sesuai untuk mewarnai dengan teknik sapuan basah agar tidak mudah sobek adalah ....",
        "pilihan": ["kertas tisu tipis", "kertas koran bekas", "kertas minyak", "kertas gambar yang tebal"],
        "jawaban": 4,
    },
    {
        "nomor": 50,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Dalam teknik gradasi menggunakan krayon, warna yang sering digunakan untuk menghaluskan dan mencerahkan batas antarwarna adalah warna ....",
        "pilihan": ["putih", "hitam", "cokelat tua", "ungu gelap"],
        "jawaban": 1,
    },
    {
        "nomor": 51,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Alat sederhana yang dapat digunakan untuk membersihkan serpihan remahan krayon pada kertas gambar tanpa mengotori warna adalah ....",
        "pilihan": ["telapak tangan yang berkeringat", "penghapus karet yang kotor", "kain lap atau tisu", "penggaris besi"],
        "jawaban": 3,
    },
    {
        "nomor": 52,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Teknik kerik (sgraffito) pada pewarnaan krayon dilakukan dengan cara menumpuk dua lapisan warna lalu ....",
        "pilihan": ["menyiramnya dengan air", "menggores atau mengerik warna", "melipat kertas menjadi dua", "menjemurnya di bawah matahari"],
        "jawaban": 2,
    },
    {
        "nomor": 53,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Gerakan mengayunkan tangan secara luas saat mewarnai latar belakang langit atau laut sangat efektif untuk melatih kemampuan anak dalam ....",
        "pilihan": ["menulis huruf yang sangat kecil", "mengisi bidang gambar yang luas", "melipat kertas origami", "menggunting pola rumit"],
        "jawaban": 2,
    },
    {
        "nomor": 54,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Salah satu tanda kerapian hasil mewarnai pada gambar dekoratif adalah sapuan warna yang ....",
        "pilihan": ["menumpuk hingga kertas berlubang", "menyisakan banyak bagian putih kosong", "tercampur kotor dengan remahan", "tidak keluar dari garis tepi"],
        "jawaban": 4,
    },
    {
        "nomor": 55,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Alat mewarnai yang memiliki tinta cair di dalamnya dan menghasilkan warna yang cerah serta tegas sekali gores adalah ....",
        "pilihan": ["spidol", "pensil grafit", "kapur tulis", "arang kayu"],
        "jawaban": 1,
    },
    {
        "nomor": 56,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Mewarnai gambar menggunakan pensil warna dan krayon termasuk ke dalam kelompok teknik pewarnaan ....",
        "pilihan": ["basah", "campur air", "kering", "semprot"],
        "jawaban": 3,
    },
    {
        "nomor": 57,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Mewarnai gambar menggunakan cat air dan cat poster termasuk ke dalam kelompok teknik pewarnaan ....",
        "pilihan": ["kering", "gosok jari", "basah", "kerik"],
        "jawaban": 3,
    },
    {
        "nomor": 58,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Untuk mewarnai bagian kulit wajah pada gambar manusia agar tampak alami, kombinasi warna yang sering digunakan adalah ....",
        "pilihan": ["hijau tua dan biru", "krem atau kuning muda", "hitam dan abu-abu", "ungu dan merah tua"],
        "jawaban": 2,
    },
    {
        "nomor": 59,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Hasil pewarnaan teknik blok yang baik ditandai dengan permukaan warna yang tampak ....",
        "pilihan": ["halus dan rata", "berbintik-bintik kasar", "bergaris-garis putus", "transparan seperti air"],
        "jawaban": 1,
    },
    {
        "nomor": 60,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Selain melatih otot tangan, kegiatan mewarnai sesuai pola gambar juga melatih ....",
        "pilihan": ["kekuatan suara saat menyanyi", "kelenturan otot punggung", "kecepatan menghafal teks", "koordinasi mata dan tangan"],
        "jawaban": 4,
    },
    {
        "nomor": 61,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Warna dasar yang tidak dapat dihasilkan dari pencampuran warna lain disebut warna primer, yaitu ....",
        "pilihan": ["hijau, oranye, dan ungu", "hitam, putih, dan abu-abu", "merah muda, biru muda, dan krem", "merah, kuning, dan biru"],
        "jawaban": 4,
    },
    {
        "nomor": 62,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Pencampuran warna primer biru dan kuning saat mewarnai akan menghasilkan warna sekunder, yaitu ....",
        "pilihan": ["oranye", "hijau", "ungu", "cokelat"],
        "jawaban": 2,
    },
    {
        "nomor": 63,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Pencampuran warna primer merah dan kuning saat mewarnai akan menghasilkan warna sekunder, yaitu ....",
        "pilihan": ["hijau", "ungu", "oranye atau jingga", "biru tua"],
        "jawaban": 3,
    },
    {
        "nomor": 64,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Pencampuran warna primer merah dan biru saat mewarnai akan menghasilkan warna sekunder, yaitu ....",
        "pilihan": ["ungu", "hijau", "kuning", "oranye"],
        "jawaban": 1,
    },
    {
        "nomor": 65,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Pada teknik arsir menggunakan pensil warna, perbedaan warna terang dan gelap dapat diatur melalui ....",
        "pilihan": ["tekanan tangan saat menggores", "jenis penghapus yang dipakai", "ukuran meja belajar", "warna sampul buku gambar"],
        "jawaban": 1,
    },
    {
        "nomor": 66,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Cara merawat spidol warna setelah selesai digunakan agar tintanya tidak cepat kering adalah ....",
        "pilihan": ["merendam ujungnya di dalam air", "membiarkannya terbuka di atas meja", "menekannya kuat-kuat ke kertas", "menutup kembali tutupnya rapat-rapat"],
        "jawaban": 4,
    },
    {
        "nomor": 67,
        "bab": "Bab II: Teknik Mewarnai",
        "pertanyaan": "Tips agar pewarnaan tidak mudah melewati batas gambar adalah dengan cara ....",
        "pilihan": ["mewarnai bagian tengah dengan cepat", "mewarnai bagian tepi garis terlebih dahulu", "memejamkan mata saat menggores", "menggunakan krayon yang sudah patah"],
        "jawaban": 2,
    },

    # ==================== BAB III ====================
    {
        "nomor": 68,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Pengulangan satu atau beberapa unsur seni rupa secara teratur dan terus-menerus sehingga menimbulkan kesan gerak disebut prinsip ....",
        "pilihan": ["proporsi", "perspektif", "ritme atau irama", "tekstur semu"],
        "jawaban": 3,
    },
    {
        "nomor": 69,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Prinsip rupa ritme pada sebuah karya gambar dapat terbentuk melalui ....",
        "pilihan": ["penggunaan satu titik di sudut kertas", "penghapusan seluruh garis bantu", "pengulangan unsur rupa secara teratur atau bervariasi", "pemotongan kertas menjadi bagian kecil"],
        "jawaban": 3,
    },
    {
        "nomor": 70,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Jenis ritme dalam seni rupa yang disusun dengan mengulang bentuk, ukuran, dan warna yang sama persis secara berurutan disebut ritme ....",
        "pilihan": ["repetisi", "transisi", "oposisi", "radiasi"],
        "jawaban": 1,
    },
    {
        "nomor": 71,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Jenis ritme yang menampilkan perubahan unsur rupa secara bertahap, misalnya dari ukuran besar ke ukuran kecil, disebut ritme ....",
        "pilihan": ["repetisi murni", "kontras acak", "garis patah", "transisi"],
        "jawaban": 4,
    },
    {
        "nomor": 72,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Jenis ritme yang mempertemukan dua unsur yang berlawanan, seperti garis lurus dengan garis lengkung atau bentuk besar dengan kecil secara langsung, disebut ritme ....",
        "pilihan": ["repetisi", "oposisi", "monoton", "sejajar"],
        "jawaban": 2,
    },
    {
        "nomor": 73,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Bentuk-bentuk yang terukur, beraturan, dan memiliki sudut atau lengkungan pasti seperti lingkaran dan segitiga disebut bentuk ....",
        "pilihan": ["organis", "geometris", "abstrak bebas", "alami"],
        "jawaban": 2,
    },
    {
        "nomor": 74,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Bentuk-bentuk yang bebas, tidak kaku, dan menyerupai unsur alam seperti dedaunan dan awan disebut bentuk ....",
        "pilihan": ["geometris", "kubistis", "organis", "silindris"],
        "jawaban": 3,
    },
    {
        "nomor": 75,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Contoh bentuk organis yang sering disusun berulang untuk menciptakan ritme dalam karya seni rupa adalah ....",
        "pilihan": ["daun, bunga, dan ombak air", "persegi, segi lima, dan trapesium", "kubus, balok, dan prisma", "penggaris, buku, dan papan tulis"],
        "jawaban": 1,
    },
    {
        "nomor": 76,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Kelompok bentuk geometris yang dapat dipadukan dalam menggambar ritme adalah ....",
        "pilihan": ["batu kali, ranting, dan awan", "air terjun, api, dan asap", "kelopak bunga, rumput, dan kerang", "persegi panjang, trapesium, dan belah ketupat"],
        "jawaban": 4,
    },
    {
        "nomor": 77,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Penerapan prinsip ritme transisi pada bentuk lingkaran dapat digambarkan dengan menyusun lingkaran dari ukuran ....",
        "pilihan": ["besar, sedang, hingga kecil secara bertahap", "sama besar di seluruh bagian kertas", "kecil semua tanpa perubahan", "terpotong-potong secara acak"],
        "jawaban": 1,
    },
    {
        "nomor": 78,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Penggunaan garis lengkung secara berulang pada gambar prinsip ritme memberikan kesan ....",
        "pilihan": ["kaku dan berat", "tajam dan berbahaya", "diam tak bergerak", "gerak yang mengalir dan dinamis"],
        "jawaban": 4,
    },
    {
        "nomor": 79,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Selain melalui garis dan bentuk, prinsip ritme dalam seni rupa juga dapat diciptakan melalui pengulangan ....",
        "pilihan": ["ukuran kertas", "merek pensil", "warna", "jenis penghapus"],
        "jawaban": 3,
    },
    {
        "nomor": 80,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Kelompok warna merah, jingga, dan kuning yang memberi kesan hangat dan bersemangat disebut warna ....",
        "pilihan": ["dingin", "panas", "netral", "monokrom"],
        "jawaban": 2,
    },
    {
        "nomor": 81,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Kelompok warna biru, hijau, dan ungu yang memberi kesan sejuk dan tenang disebut warna ....",
        "pilihan": ["panas", "dingin", "mencolok", "gelap gulita"],
        "jawaban": 2,
    },
    {
        "nomor": 82,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Untuk menghasilkan karya seni rupa dengan prinsip ritme yang kaya dan menarik, kita dapat menggabungkan tiga unsur utama, yaitu ....",
        "pilihan": ["garis, bentuk, dan warna", "kayu, batu, dan logam", "gunting, lem, dan penggaris", "bingkai, paku, dan tali"],
        "jawaban": 1,
    },
    {
        "nomor": 83,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Ritme yang disusun menggunakan garis zig-zag secara berulang akan menimbulkan kesan gerakan yang ....",
        "pilihan": ["lembut dan tenang", "melingkar halus", "terputus-putus atau patah-patah", "datar seperti air tenang"],
        "jawaban": 3,
    },
    {
        "nomor": 84,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Pengulangan warna hitam dan putih secara bergantian pada susunan bentuk geometris menciptakan ritme dengan kesan ....",
        "pilihan": ["redup dan samar", "hangat seperti matahari", "lembut seperti kapas", "kontras tinggi antara terang dan gelap"],
        "jawaban": 4,
    },
    {
        "nomor": 85,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Penggabungan garis, bentuk, dan warna dalam menyusun ritme harus memperhatikan agar karya tetap memiliki ....",
        "pilihan": ["bagian yang kosong melompong", "warna yang saling bertabrakan kotor", "garis yang keluar dari kertas", "kesatuan dan keharmonisan"],
        "jawaban": 4,
    },
    {
        "nomor": 86,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Manfaat memahami prinsip ritme dalam menggambar adalah agar susunan objek di dalam karya terlihat ....",
        "pilihan": ["penuh sesak tanpa ruang", "berirama dan tidak membosankan", "miring ke satu sisi saja", "sama persis dengan foto"],
        "jawaban": 2,
    },
    {
        "nomor": 87,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Contoh fenomena alam di sekitar kita yang secara alami memperlihatkan prinsip ritme adalah ....",
        "pilihan": ["ombak laut yang berkejaran", "sebuah batu besar di tengah lapangan", "sebatang pensil di atas meja", "selembar kertas putih polos"],
        "jawaban": 1,
    },
    {
        "nomor": 88,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Susunan gradasi warna panas yang berulang pada pola geometris dapat menggunakan perpaduan warna ....",
        "pilihan": ["biru, hijau, dan ungu", "hitam, abu-abu, dan putih", "merah, kuning, dan oranye", "cokelat, biru tua, dan hitam"],
        "jawaban": 3,
    },
    {
        "nomor": 89,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Susunan gradasi warna dingin yang berulang pada pola organis dapat menggunakan perpaduan warna ....",
        "pilihan": ["merah, oranye, dan kuning", "kuning, merah muda, dan cokelat", "biru, hijau, dan ungu", "merah tua, hitam, dan jingga"],
        "jawaban": 3,
    },
    {
        "nomor": 90,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Cara membuat ritme agar tidak terlihat terlalu kaku seperti barisan tiang yang sama persis adalah dengan ....",
        "pilihan": ["menghapus setengah bagian gambar", "menggunakan satu warna saja tanpa garis", "menggambar tanpa melihat kertas", "mengubah ukuran, arah, atau warna secara bertahap"],
        "jawaban": 4,
    },
    {
        "nomor": 91,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Pengulangan bentuk geometris dengan ukuran dan warna yang sama persis tanpa variasi apa pun dalam jumlah sangat banyak berisiko menimbulkan kesan ....",
        "pilihan": ["dinamis dan hidup", "kaku dan monoton", "lembut dan mengalir", "ceria dan bersemangat"],
        "jawaban": 2,
    },
    {
        "nomor": 92,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Susunan garis lurus horizontal dan vertikal yang membentuk pola kotak-kotak berulang pada bangunan menyerupai ritme ....",
        "pilihan": ["susunan batu bata pada dinding", "aliran air sungai yang berkelok", "asap yang mengepul ke udara", "kepulan awan di langit biru"],
        "jawaban": 1,
    },
    {
        "nomor": 93,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Untuk menggambarkan ritme bertema keindahan alam yang lembut, perpaduan unsur yang paling sesuai adalah ....",
        "pilihan": ["garis lengkung dan bentuk awan", "garis zig-zag dan bentuk segitiga tajam", "garis patah-patah dan warna hitam pekat", "garis silang dan sudut siku-siku"],
        "jawaban": 1,
    },
    {
        "nomor": 94,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Untuk menggambarkan ritme bertema ketegasan dan kekuatan, perpaduan unsur yang paling sesuai adalah ....",
        "pilihan": ["garis spiral dan bentuk kelopak bunga", "garis gelombang dan warna pastel tipis", "garis lurus dan bentuk segitiga", "garis titik-titik dan bentuk tetesan air"],
        "jawaban": 3,
    },
    {
        "nomor": 95,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Pola warna merah, kuning, merah, kuning yang diterapkan pada deretan bentuk persegi menunjukkan ritme dengan susunan ....",
        "pilihan": ["acak tanpa aturan", "satu arah memudar", "memusat ke tengah", "selang-seling antara dua warna atau bentuk"],
        "jawaban": 4,
    },
    {
        "nomor": 96,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Susunan bentuk daun yang berderet mengikuti arah garis lengkung menciptakan ritme dengan kesan ....",
        "pilihan": ["patah-patah", "mengalir", "kaku", "bertabrakan"],
        "jawaban": 2,
    },
    {
        "nomor": 97,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Langkah awal dalam merancang karya gambar berprinsip ritme yang memadukan garis, bentuk, dan warna adalah ....",
        "pilihan": ["langsung mencampur semua cat di kertas", "memotong kertas menjadi lingkaran kecil", "menghapus garis sketsa sebelum diwarnai", "menentukan tema dan menyiapkan alat gambar"],
        "jawaban": 4,
    },
    {
        "nomor": 98,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Perpaduan warna cerah dan gelap secara berirama pada bentuk geometris berulang akan membuat karya seni rupa terlihat ....",
        "pilihan": ["kusam dan tidak jelas", "rata seperti kertas kosong", "lebih hidup dan menarik perhatian", "berantakan dan sulit dilihat"],
        "jawaban": 3,
    },
    {
        "nomor": 99,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Dalam menerapkan ritme warna pada gambar pola berulang, kita dapat memadukan kelompok warna dasar dan warna campurannya, yaitu ....",
        "pilihan": ["warna netral dan warna gelap saja", "warna primer dan sekunder", "warna putih dan kertas kosong", "warna pudar dan warna buram"],
        "jawaban": 2,
    },
    {
        "nomor": 100,
        "bab": "Bab III: Prinsip Rupa Ritme",
        "pertanyaan": "Kesimpulan utama dari penerapan prinsip rupa ritme pada karya seni rupa dua dimensi adalah kemampuan untuk ....",
        "pilihan": ["memadukan garis, bentuk, dan warna secara berirama", "meniru gambar pemandangan secara persis", "menggunakan sebanyak mungkin alat gambar", "membuat gambar tanpa menggunakan garis sama sekali"],
        "jawaban": 1,
    },
]


def cek_distribusi_jawaban():
    """Memastikan jumlah soal 100 dan posisi jawaban adil (masing-masing 25)."""
    distribusi = Counter(item["jawaban"] for item in BANK_SOAL)
    assert len(BANK_SOAL) == 100, f"Jumlah soal harus 100, saat ini: {len(BANK_SOAL)}"
    for pos in (1, 2, 3, 4):
        assert distribusi[pos] == 25, f"Posisi {pos} berjumlah {distribusi[pos]}, seharusnya 25"
    return distribusi


def ekspor_ke_docx(nama_file="Bank_Soal_Seni_Rupa_100_Soal.docx"):
    """Mengekspor 100 soal tanpa huruf A, B, C, D beserta kunci jawabannya ke file Word (.docx)."""
    try:
        from docx import Document
        from docx.shared import Pt, Cm
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except ImportError:
        print("Library python-docx belum terpasang. Jalankan: pip install python-docx")
        return

    distribusi = cek_distribusi_jawaban()
    doc = Document()

    # Pengaturan margin halaman (2 cm)
    for section in doc.sections:
        section.top_margin = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.2)
        section.right_margin = Cm(2.0)

    # Judul Dokumen
    judul = doc.add_heading("BANK SOAL SENI RUPA (100 SOAL)", level=1)
    judul.alignment = WD_ALIGN_PARAGRAPH.CENTER

    subjudul = doc.add_paragraph(
        "Materi: Unsur Rupa Berulang, Teknik Mewarnai, dan Prinsip Rupa Ritme\n"
        "Format: Pilihan Jawaban Tanpa Huruf A, B, C, D"
    )
    subjudul.alignment = WD_ALIGN_PARAGRAPH.CENTER

    bab_aktif = None
    for item in BANK_SOAL:
        if item["bab"] != bab_aktif:
            bab_aktif = item["bab"]
            p_bab = doc.add_heading(bab_aktif, level=2)
            p_bab.paragraph_format.space_before = Pt(12)
            p_bab.paragraph_format.space_after = Pt(4)

        # Teks Soal
        p_soal = doc.add_paragraph()
        p_soal.paragraph_format.left_indent = Cm(0.6)
        p_soal.paragraph_format.first_line_indent = Cm(-0.6)
        p_soal.paragraph_format.space_before = Pt(4)
        p_soal.paragraph_format.space_after = Pt(2)
        p_soal.paragraph_format.keep_with_next = True
        run_no = p_soal.add_run(f"{item['nomor']}. ")
        run_no.bold = True
        p_soal.add_run(item["pertanyaan"])

        # Pilihan Jawaban (Bullet tanpa A, B, C, D)
        for opsi in item["pilihan"]:
            p_opsi = doc.add_paragraph()
            p_opsi.paragraph_format.left_indent = Cm(1.1)
            p_opsi.paragraph_format.first_line_indent = Cm(-0.4)
            p_opsi.paragraph_format.space_before = Pt(0)
            p_opsi.paragraph_format.space_after = Pt(1)
            p_opsi.add_run(f"•  {opsi}")

    # Halaman Baru untuk Kunci Jawaban
    doc.add_page_break()
    judul_kunci = doc.add_heading("KUNCI JAWABAN (POSISI PILIHAN 1 - 4)", level=1)
    judul_kunci.alignment = WD_ALIGN_PARAGRAPH.CENTER

    info_dist = doc.add_paragraph(
        f"Distribusi Keadilan Posisi Jawaban: "
        f"Pilihan 1 = {distribusi[1]} soal | "
        f"Pilihan 2 = {distribusi[2]} soal | "
        f"Pilihan 3 = {distribusi[3]} soal | "
        f"Pilihan 4 = {distribusi[4]} soal"
    )
    info_dist.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Tabel Kunci Jawaban 4 Kolom x 25 Baris
    tabel = doc.add_table(rows=25, cols=4)
    tabel.style = "Table Grid"
    for baris in range(25):
        for kolom in range(4):
            idx = kolom * 25 + baris
            soal_item = BANK_SOAL[idx]
            sel = tabel.cell(baris, kolom)
            sel.text = f"{soal_item['nomor']:>3}. Pilihan {soal_item['jawaban']}"

    doc.save(nama_file)
    print(f"Berhasil membuat file '{nama_file}' dengan {len(BANK_SOAL)} soal.")


if __name__ == "__main__":
    dist = cek_distribusi_jawaban()
    print("Verifikasi distribusi jawaban berhasil:", dict(dist))
    ekspor_ke_docx()
