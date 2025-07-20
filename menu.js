// Конфигурация приложения
const CONFIG = {
    colors: ['#ff4655', '#4655ff', '#55ff46', '#ff6eb8', '#ff8c46', '#ffde46', '#2b2b4b', '#d6d6d6', '#8c46ff', '#8c5e3a', '#46fff2', '#b3ff46'],
    defaultName: 'Player',
    defaultVolume: 80
};

// Глобальное состояние приложения
const AppState = {
    peer: null,
    currentConnection: null,
    currentPlayerColor: CONFIG.colors[0],
    currentPlayerName: CONFIG.defaultName,
    audio: {
        click: null,
        select: null,
        volume: CONFIG.defaultVolume / 100
    },
    isHost: false
};

// ======================
// Основные функции инициализации
// ======================

/**
 * Инициализация аудио системы
 */
function initAudio() {
    try {
        AppState.audio = {
            click: new Audio('assets/sounds/click.wav'),
            select: new Audio('assets/sounds/select.wav'),
            volume: (localStorage.getItem('gameVolume') || CONFIG.defaultVolume) / 100
        };
    } catch (e) {
        console.error("Audio initialization failed:", e);
        // Создаем заглушки, если файлы не найдены
        AppState.audio = {
            click: { play: () => {}, volume: 0.8 },
            select: { play: () => {}, volume: 0.8 },
            volume: 0.8
        };
    }
}

/**
 * Воспроизведение звука
 */
function playSound(type) {
    if (!AppState.audio[type]) return;
    
    try {
        AppState.audio[type].currentTime = 0;
        AppState.audio[type].volume = AppState.audio.volume;
        AppState.audio[type].play().catch(e => console.log("Audio play error:", e));
    } catch (e) {
        console.error(`Sound ${type} error:`, e);
    }
}

/**
 * Загрузка сохраненных данных игрока
 */
function loadPlayerData() {
    AppState.currentPlayerName = localStorage.getItem('playerName') || CONFIG.defaultName;
    AppState.currentPlayerColor = localStorage.getItem('playerColor') || CONFIG.colors[0];
    document.querySelector('.player-name').textContent = AppState.currentPlayerName;
    updatePlayerPreviews();
}

/**
 * Обновление превью игрока
 */
function updatePlayerPreviews() {
    document.querySelectorAll('.player-preview').forEach(el => {
        el.style.backgroundColor = AppState.currentPlayerColor;
    });
}

// ======================
// Система меню и навигации
// ======================

/**
 * Инициализация главного меню
 */
function initMainMenu() {
    const menuOptions = document.getElementById('menu-options');
    if (!menuOptions) return;

    menuOptions.innerHTML = '';
    
    const buttons = [
        { text: 'ОНЛАЙН', action: showOnlineMenu },
        { text: 'КАК ИГРАТЬ', action: showHowToPlay },
        { text: 'КАСТОМИЗАЦИЯ', action: () => switchScreen('customize-screen') },
        { text: 'НАСТРОЙКИ', action: () => switchScreen('settings-screen') },
        { text: 'ПОЛНЫЙ ЭКРАН', action: toggleFullscreen }
    ];

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'menu-btn';
        button.textContent = btn.text;
        button.addEventListener('click', () => {
            playSound('click');
            btn.action();
        });
        menuOptions.appendChild(button);
    });
}

/**
 * Переключение между экранами
 */
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId)?.classList.add('active');
}

/**
 * Настройка кнопок "Назад"
 */
function setupBackButtons() {
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen('main-menu');
            playSound('click');
        });
    });
}

// ======================
// Кастомизация персонажа
// ======================

function initCustomization() {
    const container = document.getElementById('color-options');
    if (!container) return;

    container.innerHTML = '';
    
    CONFIG.colors.forEach(color => {
        const colorBtn = document.createElement('div');
        colorBtn.className = 'color-btn';
        colorBtn.style.backgroundColor = color;
        colorBtn.addEventListener('click', () => {
            AppState.currentPlayerColor = color;
            updatePlayerPreviews();
            localStorage.setItem('playerColor', color);
            playSound('select');
        });
        container.appendChild(colorBtn);
    });
}

// ======================
// Система настроек
// ======================

function initSettings() {
    const slider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const nameInput = document.getElementById('nickname-input');
    
    if (!slider || !volumeValue || !nameInput) return;

    // Настройка громкости
    slider.addEventListener('input', () => {
        const volume = slider.value;
        volumeValue.textContent = volume;
        AppState.audio.volume = volume / 100;
        localStorage.setItem('gameVolume', volume);
    });
    
    // Настройка имени игрока
    nameInput.addEventListener('input', (e) => {
        const newName = e.target.value.trim().slice(0, 10) || CONFIG.defaultName;
        AppState.currentPlayerName = newName;
        document.querySelector('.player-name').textContent = newName;
        localStorage.setItem('playerName', newName);
    });
    
    // Загрузка сохраненных значений
    const savedVolume = localStorage.getItem('gameVolume') || CONFIG.defaultVolume;
    slider.value = savedVolume;
    volumeValue.textContent = savedVolume;
    AppState.audio.volume = savedVolume / 100;
    
    nameInput.value = localStorage.getItem('playerName') || CONFIG.defaultName;
}

