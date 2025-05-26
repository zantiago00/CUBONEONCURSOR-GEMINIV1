// Módulo: config.js
// Descripción: Configuración centralizada del juego CUBONEON ARENA (v2 - Niveles/Powerups)
// ------------------------------------------------------------------------------------

/* ---------- ENUM / Tipos de moneda ---------- */
// Usamos Object.freeze para hacerlo inmutable (buena práctica)
export const COIN_TYPES = Object.freeze({
  GREEN:  'green',
  BLUE:   'blue',
  VIOLET: 'violeta', // Nuevo
  YELLOW: 'amarilla',
  WHITE:  'blanca'   // Nuevo
});

/* ---------- Física y movimiento ---------- */
export const GRAVITY_ACCEL                 = 1800; // Aceleración pixels/s^2
export const INITIAL_JUMP_VELOCITY         = 700;  // Velocidad vertical inicial salto (pixels/s)
export const JUMP_COMBO_MULTIPLIER         = 1.1;  // Multiplicador altura salto por combo >= 3
export const DOUBLE_JUMP_VELOCITY_MULTIPLIER = 1.1;  // Impulso extra para Doble Salto / parte del Combo Blanco

/* ---------- Posición Suelo ---------- */
export const GROUND_Y                      = 0;    // Posición Y del suelo (px desde abajo)

/* ---------- Velocidad base y multiplicadores ---------- */
export const BASE_SPEED            = 420; // Velocidad horizontal base (pixels/s)
export const SPEED_MULTIPLIER_COMBO3 = 1.2; // Multiplicador por combo >= 3
export const SPEED_MULTIPLIER_COMBO6 = 1.5; // Multiplicador por combo >= 6
/* --- Boost temporal por moneda Azul/Amarilla (se mantiene por ahora) --- */
export const SPEED_BOOST_MULTIPLIER = 1.5;  // Factor de multiplicación durante boost
export const SPEED_BOOST_DURATION_S = 5;    // Duración del boost en segundos

/* --- Multiplicadores PERMANENTES por Nivel (0 a 5) --- */
// Velocidad: Aumenta un 40% (ejemplo) al llegar a Nivel 1 y se mantiene
export const LEVEL_SPEED_MULTIPLIERS = [1.0, 1.4, 1.4, 1.4, 1.4, 1.4];
// Salto: Aumenta un 40% (ejemplo) al llegar a Nivel 2 y se mantiene
export const LEVEL_JUMP_MULTIPLIERS  = [1.0, 1.0, 1.4, 1.4, 1.4, 1.4];

/* ---------- Tiempo, puntuación, ranking ---------- */
export const INITIAL_TIME_S   = 120; // Tiempo inicial en segundos
export const MAX_TIME_CAP_S   = INITIAL_TIME_S + 30; // Límite máximo de tiempo acumulable
export const OBSTACLE_HIT_PENALTY_S = 1;  // Segundos penalización por golpe
export const COIN_SCORE_MULTIPLIER  = 5;  // Puntos base por moneda (multiplicado por combo actual)
export const POINTS_PER_OBSTACLE_DODGED = 1; // Puntos al esquivar (si checkOutOfBounds lo implementa)

export const RANKING_URL      = "https://script.google.com/macros/s/AKfycbzBUuj5qYyp9PnnP83ofKBGwStiqmk8ixX4CcQiPZWAevi1_vB6rqiXtYioXM4GcnHidw/exec"; // TU URL DE APPS SCRIPT
export const RANKING_MAX_NAME_LENGTH = 15; // Máximo caracteres nombre
export const RANKING_TOP_N          = 20; // Cuántos mostrar en el ranking

