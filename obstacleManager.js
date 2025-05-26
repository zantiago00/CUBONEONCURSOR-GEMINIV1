// Módulo: obstacleManager.js
// Descripción: Gestiona programación, creación y estado de obstáculos
//              ahora con formas y colores tipo Tetris dependientes del nivel.

import { container } from './domRefs.js';
import {
  OBSTACLE_BASE_INTERVAL_MS, OBSTACLE_MIN_GAP_TIME_MS, OBSTACLE_RATE_DECREASE_FACTOR,
  MAX_CONSECUTIVE_OBSTACLES, CONSECUTIVE_OBSTACLE_BREAK_MULTIPLIER,
  MIN_OBSTACLE_VISUAL_GAP_PX, OBSTACLE_LARGE_CHANCE, OBSTACLE_DOUBLE_CHANCE,
  GROUND_Y
} from './config.js';

import * as state from './state.js';   // <- para leer nivel actual

/* ---------- Formas disponibles por nivel ---------- */
const SHAPES_BY_LEVEL = [
  ['square'],                                      // Nivel 0
  ['square', 'triangle'],                          // Nivel 1
  ['square', 'triangle', 'line', 'cube'],          // Nivel 2
  ['square', 'triangle', 'line', 'cube', 'zeta'],  // Nivel 3
  ['square', 'triangle', 'line', 'cube', 'zeta', 'lshape'] // Nivel 4
];

/* ---------- ESTADO INTERNO ---------- */
let obstacles = [];
let obstacleTimeoutId = null;
let lastObstacleSpawnTime = 0;
let consecutiveObstacles = 0;

/* ===========================================================
                       API PÚBLICA
   =========================================================== */
export function initObstacleManager() {
  obstacles = [];
  consecutiveObstacles = 0;
  lastObstacleSpawnTime = 0;
  clearObstacleTimeout();
  console.log('Gestor de obstáculos inicializado.');
}

export function scheduleNextObstacle(gameRunning, currentSpeed, currentCombo) {
  if (!gameRunning) {
    clearObstacleTimeout();
    return;
  }

  clearObstacleTimeout();

  const now = Date.now();
  let baseInterval = OBSTACLE_BASE_INTERVAL_MS;

  if (currentCombo >= 3) {
    baseInterval *= Math.pow(OBSTACLE_RATE_DECREASE_FACTOR,
      Math.min(10, currentCombo - 2));
  }

  if (consecutiveObstacles >= MAX_CONSECUTIVE_OBSTACLES) {
    baseInterval *= CONSECUTIVE_OBSTACLE_BREAK_MULTIPLIER;
  }

  const containerWidth = container?.offsetWidth ?? 800;
  const timeSinceLast = now - lastObstacleSpawnTime;
  const minGap = (containerWidth / currentSpeed) * 1000 * 0.2 +
                 OBSTACLE_MIN_GAP_TIME_MS;

  const delay = Math.max(minGap, baseInterval - timeSinceLast);

  obstacleTimeoutId = setTimeout(() => {
    _spawnAndReschedule(gameRunning, currentSpeed, currentCombo);
  }, delay);
}

export function clearObstacleTimeout() {
  if (obstacleTimeoutId) {
    clearTimeout(obstacleTimeoutId);
    obstacleTimeoutId = null;
  }
}

export function getObstacles() { return obstacles; }

export function removeObstacles(toRemove) {
  const set = new Set(toRemove);
  obstacles = obstacles.filter(obs => !set.has(obs.element));
}

/* ===========================================================
                       FUNCIONES PRIVADAS
   =========================================================== */
function _spawnAndReschedule(gameRunning, currentSpeed, currentCombo) {
  if (!gameRunning) return;

  if (consecutiveObstacles >= MAX_CONSECUTIVE_OBSTACLES) {
    consecutiveObstacles = 0;
  }

  _spawnObstacle();
  lastObstacleSpawnTime = Date.now();

  scheduleNextObstacle(gameRunning, currentSpeed, currentCombo);
}

function _spawnObstacle() {
  if (!container) return;

  const obsData = _createObstacleElement();
  if (!obsData) return;

  obstacles.push(obsData);
  container.appendChild(obsData.element);
  consecutiveObstacles++;

  /* ----- posibilidad de obstáculo doble ----- */
  if (state.getCombo() >= 3 &&
      Math.random() < OBSTACLE_DOUBLE_CHANCE &&
      consecutiveObstacles < MAX_CONSECUTIVE_OBSTACLES) {

    const w = obsData.element.offsetWidth;
    if (w > 0) {
      const second = _createObstacleElement(w);
      if (second) {
        obstacles.push(second);
        container.appendChild(second.element);
        consecutiveObstacles++;
        console.log('Obstáculo doble generado.');
      }
    }
  }
}

function _createObstacleElement(prevWidth = 0) {
  if (!container) return null;

  const level = state.getCurrentLevel();
  const shapePool = SHAPES_BY_LEVEL[Math.min(level, SHAPES_BY_LEVEL.length - 1)];
  const shape = shapePool[Math.floor(Math.random() * shapePool.length)];

  const el = document.createElement('div');
  el.className = 'obstacle';
  el.classList.add(shape);          // <-- clase de forma/​color

  /* tamaño “large” sólo a cuadrado/​cube/​line para no deformar triángulos */
  const largeOk = ['square', 'cube', 'line'].includes(shape);
  if (largeOk && level >= 3 && Math.random() < OBSTACLE_LARGE_CHANCE) {
    el.classList.add('large');
  }

  /* Posición X inicial fuera de pantalla */
  const containerWidth = container.offsetWidth;
  let left = containerWidth;
  if (prevWidth > 0) {
    const gap = MIN_OBSTACLE_VISUAL_GAP_PX + Math.random() * 50;
    left += prevWidth + gap;
  }
  el.style.left = `${left}px`;
  el.style.bottom = `${GROUND_Y}px`;

  return { element: el, width: 0, height: 0 };
}
