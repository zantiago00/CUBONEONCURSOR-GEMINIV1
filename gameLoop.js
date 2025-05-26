// Módulo: gameLoop.js
// Descripción: Orquesta el bucle principal del juego
//              (v3 - Usa COIN_TYPES, Otorga PowerUps, Reseteo Completo)

/* ---------- IMPORTACIONES ---------- */
import {
  // Configuración del juego
  INITIAL_TIME_S, BASE_SPEED, MAX_TIME_CAP_S, POINTS_PER_OBSTACLE_DODGED,
  // Reglas y Constantes de Nivel/Moneda
  LEVEL_RULES, COIN_TYPES, COIN_BONUSES, // <-- Necesitamos COIN_TYPES y COIN_BONUSES aquí también
  // Multiplicadores (¡Importados!)
  LEVEL_SPEED_MULTIPLIERS, LEVEL_JUMP_MULTIPLIERS, // <-- Importados
  SPEED_MULTIPLIER_COMBO3, SPEED_MULTIPLIER_COMBO6,
  // Boost Temporal (se mantiene)
  SPEED_BOOST_MULTIPLIER, SPEED_BOOST_DURATION_S,
  // Puntuación
  COIN_SCORE_MULTIPLIER
} from './config.js';

// Referencias y Módulos
import { container } from './domRefs.js';
import * as state from './state.js';
import * as uiManager from './uiManager.js';
import * as playerController from './playerController.js'; // Necesita importar multiplicadores de config ahora
import * as obstacleManager from './obstacleManager.js';
import * as coinManager from './coinManager.js';
import * as collisionManager from './collisionManager.js';
import { submitScoreAndDisplayRanking } from './apiHandler.js';

/* ---------- ESTADO INTERNO DEL MÓDULO ---------- */
// Ya no definimos multiplicadores aquí, se importan de config.js
let currentSpeed = BASE_SPEED;
let lastTimestamp = 0;
let gameLoopId = null;

/* ===========================================================
   ==============   FUNCIONES EXPORTADAS   ====================
   =========================================================== */

export function startGame() {
  if (state.isGameEffectivelyRunning()) return;
  console.log("GameLoop: Iniciando juego...");
  state.initializeState(INITIAL_TIME_S);
  state.setGameRunning(true);
  lastTimestamp = 0;
  currentSpeed = BASE_SPEED; // Resetear velocidad base inicial
  playerController.initPlayerState();
  obstacleManager.initObstacleManager();
  coinManager.initCoinManager();
  container?.querySelectorAll('.obstacle, .coin, .floating-text').forEach(el => el.remove());
  container?.classList.remove('hit', 'shake');
  _updateLevelStyle(state.getCurrentLevel()); // Estilo inicial Nivel 0
  uiManager.updateUI(state.getScore(), state.getGameTime(), state.getCombo());
  _updateSpeed(Date.now()); // Calcular velocidad inicial basada en Nivel 0
  obstacleManager.scheduleNextObstacle(state.isGameRunning(), currentSpeed, state.getCombo());
  coinManager.scheduleNextCoin(state.isGameRunning(), state.getCombo()); // Iniciar spawn de monedas
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(_gameLoop);
  uiManager.showScreen(null);
}

export function pauseGame() {
  if (!state.isGameEffectivelyRunning() || state.isPaused()) return;
  state.setGamePaused(true);
  obstacleManager.clearObstacleTimeout();
  coinManager.clearCoinTimeout();
  console.log("GameLoop: Juego pausado.");
}

export function resumeGame() {
  if (!state.isGameEffectivelyRunning() || !state.isPaused()) return;
  state.setGamePaused(false);
  lastTimestamp = 0; // Evitar saltos de tiempo
  _updateSpeed(Date.now()); // Recalcular velocidad por si cambió estado mientras pausado
  // Reprogramar spawns (usando estado actual)
  obstacleManager.scheduleNextObstacle(state.isGameRunning(), currentSpeed, state.getCombo());
  coinManager.scheduleNextCoin(state.isGameRunning(), state.getCombo());
  if (!gameLoopId) { // Seguridad por si se canceló
      gameLoopId = requestAnimationFrame(_gameLoop);
  }
  console.log("GameLoop: Juego reanudado.");
}

/* ===========================================================
   ===============   FUNCIONES INTERNAS   =====================
   =========================================================== */

