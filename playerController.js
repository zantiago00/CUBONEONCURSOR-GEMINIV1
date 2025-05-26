// Módulo: playerController.js
// Descripción: Gestiona estado, física y acciones del jugador.
//              (Versión con Doble Salto limitado a uno por aire)

// Importar referencias DOM
import { player } from './domRefs.js';
// Importar constantes
import {
    GRAVITY_ACCEL, INITIAL_JUMP_VELOCITY, JUMP_COMBO_MULTIPLIER,
    DOUBLE_JUMP_VELOCITY_MULTIPLIER, GROUND_Y, JUMP_EFFECT_DURATION_MS,
    COLLECT_EFFECT_DURATION_MS
} from './config.js';
// Importar el módulo de estado completo
import * as state from './state.js';

// --- Constantes Internas ---
// Multiplicadores de la altura del salto base por nivel (índice = nivel)
// EJEMPLO: Nivel 0,1=Normal(1.0); Nivel 2,3,4=Más Alto(1.2) -> ¡AJUSTAR SEGÚN DISEÑO FINAL!
const LEVEL_JUMP_MULTIPLIERS = [ 1.0, 1.0, 1.2, 1.2, 1.2 ];

// --- Estado Interno del Módulo ---
let playerY = 0;        // Posición vertical actual (px desde abajo)
let velocityY = 0;      // Velocidad vertical actual (px por segundo)
let playerIsAirborne = false; // Flag para saber si está en medio de un salto
let doubleJumpAvailable = true; // <<<--- NUEVA VARIABLE: ¿Puede hacer doble salto AHORA?

/** Inicializa o resetea el estado del jugador para una nueva partida. */
export function initPlayerState() {
    playerY = GROUND_Y; // Poner al jugador en el suelo
    velocityY = 0;      // Sin velocidad vertical inicial
    playerIsAirborne = false; // No está en el aire al inicio
    doubleJumpAvailable = true; // <<<--- RESETEAR al iniciar partida
    if (player) {
        player.style.bottom = `${playerY}px`; // Aplicar posición inicial al DOM
        // Limpiar clases de estado visuales
        player.classList.remove('powered', 'jumping', 'collected');
    }
    // console.log("PlayerController: Estado del jugador inicializado."); // Log opcional
}

/**
 * Actualiza la posición y velocidad vertical del jugador basado en la gravedad.
 * Se llama en cada frame del gameLoop.
 * Resetea la disponibilidad del doble salto al aterrizar.
 * @param {number} deltaTime - Tiempo transcurrido desde el último frame (en segundos).
 */
export function updatePlayerPhysics(deltaTime) {
    if (!player) return; // Salir si el elemento del jugador no existe

    // Aplicar gravedad a la velocidad vertical
    velocityY -= GRAVITY_ACCEL * deltaTime;
    // Actualizar posición basada en la velocidad vertical
    playerY += velocityY * deltaTime;

    // Comprobar si ha tocado o atravesado el suelo
    if (playerY <= GROUND_Y) {
        playerY = GROUND_Y; // Asegurar que no atraviese el suelo
        velocityY = 0;      // Detener velocidad vertical al tocar suelo
        // Si estaba en el aire, marcar que ya no lo está y resetear doble salto
        if (playerIsAirborne) {
             playerIsAirborne = false;
             doubleJumpAvailable = true; // <<<--- RESETEAR al aterrizar
             // console.log("PlayerController: Aterrizó. Doble salto disponible."); // Log opcional
        }
    }
    // Aplicar la nueva posición vertical al elemento del DOM
    player.style.bottom = `${playerY}px`;
}

/**
 * Inicia un salto normal si está en el suelo, o un (único) doble salto si está
 * en el aire, ha alcanzado el nivel requerido (Nivel 3+) y aún no ha usado
 * el doble salto en este periodo aéreo.
 * @param {number} currentCombo - El combo actual del jugador (puede afectar altura).
 * @param {boolean} isGameRunning - Si el juego está activo (para evitar saltos en menús).
 */
