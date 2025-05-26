/// -------------------------------------------------------------
// Módulo: state.js
// Descripción: Gestiona el estado centralizado de CUBONEON ARENA
// Versión: Power-Ups con Enum + Telemetría (Plan v4 - Paso A.2)
// -------------------------------------------------------------

/* ---------- Importaciones ---------- */
// Importamos los tipos de moneda definidos en la configuración
import { COIN_TYPES } from './config.js'; // Necesario para claves de objetos

/* ---------- Variables de estado internas ---------- */

// Estado del Juego
let gameRunning = false;
let gamePaused = false;

// Puntuación y Progreso
let score = 0;
let combo = 0;
let gameTime = 0;
let currentLevel = 0;
// Objeto para contar monedas recogidas por tipo (usando Enum como claves)
// La clave real será el valor del Enum (ej: 'green', 'blue')
let coinsCollected = {
  [COIN_TYPES.GREEN]: 0,
  [COIN_TYPES.BLUE]: 0,
  [COIN_TYPES.VIOLET]: 0,
  [COIN_TYPES.YELLOW]: 0,
  [COIN_TYPES.WHITE]: 0
};

// Información del Jugador
let playerName = "Anónimo";
let playerEmail = "";

// Estado del Boost de Velocidad Temporal (se mantiene por ahora)
let speedBoostActive = false;
let boostEndTime = 0;

//--------------------------------------------------
// NUEVO BLOQUE: Power-Ups de un solo uso activados por moneda
//--------------------------------------------------

/* Objeto para rastrear disponibilidad (0=no disponible, 1=disponible un uso).
   Usa COIN_TYPES como claves para consistencia. */
let powerUps = {
  [COIN_TYPES.VIOLET]: { count: 0 },   // Dash
  [COIN_TYPES.YELLOW]: { count: 0 },   // Double Jump
  [COIN_TYPES.WHITE]:  { count: 0 }    // Combo Aire
};

// Función interna para telemetría básica (lanza eventos personalizados)
function _dispatchAnalytics(eventName, detail) {
    try {
        window.dispatchEvent(new CustomEvent('analytics', {
             detail: {
                timestamp: Date.now(),
                event: eventName,
                ...detail
             }
        }));
    } catch (e) {
        // console.warn("Analytics event dispatch failed:", eventName, e);
    }
}

/* --- API pública para gestionar Power-Ups --- */

/** Marca un power-up como disponible (1 uso) */
export function grantPowerUp(type) {
  if (powerUps.hasOwnProperty(type)) {
    if (powerUps[type].count === 0) {
       powerUps[type].count = 1;
       console.log(`State: Power-Up '${type}' otorgado (1 uso).`);
       _dispatchAnalytics('grantPowerUp', { type });
    } // No hacer nada si ya tiene 1 uso (no acumulable)
  } else {
      console.warn(`State: Intento de otorgar power-up inválido: ${type}`);
  }
}

/** Marca un power-up como consumido (0 usos) */
export function consumePowerUp(type) {
  if (powerUps.hasOwnProperty(type) && powerUps[type].count > 0) {
    powerUps[type].count = 0;
    console.log(`State: Power-Up '${type}' consumido.`);
    _dispatchAnalytics('consumePowerUp', { type });
  }
}

/** Verifica si un power-up está actualmente disponible para usar */
export function hasPowerUp(type) {
  return Boolean(powerUps[type]?.count > 0);
}

/** Resetea todos los power-ups a no disponibles (0 usos) */
export function resetAllPowerUps() {
  let changed = false;
  Object.keys(powerUps).forEach(key => {
      if(powerUps[key].count > 0) changed = true;
      powerUps[key].count = 0
  });
  if (changed) {
      console.log("State: Todos los power-ups reseteados a 0 usos.");
      _dispatchAnalytics('resetPowerUps', {});
  }
}

/* Acceso de depuración opcional */
export function getPowerUpsState() {
  return { ...powerUps }; // Devuelve copia
}

// --- FIN BLOQUE POWER-UPS ---
//--------------------------------------------------


