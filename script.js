
const LEVELS = {
    easy: {
        name: "Mudah",
        interval: 3000,
        points: 5,
        grades: { S: 12, A: 9, B: 6, C: 3 }
    },
    normal: {
        name: "Normal",
        interval: 1500,
        points: 10,
        grades: { S: 10, A: 8, B: 5, C: 3 }
    },
    hard: {
        name: "Sulit",
        interval: 1000,
        points: 15,
        grades: { S: 8, A: 6, B: 4, C: 2 }
    },
    extreme: {
        name: "Ekstrem",
        interval: 500,
        points: 25,
        grades: { S: 6, A: 5, B: 3, C: 2 }
    }
};

const DURASI_GAME = 30;
const KEY_LEADERBOARD = "tangkapKotakLeaderboard";

let skor = 0;
let tangkapan = 0;
let waktu = DURASI_GAME;
let intervalWaktu = null;
let timerKotak = null;
let aktif = false;
let levelAktif = LEVELS.normal;
let idPermainan = 0;

const namaInput = document.getElementById("nama");
const pilihanLevel = document.getElementById("level");
const kotak = document.getElementById("kotak");
const arena = document.getElementById("arena");
const overlay = document.getElementById("overlay");

const skorTeks = document.getElementById("skor");
const tangkapanTeks = document.getElementById("tangkapan");
const waktuTeks = document.getElementById("waktu");

const labelLevel = document.getElementById("labelLevel");
const nilaiPoin = document.getElementById("nilaiPoin");
const pesan = document.getElementById("pesan");
const tombol = document.getElementById("mulai");

const gradeHasil = document.getElementById("grade");
const namaHasil = document.getElementById("namaHasil");
const detailHasil = document.getElementById("detailHasil");
const daftarPeringkat = document.getElementById("daftarPeringkat");

