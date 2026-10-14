"use strict";

/* PENGATURAN LEVEL */
const LEVELS = {
  easy: {
    name: "Mudah",
    interval: 2000,
    points: 5,
    grades: { S: 12, A: 9, B: 6, C: 3 },
  },
  normal: {
    name: "Normal",
    interval: 1500,
    points: 10,
    grades: { S: 10, A: 8, B: 5, C: 3 },
  },
  hard: {
    name: "Sulit",
    interval: 800,
    points: 15,
    grades: { S: 8, A: 6, B: 4, C: 2 },
  },
  extreme: {
    name: "Ekstrem",
    interval: 400,
    points: 25,
    grades: { S: 6, A: 5, B: 3, C: 2 },
  },
};

const DURASI_GAME = 30;
const KEY_LEADERBOARD = "tangkapKotakLeaderboard";

/* AMBIL ELEMEN HTML */
const menuScreen = document.getElementById("menuScreen");
const gameScreen = document.getElementById("gameScreen");

const namaPemainInput = document.getElementById("namaPemain");
const pilihLevel = document.getElementById("pilihLevel");

const mulaiBtn = document.getElementById("mulaiBtn");
const keluarBtn = document.getElementById("keluarBtn");
const mainLagiBtn = document.getElementById("mainLagiBtn");
const menuBtn = document.getElementById("menuBtn");
const resetLeaderboardBtn = document.getElementById("resetLeaderboard");

const arena = document.getElementById("arena");
const kotak = document.getElementById("kotak");
const pesanArena = document.getElementById("pesanArena");

const skorElement = document.getElementById("skor");
const waktuElement = document.getElementById("waktu");
const labelLevel = document.getElementById("labelLevel");

const countdown = document.getElementById("countdown");
const countdownNumber = document.getElementById("countdownNumber");

const gameOver = document.getElementById("gameOver");
const hasilNama = document.getElementById("hasilNama");
const hasilSkor = document.getElementById("hasilSkor");
const hasilTangkap = document.getElementById("hasilTangkap");
const hasilGrade = document.getElementById("hasilGrade");
const hasilPesan = document.getElementById("hasilPesan");

const leaderboardBody = document.getElementById("leaderboardBody");

/* STATUS GAME */
let namaPemain = "Pemain";
let levelAktif = LEVELS.normal;
let keyLevelAktif = "normal";

let skor = 0;
let jumlahTangkap = 0;
let waktuTersisa = DURASI_GAME;

let timerGame = null;
let timerCountdown = null;
let timerGerak = null;

let sedangBermain = false;
let sedangCountdown = false;

/* LEADERBOARD */
function ambilLeaderboard() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY_LEADERBOARD) || "[]");

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Leaderboard tidak dapat dibaca:", error);
    return [];
  }
}

