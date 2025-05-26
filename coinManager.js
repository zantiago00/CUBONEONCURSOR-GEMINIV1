// Módulo: coinManager.js
// Descripción: Gestiona monedas, generando tipos basados en la regla 'spawn'
//              del nivel actual definido en config.js. (Versión Refactorizada Definitiva)

// --- Importaciones ---
import { container } from './domRefs.js';
import {
    // Constantes de intervalo
    COIN_BASE_INTERVAL_MS,
    MIN_COIN_INTERVAL_TIME_MS,
    COIN_INTERVAL_RANDOMNESS_MS,
    COIN_INTERVAL_COMBO6_MULTIPLIER,
    // Constantes/Reglas centrales importadas desde config.js
    LEVEL_RULES,
    COIN_BONUSES,
    COIN_TYPES
} from './config.js'; // Asegúrate que importa de config.js actualizado
import * as state from './state.js'; // Necesario para leer nivel actual y combo

// --- Estado Interno del Módulo ---
let coins = [];             // Array con datos de monedas activas
let coinTimeoutId = null;   // ID del timeout para la próxima moneda
let lastCoinSpawnTime = 0; // Timestamp del último spawn

// ===========================================================
//                    FUNCIONES PÚBLICAS
// ===========================================================

/** Inicializa o resetea el gestor para una nueva partida. */
export function initCoinManager() {
    coins = [];
    lastCoinSpawnTime = 0;
    clearCoinTimeout();
    console.log("CoinManager: Gestor de monedas inicializado.");
}

/**
 * Programa la aparición de la siguiente moneda.
 * @param {boolean} gameRunning - Si el juego está activo.
 * @param {number} currentCombo - Combo actual (para ajustar frecuencia).
 */
export function scheduleNextCoin(gameRunning, currentCombo) {
    if (!gameRunning) {
        clearCoinTimeout();
        return;
    }
    clearCoinTimeout();

    const now = Date.now();
    let baseInterval = COIN_BASE_INTERVAL_MS;

    if (currentCombo >= 6) {
        baseInterval *= COIN_INTERVAL_COMBO6_MULTIPLIER;
    }
    baseInterval += Math.random() * COIN_INTERVAL_RANDOMNESS_MS;

    const timeSinceLast = now - lastCoinSpawnTime;
    const delay = Math.max(MIN_COIN_INTERVAL_TIME_MS, baseInterval - timeSinceLast);

    coinTimeoutId = setTimeout(() => {
        _spawnAndReschedule(gameRunning);
    }, delay);
}

/** Cancela el timeout pendiente. */
export function clearCoinTimeout() {
    if (coinTimeoutId) {
        clearTimeout(coinTimeoutId);
        coinTimeoutId = null;
    }
}

/** Devuelve las monedas activas. */
export function getCoins() { // <<<--- ¡ASEGÚRATE QUE ESTA LÍNEA TIENE 'export' Y ESTÁ BIEN ESCRITA!
    return coins;
}

/** Elimina monedas del array interno. */
export function removeCoins(coinsToRemove) {
    if (!coinsToRemove || coinsToRemove.length === 0) return;
    const elementsToRemoveSet = new Set(coinsToRemove);
    coins = coins.filter(coin => !elementsToRemoveSet.has(coin.element));
}

// ===========================================================
//                    FUNCIONES PRIVADAS
// ===========================================================

/** Función interna llamada por setTimeout para generar y reprogramar. */
function _spawnAndReschedule(gameRunning) {
    if (!gameRunning) return;

    _spawnCoin();
    lastCoinSpawnTime = Date.now();

    scheduleNextCoin(gameRunning, state.getCombo());
}

/**
 * Determina qué tipo de moneda debe aparecer según la regla 'spawn'
 * del NIVEL ACTUAL, la crea y la añade al juego.
 * @private
 */
function _spawnCoin() {
    if (!container) return;

    const currentLevel = state.getCurrentLevel();
    const rule = LEVEL_RULES.find(r => r.level === currentLevel);

    let typeToSpawn = null;
    let bonus = 0;

    if (rule && rule.spawn) {
        typeToSpawn = rule.spawn; // Obtiene COIN_TYPES.* de config
        bonus = COIN_BONUSES[typeToSpawn] ?? 0; // Busca bonus en config
    } else {
        console.log(`CoinManager: No se generará moneda específica para Nivel ${currentLevel}.`);
        return;
    }

    if (typeToSpawn && COIN_BONUSES.hasOwnProperty(typeToSpawn)) {
        console.log(`CoinManager: Generando moneda tipo '${typeToSpawn}' (bonus ${bonus}s) para Nivel ${currentLevel}.`);
        const coinData = _createCoinElement(typeToSpawn, bonus);
        if (coinData) {
            coins.push(coinData);
            container.appendChild(coinData.element);
        }
    } else {
        console.warn(`CoinManager: Tipo de moneda a generar inválido o sin bonus definido en config.js. Tipo: ${typeToSpawn}`);
    }
}

/**
 * Crea el elemento DOM para una moneda.
 * @param {COIN_TYPES} type - El tipo de moneda (valor del Enum).
 * @param {number} bonus - El bonus de tiempo asociado.
 * @returns {object | null} Objeto con { element, type, bonus, width, height } o null si falla.
 * @private
 */
function _createCoinElement(type, bonus) {
    if (!container) return null;
    const element = document.createElement('div');
    element.className = `coin ${type}`; // CSS usa el valor string ('green', etc.)
    // element.textContent = `+${bonus}`; // Opcional

    const containerWidth = container.offsetWidth;
    element.style.left = `${containerWidth + Math.random() * 150}px`;

    const containerHeight = container.offsetHeight;
    const safeBottomMin = 50;
    const safeBottomMax = Math.min(containerHeight * 0.7, containerHeight - 80);
    const randomBottom = safeBottomMin + Math.random() * (safeBottomMax - safeBottomMin);
    element.style.bottom = `${randomBottom}px`;

    // Guardamos el tipo Enum por consistencia interna
    return { element, type: type, bonus, width: 0, height: 0 };
}