/** Bucle principal del juego */
function _gameLoop(timestamp) {
  if (!state.isGameEffectivelyRunning()) {
      gameLoopId = null; return;
  }
  if (lastTimestamp === 0) {
    lastTimestamp = timestamp; gameLoopId = requestAnimationFrame(_gameLoop); return;
  }
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (state.isPaused()) {
    gameLoopId = requestAnimationFrame(_gameLoop); return;
  }

  // Actualizaciones
  state.setGameTime(state.getGameTime() - deltaTime);
  _updateSpeed(timestamp); // Actualiza currentSpeed basado en nivel, combo, boost
  playerController.updatePlayerPhysics(deltaTime); // Mueve jugador con gravedad
  _moveElements(obstacleManager.getObstacles(), deltaTime); // Mueve obstáculos
  _moveElements(coinManager.getCoins(), deltaTime);     // Mueve monedas
  _checkOutOfBounds();                                 // Limpia elementos fuera

  // Colisiones y sus efectos
  const collisionResults = collisionManager.checkAllCollisions(state.getCombo());
  _applyCollisionResults(collisionResults); // Aplica TODO: tiempo, score, combo, nivel, powerups...

  // UI y Fin de Juego
  uiManager.updateUI(state.getScore(), state.getGameTime(), state.getCombo());
  // ¡¡FALTA LLAMAR A uiManager.updatePowerUpHUD() aquí cuando exista!! (Paso D)

  if (state.getGameTime() <= 0) {
    _gameOver(); return;
  }
  gameLoopId = requestAnimationFrame(_gameLoop);
}

/** Verifica y procesa la subida de nivel */
function _checkAndAdvanceLevel() {
    const currentLevel = state.getCurrentLevel();
    // Usa la regla del NIVEL ACTUAL para saber qué se necesita para avanzar
    const currentRule = LEVEL_RULES.find(r => r.level === currentLevel);

    // Si no hay regla para nivel actual, o ya es nivel máximo (coinsToAdvance=Infinity)
    if (!currentRule || !currentRule.advanceCoin || currentRule.coinsToAdvance === Infinity) {
        return;
    }

    // --- Lógica Corregida para usar advanceCoin y coinsToAdvance ---
    const requiredType = currentRule.advanceCoin;   // Qué tipo de moneda se necesita (COIN_TYPES.*)
    const requiredAmount = currentRule.coinsToAdvance; // Cuántas se necesitan

    // Verificar si se ha alcanzado la cantidad necesaria
    if (state.getCoinCount(requiredType) >= requiredAmount) {
        const newLevel = currentLevel + 1;
        console.log(`>>> ¡Nivel Subido! Requisitos cumplidos para Nivel ${newLevel}. Monedas ${requiredType}: ${state.getCoinCount(requiredType)}/${requiredAmount}`);
        state.setLevel(newLevel);           // Actualizar nivel en state
        state.resetCoinCount(requiredType); // Resetear contador de esa moneda
        _updateLevelStyle(newLevel);      // Actualizar estilo visual
        // La velocidad y salto se actualizarán en el siguiente frame vía _updateSpeed / jump
    }
}

/** Aplica los resultados de las colisiones al estado del juego */
function _applyCollisionResults(r) {
    if (!r) return;

    // 1. Aplicar cambios de Tiempo y Puntuación (siempre se aplican)
    if (r.timeDelta) {
      const newTime = Math.min(MAX_TIME_CAP_S, Math.max(0, state.getGameTime() + r.timeDelta));
      state.setGameTime(newTime);
    }
    if (Array.isArray(r.scoreIncrements)) {
      r.scoreIncrements.forEach(s => state.incrementScore(s.multiplier * (state.getCombo() || 1)));
    }

    // 2. Procesar Monedas Recogidas (si las hay)
    if (r.coinsCollectedData && r.coinsCollectedData.length > 0) {
        r.coinsCollectedData.forEach(coin => {
            // a. Añadir al contador para posible subida de nivel
            state.addCoin(coin.type); // coin.type ya es COIN_TYPES.*

            // b. Otorgar Power-Up si corresponde al tipo de moneda
            //    (Usa COIN_TYPES para la comparación)
            if (coin.type === COIN_TYPES.VIOLET) {
                state.grantPowerUp(COIN_TYPES.VIOLET); // Otorga Dash (1 uso)
            } else if (coin.type === COIN_TYPES.YELLOW) {
                state.grantPowerUp(COIN_TYPES.YELLOW); // Otorga Doble Salto (1 uso)
            } else if (coin.type === COIN_TYPES.WHITE) {
                state.grantPowerUp(COIN_TYPES.WHITE); // Otorga Combo Aire (1 uso)
            }
        });
        // c. Verificar si se sube de nivel DESPUÉS de contar todas las monedas del frame
        _checkAndAdvanceLevel();
    }

    // 3. Aplicar Cambios de Combo / RESETEO POR GOLPE
    if (r.comboDelta === 'reset') {
      console.log(">>> Obstacle Hit! Resetting State.");
      state.resetCombo();          // Resetea combo
      state.setBoostActive(false); // Desactiva boost temporal
      state.setLevel(0);           // Vuelve a Nivel 0 !!
      state.resetAllPowerUps();    // Resetea TODOS los power-ups !!
      _updateLevelStyle(0);        // Aplica estilo Nivel 0
    } else if (typeof r.comboDelta === 'number' && r.comboDelta > 0) {
      // Incrementar combo si se recogieron monedas
      for (let i = 0; i < r.comboDelta; i++) state.incrementCombo();
    }

    // 4. Activar Boost Temporal (si collisionManager lo indicó)
    if (r.boostActivate) {
      const end = Date.now() + SPEED_BOOST_DURATION_S * 1000;
      state.setBoostActive(true, end); // Llama a la función de state.js
    }
}