/* ---------- Getters Generales (Funciones Flecha para concisión) ---------- */
export const isGameRunning            = () => gameRunning && !gamePaused;
export const isGameEffectivelyRunning = () => gameRunning;
export const isPaused                 = () => gamePaused;
export const getScore                 = () => score;
export const getCombo                 = () => combo;
export const getGameTime              = () => gameTime;
export const getCurrentLevel          = () => currentLevel;
// Asegúrate de llamar a esta función con COIN_TYPES.TIPO
export const getCoinCount             = type => coinsCollected[type] ?? 0;
export const getPlayerName            = () => playerName;
export const getPlayerEmail           = () => playerEmail;
export const isBoostActive            = () => speedBoostActive;
export const getBoostEndTime          = () => boostEndTime;

/* ---------- Setters / Modificadores ---------- */

export function setGameRunning(isRunning) {
    if (gameRunning !== isRunning) {
        gameRunning = isRunning;
        if (!isRunning) gamePaused = false;
        console.log(`State: gameRunning = ${gameRunning}`);
    }
}

export function setGamePaused(isPaused) {
    if (!gameRunning) {
        if(gamePaused) gamePaused = false;
        return;
    };
    if (gamePaused !== isPaused) {
        gamePaused = isPaused;
        console.log(`State: gamePaused = ${gamePaused}`);
    }
}

export const setScore   = newScore => (score = Math.max(0, newScore));
export const setCombo   = newCombo => (combo = Math.max(0, newCombo));
export const setGameTime = time    => (gameTime = Math.max(0, time));

export function incrementScore(amount)   { score += amount; }
export function incrementCombo()         { combo++; console.log(`State: combo = ${combo}`); }
export function resetCombo()             { if (combo > 0) { console.log(`State: combo reset (${combo} → 0)`); combo = 0; } }

export function setLevel(level) {
  if (currentLevel !== level) {
    currentLevel = level;
    console.log(`State: currentLevel = ${currentLevel}`);
    _dispatchAnalytics('levelChange', { level: currentLevel });
  }
}

/** Añade una moneda al contador. Espera recibir un valor de COIN_TYPES */
export function addCoin(type) {
  // 'type' será el valor string ('green', 'blue', etc.) del Enum
  if (coinsCollected.hasOwnProperty(type)) {
    coinsCollected[type]++;
    console.log(`State: coin ${type} = ${coinsCollected[type]}`);
  } else {
    console.warn(`State: Intento de añadir moneda de tipo inválido: ${type}`);
  }
}

/** Resetea contadores. Espera recibir un valor de COIN_TYPES o null */
export function resetCoinCount(type = null) {
  if (type === null) {
    let changed = false;
    // Object.keys(coinsCollected) iterará sobre 'green', 'blue', etc.
    Object.keys(coinsCollected).forEach(key => {
        if(coinsCollected[key] > 0) changed = true;
        coinsCollected[key] = 0
    });
    if (changed) console.log('State: Todos los contadores de monedas reseteados.');
  } else if (coinsCollected.hasOwnProperty(type)) { // 'type' será 'green', 'blue', etc.
    if (coinsCollected[type] > 0) {
        console.log(`State: Contador de ${type} reseteado (${coinsCollected[type]} → 0).`);
        coinsCollected[type] = 0;
    }
  } else {
      console.warn(`State: Intento de resetear contador de tipo inválido: ${type}`);
  }
}

export function setPlayerInfo(name, email) {
  playerName  = name  || 'Anónimo';
  playerEmail = email || '';
  console.log(`State: Player = ${playerName}`);
}

/* ---------- Boost temporal (Lógica sin cambios por ahora) ---------- */
export function setBoostActive(isActive, endTime = 0) {
  const now = Date.now();
  if (isActive && endTime > now) {
      if (!speedBoostActive) {
         console.log(`State: boost ON hasta ${new Date(endTime).toLocaleTimeString()}`);
         _dispatchAnalytics('boostStart', { duration: endTime - now });
      }
      speedBoostActive = true;
      boostEndTime     = endTime;
  } else if (!isActive && speedBoostActive) {
    speedBoostActive = false;
    boostEndTime     = 0;
    console.log('State: boost OFF');
    _dispatchAnalytics('boostEnd', {});
  }
}

/* ---------- Inicialización Completa del Estado ---------- */
export function initializeState(initialTime) {
  setGameRunning(false);
  setScore(0);
  setCombo(0);
  setGameTime(initialTime);
  setLevel(0);
  resetCoinCount();      // Resetea contadores de moneda
  resetAllPowerUps();    // <<<--- Resetear nuevos power-ups
  setBoostActive(false); // Resetear boost temporal
  console.log('State: Estado inicializado para nueva partida.');
}