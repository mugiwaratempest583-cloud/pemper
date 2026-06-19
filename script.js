// ============================================================
// 1. KONFIGURASI LEVEL (10 LEVEL)
//    Level 1: 3x3, Level 2: 4x4, ... Level 10: 12x12
// ============================================================
const LEVELS = [];
for (let i = 1; i <= 10; i++) {
    const size = i + 2; // 3,4,5,...,12
    LEVELS.push({ level: i, size: size });
}

// ============================================================
// 2. STATE GAME
// ============================================================
let currentLevel = 1;
let currentSize = 3;
let tiles = [];
let emptyIndex = 0;
let moves = 0;
let timer = 0;
let timerInterval = null;
let isPlaying = false;
let isFinished = false;

// ============================================================
// 3. SPLASH & LOADING SCREEN
// ============================================================
let loadProgress = 0;
const loaderBar = document.getElementById('loaderBar');
const loadingText = document.getElementById('loadingText');

function simulateLoading() {
    if (loadProgress >= 100) {
        document.getElementById('splash').style.display = 'none';
        return;
    }
    loadProgress += Math.random() * 15 + 5;
    if (loadProgress > 100) loadProgress = 100;
    loaderBar.style.width = loadProgress + '%';
    loadingText.textContent = `Memuat ${Math.floor(loadProgress)}%`;
    setTimeout(simulateLoading, 200);
}

// Jalankan loading saat halaman dimuat
window.addEventListener('load', () => {
    setTimeout(simulateLoading, 500);
});

// ============================================================
// 4. NAVIGASI SCREEN
// ============================================================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function goToHome() {
    showScreen('homeScreen');
    stopTimer();
}

function goToAbout() {
    showScreen('aboutScreen');
}

function goToLevelSelect() {
    showScreen('levelScreen');
    renderLevelButtons();
}

function goToGame(level) {
    currentLevel = level;
    const size = LEVELS.find(l => l.level === level).size;
    currentSize = size;
    showScreen('gameScreen');
    document.getElementById('levelDisplay').textContent = level;
    initGame(size);
}

function exitGame() {
    if (confirm('Yakin ingin keluar dari game?')) {
        document.body.innerHTML = '<h1 style="color:#fff;text-align:center;margin-top:50px;">Terima kasih telah bermain! 👋</h1>';
    }
}

// ============================================================
// 5. LEVEL BUTTONS
// ============================================================
function renderLevelButtons() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    LEVELS.forEach(lv => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = `${lv.level}\n${lv.size}×${lv.size}`;
        btn.style.whiteSpace = 'pre-line';
        btn.addEventListener('click', () => goToGame(lv.level));
        grid.appendChild(btn);
    });
}

// ============================================================
// 6. GAME CORE
// ============================================================
function initGame(size) {
    const total = size * size;
    tiles = [];
    for (let i = 1; i < total; i++) tiles.push(i);
    tiles.push(0); // 0 = kosong
    emptyIndex = total - 1;
    moves = 0;
    timer = 0;
    isPlaying = false;
    isFinished = false;
    stopTimer();
    document.getElementById('timerDisplay').textContent = '0';
    document.getElementById('movesDisplay').textContent = '0';
    shuffleBoard();
    renderBoard();
}

function renderBoard() {
    const board = document.getElementById('board');
    const size = currentSize;
    const gap = 6;
    const maxWidth = Math.min(window.innerWidth - 60, 600);
    const tileSize = Math.floor((maxWidth - (gap * (size - 1))) / size);
    const finalSize = Math.min(tileSize, 120);

    board.style.gridTemplateColumns = `repeat(${size}, ${finalSize}px)`;
    board.style.gap = gap + 'px';
    board.innerHTML = '';

    for (let i = 0; i < tiles.length; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (tiles[i] === 0) {
            tile.classList.add('empty');
            tile.textContent = '';
        } else {
            tile.textContent = tiles[i];
            const hue = (tiles[i] * 37) % 360;
            tile.style.background = `hsl(${hue}, 70%, 55%)`;
            tile.style.boxShadow = `0 4px 0 hsl(${hue}, 70%, 35%)`;
        }
        tile.dataset.index = i;
        tile.addEventListener('click', () => onTileClick(i));
        board.appendChild(tile);
    }
    document.getElementById('movesDisplay').textContent = moves;
}

function onTileClick(index) {
    if (isFinished) return;
    const size = currentSize;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    const clickRow = Math.floor(index / size);
    const clickCol = index % size;
    const dr = Math.abs(clickRow - emptyRow);
    const dc = Math.abs(clickCol - emptyCol);

    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        if (!isPlaying && !isFinished) {
            isPlaying = true;
            startTimer();
        }
        tiles[emptyIndex] = tiles[index];
        tiles[index] = 0;
        emptyIndex = index;
        moves++;
        renderBoard();

        if (checkWin()) {
            isFinished = true;
            isPlaying = false;
            stopTimer();
            showWinPopup();
        }
    }
}

function checkWin() {
    for (let i = 0; i < tiles.length - 1; i++) {
        if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
}

// ============================================================
// 7. SHUFFLE & RESET
// ============================================================
function shuffleBoard() {
    if (isFinished) return;
    stopTimer();
    isPlaying = false;
    const size = currentSize;
    let empty = emptyIndex;
    for (let i = 0; i < 500; i++) {
        const row = Math.floor(empty / size);
        const col = empty % size;
        const neighbors = [];
        if (row > 0) neighbors.push(empty - size);
        if (row < size - 1) neighbors.push(empty + size);
        if (col > 0) neighbors.push(empty - 1);
        if (col < size - 1) neighbors.push(empty + 1);
        const rand = neighbors[Math.floor(Math.random() * neighbors.length)];
        tiles[empty] = tiles[rand];
        tiles[rand] = 0;
        empty = rand;
    }
    emptyIndex = empty;
    moves = 0;
    timer = 0;
    isFinished = false;
    document.getElementById('timerDisplay').textContent = '0';
    document.getElementById('movesDisplay').textContent = '0';
    renderBoard();
}

function resetBoard() {
    if (isFinished) return;
    stopTimer();
    isPlaying = false;
    const size = currentSize;
    const total = size * size;
    tiles = [];
    for (let i = 1; i < total; i++) tiles.push(i);
    tiles.push(0);
    emptyIndex = total - 1;
    moves = 0;
    timer = 0;
    isFinished = false;
    document.getElementById('timerDisplay').textContent = '0';
    document.getElementById('movesDisplay').textContent = '0';
    shuffleBoard();
}

// ============================================================
// 8. TIMER
// ============================================================
function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
        timer++;
        document.getElementById('timerDisplay').textContent = timer;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ============================================================
// 9. POPUP MENANG
// ============================================================
function showWinPopup() {
    document.getElementById('winTime').textContent = timer;
    document.getElementById('winMoves').textContent = moves;
    document.getElementById('winPopup').style.display = 'flex';
}

function closeWinPopup() {
    document.getElementById('winPopup').style.display = 'none';
    goToLevelSelect();
}

// ============================================================
// 10. QUIT GAME
// ============================================================
function quitGame() {
    if (confirm('Kembali ke menu utama?')) {
        stopTimer();
        isPlaying = false;
        isFinished = false;
        goToHome();
    }
}

// ============================================================
// 11. RESIZE OTOMATIS
// ============================================================
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (document.getElementById('gameScreen').classList.contains('active')) {
            renderBoard();
        }
    }, 300);
});