/* ---------- Generación obstáculos/monedas (Intervalos en ms) ---------- */
export const OBSTACLE_BASE_INTERVAL_MS   = 1800;
export const OBSTACLE_MIN_GAP_TIME_MS    = 600;
export const OBSTACLE_RATE_DECREASE_FACTOR = 0.97; // Factor reducción intervalo por combo
export const MAX_CONSECUTIVE_OBSTACLES = 3;    // Máximo seguidos antes de pausa
export const CONSECUTIVE_OBSTACLE_BREAK_MULTIPLIER = 1.5; // Multiplicador pausa
export const COIN_BASE_INTERVAL_MS       = 2500;
export const MIN_COIN_INTERVAL_TIME_MS   = 1800;
export const COIN_INTERVAL_RANDOMNESS_MS = 1000;
export const COIN_INTERVAL_COMBO6_MULTIPLIER = 0.75; // Factor reducción intervalo por combo 6+
export const MIN_OBSTACLE_VISUAL_GAP_PX  = 100;  // Gap mínimo entre obstáculos dobles
export const OBSTACLE_LARGE_CHANCE = 0.3; // Probabilidad Obst. Grande (Nivel 3+)
export const OBSTACLE_DOUBLE_CHANCE = 0.4;// Probabilidad Obst. Doble (Combo 3+)

/* ---------- Dash (Valores iniciales, ajustar después) ---------- */
export const DASH_VELOCITY  = 1200; // ¿Velocidad horizontal extra? ¿O distancia fija?
export const DASH_DURATION  = 0.15; // ¿Cuánto dura el efecto/movimiento? (si no es instantáneo)

/* ---------- Reglas de Nivel y Monedas ---------- */
// Define qué se necesita para pasar AL SIGUIENTE nivel desde el nivel actual
// y qué moneda aparece MIENTRAS estás en el nivel actual.
export const LEVEL_RULES = [
  // Nivel 0 (Cian): Necesitas 3 Verdes para pasar a Lvl 1. Aparecen Verdes.
  { level: 0, spawn: COIN_TYPES.GREEN,  coinsToAdvance: 3, advanceCoin: COIN_TYPES.GREEN },
  // Nivel 1 (Verde): Necesitas 3 Azules para pasar a Lvl 2. Aparecen Azules. (+Velocidad)
  { level: 1, spawn: COIN_TYPES.BLUE,   coinsToAdvance: 3, advanceCoin: COIN_TYPES.BLUE  },
  // Nivel 2 (Azul): Necesitas 3 Violetas para Lvl 3. Aparecen Violetas. (+Altura Salto)
  { level: 2, spawn: COIN_TYPES.VIOLET, coinsToAdvance: 3, advanceCoin: COIN_TYPES.VIOLET },
  // Nivel 3 (Violeta): Necesitas 3 Amarillas para Lvl 4. Aparecen Amarillas. (Activa PowerUp Dash con moneda VIOLETA)
  { level: 3, spawn: COIN_TYPES.YELLOW, coinsToAdvance: 3, advanceCoin: COIN_TYPES.YELLOW },
  // Nivel 4 (Amarillo): Necesitas 3 Blancas para Lvl 5. Aparecen Blancas. (Activa PowerUp Doble Salto con moneda AMARILLA)
  { level: 4, spawn: COIN_TYPES.WHITE,  coinsToAdvance: 3, advanceCoin: COIN_TYPES.WHITE  },
  // Nivel 5 (Blanco): Nivel final. Siempre aparecen Blancas. (Activa PowerUp Combo Aire con moneda BLANCA)
  { level: 5, spawn: COIN_TYPES.WHITE,  coinsToAdvance: Infinity } // No se avanza más
];

/* ---------- Bonus de tiempo por tipo de moneda ---------- */
// ¡Asegúrate que estos valores son los deseados! (En segundos)
export const COIN_BONUSES = {
  [COIN_TYPES.GREEN]:  1,
  [COIN_TYPES.BLUE]:   2,
  [COIN_TYPES.VIOLET]: 3, // Valor ejemplo
  [COIN_TYPES.YELLOW]: 5,
  [COIN_TYPES.WHITE]:  7  // Valor ejemplo
};

/* ---------- Animaciones y UI ---------- */
export const FLOATING_TEXT_DURATION_MS     = 1200; // Duración texto flotante (+1s, etc.)
export const WELCOME_TRANSITION_DURATION_MS = 500;  // Duración fade out pantalla bienvenida
export const HIT_EFFECT_DURATION_MS        = 300;  // Duración efecto shake/hit en contenedor
export const JUMP_EFFECT_DURATION_MS       = 200;  // Duración clase .jumping en player
export const COLLECT_EFFECT_DURATION_MS    = 200;  // Duración clase .collected en player