// Módulo: collisionManager.js
// Descripción: Detecta colisiones y retorna un objeto 'changes' con sus efectos.
//              (v3 - Importaciones corregidas, Usa COIN_TYPES, lógica obsoleta eliminada)

// --- Importaciones ---
import { player, container } from './domRefs.js';
import { getObstacles, removeObstacles } from './obstacleManager.js';
import { getCoins, removeCoins } from './coinManager.js'; // Funciones específicas de coinManager
import { triggerCollectedEffect } from './playerController.js'; // Función específica de playerController
import { showFloatingText } from './uiManager.js'; // Función específica de uiManager
import {
  // Constantes necesarias de config.js
  OBSTACLE_HIT_PENALTY_S,
  COIN_SCORE_MULTIPLIER,
  HIT_EFFECT_DURATION_MS,
  COIN_TYPES // Enum para tipos de moneda
} from './config.js';

// --- Funciones Internas Auxiliares ---

/** Chequeo de colisión AABB con margen opcional */
function _checkCollision(r1, r2, margin = 0) {
  if (!r1 || !r2) return false;
  return (
    r1.left < r2.right + margin &&
    r1.right > r2.left - margin &&
    r1.top < r2.bottom + margin &&
    r1.bottom > r2.top - margin
  );
}

/** Aplica solo los efectos VISUALES de chocar con obstáculo */
function _handleObstacleHitVisuals(obstacleElement) {
    console.log("Colisión con obstáculo detectada!");
    container?.classList.add('hit', 'shake');
    setTimeout(() => { container?.classList.remove('hit', 'shake'); }, HIT_EFFECT_DURATION_MS);
    try {
        const rect = obstacleElement.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect();
        if (containerRect) {
            // Llama a la función importada directamente
            showFloatingText(
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top - 10,
                `-${OBSTACLE_HIT_PENALTY_S}s`,
                false // isPositive = false
            );
        }
    } catch (e) { console.error("Error mostrando texto flotante (hit):", e); }
}

/** Aplica solo los efectos VISUALES de recoger una moneda */
function _handleCoinCollectVisuals(coinElement, coinData) {
     // coinData.type ya es COIN_TYPES.*
     console.log(`Moneda recogida: ${coinData.type}`);
    // Llama a la función importada directamente
    triggerCollectedEffect();
    try {
        const rect = coinElement.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect();
        if (containerRect) {
             // Llama a la función importada directamente
             showFloatingText(
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top - 10,
                `+${coinData.bonus}s`,
                true // isPositive = true
            );
        }
    } catch (e) { console.error("Error mostrando texto flotante (coin):", e); }
}

// --- Función Pública Principal ---

/**
 * Revisa colisiones jugador vs obstáculos y jugador vs monedas.
 * Retorna un objeto 'changes' con los efectos detectados para que gameLoop los aplique.
 * @param {number} currentCombo - Combo actual.
 * @returns {object} Objeto 'changes'.
 */
export function checkAllCollisions(currentCombo) {
  if (!player) return {};

  const playerRect = player.getBoundingClientRect();
  const obstacles = getObstacles();
  const coins = getCoins(); // coin.type vendrá como COIN_TYPES.*

  // Objeto de resultados limpio
  const changes = {
    scoreIncrements: [],
    timeDelta: 0,
    comboDelta: 0,
    boostActivate: false, // Mantenemos boost temporal
    coinsCollectedData: []
  };

  let resetCombo = false;
  const rmObs = [];
  const rmCoins = [];

  // 1. Colisiones con Obstáculos
  for (const obs of obstacles) {
    if (!obs.element?.isConnected) continue;
    if (_checkCollision(playerRect, obs.element.getBoundingClientRect(), -10)) {
      _handleObstacleHitVisuals(obs.element);
      changes.timeDelta -= OBSTACLE_HIT_PENALTY_S;
      resetCombo = true; // Marcar para resetear estado en gameLoop
      obs.element.remove();
      rmObs.push(obs.element);
    }
  }

  // 2. Colisiones con Monedas
  for (const coin of coins) {
    if (!coin.element?.isConnected) continue;
    if (!resetCombo && _checkCollision(playerRect, coin.element.getBoundingClientRect(), 5)) {
      _handleCoinCollectVisuals(coin.element, coin);
      changes.timeDelta += coin.bonus;
      changes.comboDelta += 1;
      changes.scoreIncrements.push({ multiplier: COIN_SCORE_MULTIPLIER });
      changes.coinsCollectedData.push({ type: coin.type, bonus: coin.bonus }); // Guarda COIN_TYPES.*

      // Lógica de Boost Temporal (Usa COIN_TYPES)
      if (coin.type === COIN_TYPES.BLUE || coin.type === COIN_TYPES.YELLOW) {
         changes.boostActivate = true;
      }

      coin.element.remove();
      rmCoins.push(coin.element);
    }
  }

  // 3. Limpieza de arrays
  if (rmObs.length > 0) removeObstacles(rmObs);
  if (rmCoins.length > 0) removeCoins(rmCoins);

  // 4. Marcar reseteo final
  if (resetCombo) {
      changes.comboDelta = 'reset';
  }

  // 5. Retornar cambios
  return changes;
}