// Ambil data leaderboard dari browser
function ambilLeaderboard() {
    try {
        const data = JSON.parse(
            localStorage.getItem(KEY_LEADERBOARD) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Perbarui tampilan informasi level
function perbaruiInfoLevel() {
    const level = LEVELS[pilihanLevel.value];

    labelLevel.textContent = "LEVEL " + level.name.toUpperCase();
    nilaiPoin.textContent = "+" + level.points + " poin / klik";
}

pilihanLevel.addEventListener("change", perbaruiInfoLevel);

// Pindahkan kotak ke lokasi acak
function pindahkanKotak() {
    const maxX = Math.max(0, arena.clientWidth - kotak.offsetWidth);
    const maxY = Math.max(0, arena.clientHeight - kotak.offsetHeight);

    kotak.style.left = Math.random() * maxX + "px";
    kotak.style.top = Math.random() * maxY + "px";
}

// Atur timer perpindahan kotak
function mulaiTimerKotak() {
    clearTimeout(timerKotak);

    const idSaatIni = idPermainan;

    timerKotak = setTimeout(function() {
        if (!aktif || idSaatIni !== idPermainan) {
            return;
        }

        pindahkanKotak();
        mulaiTimerKotak();
    }, levelAktif.interval);
}

// Mulai permainan
function mulaiGame() {
    clearInterval(intervalWaktu);
    clearTimeout(timerKotak);

    idPermainan++;

    skor = 0;
    tangkapan = 0;
    waktu = DURASI_GAME;
    aktif = true;

    levelAktif = LEVELS[pilihanLevel.value];

    skorTeks.textContent = skor;
    tangkapanTeks.textContent = tangkapan;
    waktuTeks.textContent = waktu;

    labelLevel.textContent =
        "LEVEL " + levelAktif.name.toUpperCase();

    nilaiPoin.textContent =
        "+" + levelAktif.points + " poin / klik";

    pesan.textContent = "Ayo tangkap kotaknya!";
    tombol.textContent = "Main Ulang";

    overlay.style.display = "none";
    kotak.style.display = "block";

    gradeHasil.textContent = "—";
    namaHasil.textContent = "Permainan berlangsung...";
    detailHasil.textContent = "Terus tangkap kotak untuk mendapatkan poin.";

    pindahkanKotak();
    mulaiTimerKotak();

    intervalWaktu = setInterval(function() {
        waktu--;
        waktuTeks.textContent = waktu;

        if (waktu <= 0) {
            akhiriGame();
        }
    }, 1000);
}

// Tangkap kotak
function tangkapKotak() {
    if (!aktif) {
        return;
    }

    tangkapan++;
    skor += levelAktif.points;

    skorTeks.textContent = skor;
    tangkapanTeks.textContent = tangkapan;

    pesan.textContent =
        "+" + levelAktif.points + " poin! Total: " + skor;

    // Setelah berhasil diklik, kotak langsung pindah
    pindahkanKotak();
    mulaiTimerKotak();
}

// Tentukan grade sesuai level dan jumlah tangkapan
function hitungGrade(jumlahTangkapan) {
    const grades = levelAktif.grades;

    if (jumlahTangkapan >= grades.S) return "S";
    if (jumlahTangkapan >= grades.A) return "A";
    if (jumlahTangkapan >= grades.B) return "B";
    if (jumlahTangkapan >= grades.C) return "C";

    return "D";
}

function deskripsiGrade(grade) {
    const deskripsi = {
        S: "Luar biasa! Refleks dan ketepatanmu sangat hebat.",
        A: "Hebat! Performa kamu sangat bagus.",
        B: "Bagus! Terus latih kecepatan reaksimu.",
        C: "Lumayan! Coba tingkatkan jumlah tangkapan.",
        D: "Tetap semangat! Berlatih lagi untuk meningkatkan skor."
    };

    return deskripsi[grade];
}

// Simpan hasil ke leaderboard
function simpanHasil(nama, hasil) {
    const data = ambilLeaderboard();

    data.push({
        nama: nama,
        level: levelAktif.name,
        levelId: pilihanLevel.value,
        skor: skor,
        tangkapan: tangkapan,
        grade: hasil,
        tanggal: new Date().toISOString()
    });

    // Skor tertinggi di urutan pertama.
    // Jika poin sama, jumlah tangkapan menjadi penentu berikutnya.
    data.sort(function(a, b) {
        return b.skor - a.skor || b.tangkapan - a.tangkapan;
    });

    try {
        localStorage.setItem(
            KEY_LEADERBOARD,
            JSON.stringify(data.slice(0, 10))
        );
    } catch (error) {
        pesan.textContent =
            "Permainan selesai, tetapi skor gagal disimpan di browser.";
    }

    tampilkanLeaderboard();
}

// Akhiri game dan tampilkan penilaian
function akhiriGame() {
    if (!aktif) {
        return;
    }

    aktif = false;

    clearInterval(intervalWaktu);
    clearTimeout(timerKotak);

    kotak.style.display = "none";

    const nama = namaInput.value.trim() || "Pemain";
    const hasil = hitungGrade(tangkapan);

    pesan.textContent = "Waktu habis! Permainan selesai.";
    gradeHasil.textContent = hasil;
    namaHasil.textContent = nama + " — Grade " + hasil;

    detailHasil.textContent =
        levelAktif.name + " • " +
        tangkapan + " tangkapan • " +
        skor + " poin. " +
        deskripsiGrade(hasil);

    simpanHasil(nama, hasil);
    tombol.textContent = "Main Lagi";
}

// Render leaderboard dengan aman menggunakan textContent
function tampilkanLeaderboard() {
    const data = ambilLeaderboard();

    daftarPeringkat.replaceChildren();

    if (data.length === 0) {
        const baris = document.createElement("tr");
        const sel = document.createElement("td");

        sel.colSpan = 5;
        sel.className = "empty";
        sel.textContent = "Belum ada skor. Jadilah yang pertama!";

        baris.appendChild(sel);
        daftarPeringkat.appendChild(baris);
        return;
    }

    data.forEach(function(pemain, index) {
        const baris = document.createElement("tr");

        const nilai = [
            index + 1,
            pemain.nama,
            pemain.level,
            pemain.skor,
            pemain.grade
        ];

        nilai.forEach(function(teks, kolom) {
            const sel = document.createElement("td");

            if (kolom === 4) {
                const badge = document.createElement("span");
                badge.className = "grade-badge";
                badge.textContent = teks;
                sel.appendChild(badge);
            } else {
                sel.textContent = teks;
            }

            baris.appendChild(sel);
        });

        daftarPeringkat.appendChild(baris);
    });
}

// Reset leaderboard
function hapusLeaderboard() {
    const yakin = confirm(
        "Yakin ingin menghapus seluruh data leaderboard?"
    );

    if (!yakin) {
        return;
    }

    try {
        localStorage.removeItem(KEY_LEADERBOARD);
        tampilkanLeaderboard();
        pesan.textContent = "Leaderboard berhasil direset.";
    } catch (error) {
        pesan.textContent = "Leaderboard gagal dihapus.";
    }
}

// Tampilkan leaderboard saat halaman dibuka
perbaruiInfoLevel();
tampilkanLeaderboard();