// ======================
// Онлайн-режим (PeerJS)
// ======================

function showOnlineMenu() {
    const menuOptions = document.getElementById('menu-options');
    if (!menuOptions) return;

    menuOptions.innerHTML = `
        <div class="online-menu">
            <h3>РЕЖИМ ОНЛАЙНА</h3>
            <button class="menu-btn" id="host-btn">СОЗДАТЬ КОМНАТУ</button>
            <button class="menu-btn" id="join-btn">ЗАЙТИ ПО ID</button>
            <button class="menu-btn" id="back-btn">НАЗАД</button>
        </div>
    `;
    
    document.getElementById('host-btn')?.addEventListener('click', createRoom);
    document.getElementById('join-btn')?.addEventListener('click', joinRoom);
    document.getElementById('back-btn')?.addEventListener('click', initMainMenu);
}

function createRoom() {
   AppState.peer = new Peer({
  host: "amongus-p2p.fly.dev",
  secure: true,
  port: 443,
  path: "/peerjs"
});
});

    AppState.peer.on('open', (id) => {
        const menuOptions = document.getElementById('menu-options');
        if (!menuOptions) return;

        menuOptions.innerHTML = `
            <div class="room-menu">
                <h3>КОМНАТА СОЗДАНА</h3>
                <div class="room-id">${id}</div>
                <button class="menu-btn" id="copy-btn">СКОПИРОВАТЬ ID</button>
                <button class="menu-btn" id="close-btn">ЗАКРЫТЬ КОМНАТУ</button>
            </div>
        `;
        
        document.getElementById('copy-btn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(id)
                .then(() => alert('Room ID copied to clipboard!'))
                .catch(() => prompt('Copy this ID manually:', id));
        });
        
        document.getElementById('close-btn')?.addEventListener('click', closeRoom);
        
        AppState.peer.on('Connection', (conn) => {
            AppState.currentConnection = conn;
            setupConnectionHandlers(conn);
            playSound('select');
            alert(`Игрок подключился: ${conn.peer}`);
        });
    });

    AppState.peer.on('error', handlePeerError);
}

function joinRoom() {
    const roomId = prompt("Вставьте ID:");
    if (!roomId) return;

    AppState.peer = new Peer();
    AppState.isHost = false;

    AppState.peer.on('open', () => {
        AppState.currentConnection = AppState.peer.connect(roomId);
        setupConnectionHandlers(AppState.currentConnection);
    });

    AppState.peer.on('error', handlePeerError);
}

function setupConnectionHandlers(conn) {
    conn.on('open', () => {
        playSound('select');
        alert("ВЫ ЗАШЛИ В КОМНАТУ!");
    });

    conn.on('data', handleGameData);
    conn.on('error', handlePeerError);
    conn.on('close', () => {
        alert("ОШИБКА СОЕДИНЕНИЯ ⚠️");
        initMainMenu();
    });
}

function handleGameData(data) {
    console.log("Received game data:", data);
    // Здесь будет обработка игровых событий
}

function handlePeerError(err) {
    console.error("PeerJS error:", err);
    alert(`Connection error: ${err.message}`);
    initMainMenu();
}

function closeRoom() {
    if (AppState.peer) {
        AppState.peer.destroy();
        AppState.peer = null;
    }
    initMainMenu();
}

// ======================
// Вспомогательные функции
// ======================

function showHowToPlay() {
    alert("🔴 ПРЕДАТЕЛЬ: Заботажируйте и убивайте\n⚪ ЧЛЕН ЭКИПАЖА: выполняйте задания");
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(e => {
            console.error("Fullscreen error:", e);
        });
    } else {
        document.exitFullscreen?.();
    }
}

// ======================
// Инициализация приложения
// ======================

/**
 * Проверка необходимых DOM-элементов
 */
function checkDOM() {
    const requiredElements = [
        'main-menu', 'customize-screen', 'settings-screen',
        'menu-options', 'color-options', 'volume-slider',
        'volume-value', 'nickname-input'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error("Missing elements:", missingElements);
        return false;
    }
    return true;
}

/**
 * Основная функция инициализации
 */
function initAll() {
    if (!checkDOM()) {
        console.error("Critical DOM elements missing!");
        return;
    }

    initAudio();
    loadPlayerData();
    initMainMenu();
    initCustomization();
    initSettings();
    setupBackButtons();
}

// Запуск приложения
if (document.readyState === 'complete') {
    initAll();
} else {
    document.addEventListener('DOMContentLoaded', initAll);
}