export function jump(currentCombo, isGameRunning) {
    const currentLevel = state.getCurrentLevel(); // Lee nivel actual desde state.js
    const onGround = playerY <= GROUND_Y + 1;   // Calcula si está en el suelo

    // --- LOGS DE DEPURACIÓN ---
    console.log(`--- Intentando saltar ---`);
    console.log(`Nivel Actual (state): ${currentLevel}`);
    console.log(`¿Está en el aire? (playerIsAirborne): ${playerIsAirborne}`);
    console.log(`¿Calculado en suelo? (onGround): ${onGround}`);
    // <<<--- Log añadido para ver estado de doble salto ---
    console.log(`¿Doble Salto Disponible?: ${doubleJumpAvailable}`);
    // --- FIN LOGS ---


    if (!isGameRunning || !player) {
        console.log(">>> Salto cancelado (juego no corre o player no existe)");
        return;
    }

    // Calcular la velocidad base del salto para este nivel
    const levelIndex = Math.min(currentLevel, LEVEL_JUMP_MULTIPLIERS.length - 1);
    const levelJumpMultiplier = LEVEL_JUMP_MULTIPLIERS[levelIndex] ?? 1.0;
    const baseJumpVelocity = INITIAL_JUMP_VELOCITY * levelJumpMultiplier;

    // Aplicar multiplicador por combo si aplica
    const comboJumpMultiplier = (currentCombo >= 3) ? JUMP_COMBO_MULTIPLIER : 1;
    const currentJumpVelocity = baseJumpVelocity * comboJumpMultiplier;

    // --- Lógica de Salto / Doble Salto CORREGIDA ---
    if (!playerIsAirborne && onGround) { // Salto Normal (desde el suelo)
        console.log(">>> Ejecutando Bloque: SALTO NORMAL");
        playerIsAirborne = true; // Marcar que ahora está en el aire
        // doubleJumpAvailable ya debería ser true por haber aterrizado antes
        velocityY = currentJumpVelocity; // Aplicar velocidad de salto inicial
        // Aplicar efecto visual de salto
        player.classList.add('jumping');
        setTimeout(() => { player?.classList.remove('jumping'); }, JUMP_EFFECT_DURATION_MS);
    }
    // --- CONDICIÓN MODIFICADA: Añadido '&& doubleJumpAvailable' ---
    else if (playerIsAirborne && currentLevel >= 3 && doubleJumpAvailable) { // Doble Salto
        console.log(">>> Ejecutando Bloque: DOBLE SALTO");
        velocityY = currentJumpVelocity * DOUBLE_JUMP_VELOCITY_MULTIPLIER; // Aplicar velocidad doble salto
        doubleJumpAvailable = false; // <<<--- CONSUMIR el doble salto para este periodo aéreo
        // Reaplicar efecto visual
        player.classList.add('jumping');
        setTimeout(() => { player?.classList.remove('jumping'); }, JUMP_EFFECT_DURATION_MS);
    } else {
        // No cumple condiciones ni para salto normal ni para doble salto (o ya se usó)
        console.log(">>> Ejecutando Bloque: NINGUNO (Condiciones no cumplidas)");
        // Log de diagnóstico más completo
        console.log(`    (playerIsAirborne=${playerIsAirborne}, onGround=${onGround}, currentLevel=${currentLevel}, doubleJumpAvailable=${doubleJumpAvailable})`);
    }
}

/** Devuelve la posición Y actual del jugador (px desde abajo). */
export function getPlayerY() {
    return playerY;
}

/** Activa el efecto visual temporal de recoger moneda. */
export function triggerCollectedEffect() {
    if(player) {
        player.classList.add('collected');
        // Quitar la clase después de un tiempo corto
        setTimeout(() => player?.classList.remove('collected'), COLLECT_EFFECT_DURATION_MS);
    }
}