/** Calcula y actualiza la velocidad actual del juego */
function _updateSpeed(now) {
  const endTime = state.getBoostEndTime();
  if (state.isBoostActive() && now >= endTime) {
      state.setBoostActive(false);
  }

  // Usa multiplicadores importados de config.js
  const levelIndex = Math.min(state.getCurrentLevel(), LEVEL_SPEED_MULTIPLIERS.length - 1);
  const levelMul = LEVEL_SPEED_MULTIPLIERS[levelIndex] ?? 1;
  const comboMul = state.getCombo() >= 6 ? SPEED_MULTIPLIER_COMBO6
                   : state.getCombo() >= 3 ? SPEED_MULTIPLIER_COMBO3 : 1;
  const boostMul = state.isBoostActive() ? SPEED_BOOST_MULTIPLIER : 1;

  currentSpeed = BASE_SPEED * levelMul * comboMul * boostMul;
}

/** Mueve elementos (obstáculos o monedas) */
function _moveElements(elements, dt) {
  if (!elements || elements.length === 0) return;
  const dx = currentSpeed * dt;
  elements.forEach(item => {
    if (item.element?.isConnected) {
        const currentLeft = parseFloat(item.element.style.left || '0');
        item.element.style.left = `${currentLeft - dx}px`;
    }
  });
}

/** Comprueba y elimina elementos fuera de pantalla */
function _checkOutOfBounds() {
  // (Sin cambios lógicos necesarios aquí respecto a la versión anterior)
  // Obstáculos
  const obstaclesToRemove = obstacleManager.getObstacles().filter(obs => {
      if (!obs.element?.isConnected) return true;
      const rect = obs.element.getBoundingClientRect();
      if (rect.right < 0) { obs.element.remove(); return true; }
      return false;
  }).map(obs => obs.element);
  if (obstaclesToRemove.length > 0) obstacleManager.removeObstacles(obstaclesToRemove);

  // Monedas
  const coinsToRemove = coinManager.getCoins().filter(coin => {
      if (!coin.element?.isConnected) return true;
      const rect = coin.element.getBoundingClientRect();
      if (rect.right < 0) { coin.element.remove(); return true; }
      return false;
  }).map(coin => coin.element);
  if (coinsToRemove.length > 0) coinManager.removeCoins(coinsToRemove);
}

/** Aplica la clase CSS de nivel al contenedor principal */
function _updateLevelStyle(level) {
  if (!container) return;
  // Limpiar clases anteriores (del 0 hasta máx nivel definido + 1)
  for (let i = 0; i <= LEVEL_RULES.length; i++) { // LEVEL_RULES.length es el nivel MÁXIMO (5), así que vamos hasta 5
      container.classList.remove(`level-${i}`);
  }
  container.classList.add(`level-${level}`);
  console.log(`GameLoop: Estilo visual actualizado a level-${level}`);
}

/** Finaliza el juego */
function _gameOver() {
  if (!state.isGameEffectivelyRunning()) return;
  console.log("GameLoop: ¡Juego Terminado! Puntuación final:", state.getScore());
  state.setGameRunning(false);
  obstacleManager.clearObstacleTimeout();
  coinManager.clearCoinTimeout();
  if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
  submitScoreAndDisplayRanking(state.getPlayerName(), state.getPlayerEmail(), state.getScore());
}