function simpanLeaderboard(data) {
  try {
    localStorage.setItem(KEY_LEADERBOARD, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Leaderboard tidak dapat disimpan:", error);
    alert("Skor tidak bisa disimpan di browser ini.");
    return false;
  }
}

function tampilkanLeaderboard() {
  const data = ambilLeaderboard();

  leaderboardBody.replaceChildren();

  if (data.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "Belum ada skor. Jadilah yang pertama!";

    row.appendChild(cell);
    leaderboardBody.appendChild(row);
    return;
  }

  data.slice(0, 10).forEach((pemain, index) => {
    const row = document.createElement("tr");

    const nilai = [
      index + 1,
      pemain.nama,
      pemain.level,
      pemain.skor,
      pemain.grade,
    ];

    nilai.forEach((isi) => {
      const cell = document.createElement("td");
      cell.textContent = isi;
      row.appendChild(cell);
    });

    leaderboardBody.appendChild(row);
  });
}

function tambahLeaderboard() {
  const grade = hitungGrade(jumlahTangkap);

  const data = ambilLeaderboard();

  data.push({
    nama: namaPemain,
    level: levelAktif.name,
    skor: skor,
    tangkapan: jumlahTangkap,
    grade: grade,
    tanggal: new Date().toISOString(),
  });

  data.sort((a, b) => b.skor - a.skor);

  simpanLeaderboard(data.slice(0, 10));
  tampilkanLeaderboard();
}

/* GRADE */
function hitungGrade(tangkapan) {
  const grades = levelAktif.grades;

  if (tangkapan >= grades.S) return "S";
  if (tangkapan >= grades.A) return "A";
  if (tangkapan >= grades.B) return "B";
  if (tangkapan >= grades.C) return "C";

  return "D";
}

/* RESET TIMER */
function hentikanTimer() {
  clearInterval(timerGame);
  clearInterval(timerCountdown);
  clearTimeout(timerGerak);

  timerGame = null;
  timerCountdown = null;
  timerGerak = null;
}

/* POSISI KOTAK ACAK */
function pindahkanKotak() {
  if (!sedangBermain) return;

  const batasArena = arena.getBoundingClientRect();
  const batasKotak = kotak.getBoundingClientRect();

  const lebarKotak = batasKotak.width || 48;
  const tinggiKotak = batasKotak.height || 48;

  const margin = 8;

  const maxX = Math.max(margin, batasArena.width - lebarKotak - margin);

  const maxY = Math.max(margin, batasArena.height - tinggiKotak - margin);

  const x = margin + Math.random() * (maxX - margin);
  const y = margin + Math.random() * (maxY - margin);

  kotak.style.left = `${x + lebarKotak / 2}px`;
  kotak.style.top = `${y + tinggiKotak / 2}px`;
  kotak.classList.add("visible");
}

/* GERAK OTOMATIS */
function jadwalkanGerakan() {
  clearTimeout(timerGerak);

  if (!sedangBermain) return;

  timerGerak = setTimeout(() => {
    pindahkanKotak();
    jadwalkanGerakan();
  }, levelAktif.interval);
}

/* PERBARUI HUD */
function perbaruiHUD() {
  skorElement.textContent = skor;
  waktuElement.textContent = waktuTersisa;
  labelLevel.textContent = levelAktif.name;
}

/* MULAI GAME */
async function mulaiGame() {
  if (sedangBermain || sedangCountdown) return;

  hentikanTimer();

  namaPemain = namaPemainInput.value.trim() || "Pemain";
  keyLevelAktif = pilihLevel.value;
  levelAktif = LEVELS[keyLevelAktif] || LEVELS.normal;

  skor = 0;
  jumlahTangkap = 0;
  waktuTersisa = DURASI_GAME;

  sedangBermain = false;
  sedangCountdown = true;

  menuScreen.style.display = "none";
  gameScreen.classList.add("active");

  kotak.classList.remove("visible");
  gameOver.classList.add("hidden");
  countdown.classList.remove("hidden");

  pesanArena.textContent = "Bersiaplah!";
  countdownNumber.textContent = "3";

  perbaruiHUD();

  /* Minta fullscreen jika didukung browser */
  try {
    if (
      document.fullscreenEnabled &&
      !document.fullscreenElement &&
      gameScreen.requestFullscreen
    ) {
      await gameScreen.requestFullscreen();
    }
  } catch (error) {
    /* Game tetap bisa dimainkan tanpa fullscreen */
    console.info("Fullscreen tidak tersedia:", error);
  }

  /* Jika user sudah keluar ketika permintaan fullscreen berjalan */
  if (!sedangCountdown || !gameScreen.classList.contains("active")) {
    return;
  }

  let hitung = 3;

  timerCountdown = setInterval(() => {
    hitung--;

    if (hitung > 0) {
      countdownNumber.textContent = hitung;
    } else {
      clearInterval(timerCountdown);
      timerCountdown = null;
      countdown.classList.add("hidden");
      mulaiRonde();
    }
  }, 1000);
}

/* MULAI RONDE */
function mulaiRonde() {
  sedangCountdown = false;
  sedangBermain = true;

  pesanArena.textContent = "Tangkap kotaknya!";
  perbaruiHUD();
  pindahkanKotak();
  jadwalkanGerakan();

  timerGame = setInterval(() => {
    waktuTersisa--;
    perbaruiHUD();

    if (waktuTersisa <= 0) {
      akhiriGame();
    }
  }, 1000);
}

/* KOTAK DITANGKAP */
function tangkapKotak(event) {
  if (!sedangBermain) return;

  if (event) {
    event.preventDefault();
  }

  jumlahTangkap++;
  skor += levelAktif.points;

  perbaruiHUD();
  pindahkanKotak();
  jadwalkanGerakan();
}

/* AKHIRI GAME */
function akhiriGame() {
  if (!sedangBermain) return;

  sedangBermain = false;
  sedangCountdown = false;

  hentikanTimer();

  kotak.classList.remove("visible");
  countdown.classList.add("hidden");
  gameOver.classList.remove("hidden");

  const grade = hitungGrade(jumlahTangkap);

  hasilNama.textContent = namaPemain;
  hasilSkor.textContent = skor;
  hasilTangkap.textContent = jumlahTangkap;
  hasilGrade.textContent = grade;

  if (grade === "S") {
    hasilPesan.textContent = "Luar biasa! Refleks kamu sangat cepat!";
  } else if (grade === "A") {
    hasilPesan.textContent = "Hebat! Pertahankan kecepatanmu!";
  } else if (grade === "B") {
    hasilPesan.textContent = "Bagus! Coba tingkatkan jumlah tangkapanmu.";
  } else if (grade === "C") {
    hasilPesan.textContent = "Lumayan! Terus berlatih agar makin cepat.";
  } else {
    hasilPesan.textContent = "Jangan menyerah! Coba lagi dan tingkatkan skor.";
  }

  tambahLeaderboard();
}

/* KEMBALI KE MENU */
async function keluarGame() {
  sedangBermain = false;
  sedangCountdown = false;

  hentikanTimer();

  kotak.classList.remove("visible");
  countdown.classList.add("hidden");
  gameOver.classList.add("hidden");

  gameScreen.classList.remove("active");
  menuScreen.style.display = "";

  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.info("Tidak dapat keluar fullscreen:", error);
  }
}

/* TOMBOL EVENT */
mulaiBtn.addEventListener("click", mulaiGame);

keluarBtn.addEventListener("click", keluarGame);

kotak.addEventListener("pointerdown", tangkapKotak);

mainLagiBtn.addEventListener("click", () => {
  mulaiGame();
});

menuBtn.addEventListener("click", keluarGame);

resetLeaderboardBtn.addEventListener("click", () => {
  const yakin = confirm("Yakin ingin menghapus semua data leaderboard?");

  if (!yakin) return;

  try {
    localStorage.removeItem(KEY_LEADERBOARD);
    tampilkanLeaderboard();
  } catch (error) {
    alert("Leaderboard tidak dapat dihapus.");
    console.error(error);
  }
});

/* JIKA UKURAN ARENA BERUBAH */
window.addEventListener("resize", () => {
  if (sedangBermain) {
    pindahkanKotak();
  }
});

/* JIKA FULLSCREEN DITUTUP LEWAT BROWSER */
document.addEventListener("fullscreenchange", () => {
  if (
    !document.fullscreenElement &&
    gameScreen.classList.contains("active") &&
    !sedangBermain &&
    !sedangCountdown
  ) {
    gameScreen.classList.remove("active");
    menuScreen.style.display = "";
  }
});

/* TAMPILKAN DATA AWAL */
tampilkanLeaderboard();
