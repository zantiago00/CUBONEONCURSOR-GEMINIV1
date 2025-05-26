// Módulo: inputManager.js
// Descripción: Configura y maneja los event listeners. (Versión con Logs de Salto)

// Importar referencias DOM
import * as dom from './domRefs.js';
// Importar funciones/estado de otros módulos
import * as playerController from './playerController.js';
import * as gameLoop from './gameLoop.js';
import * as uiManager from './uiManager.js';
import * as state from './state.js'; // <<<--- IMPORTAR STATE para getCombo/isRunning
// Importar utilidades
import { isMobileDevice } from './utils.js';

// Variable interna para rastrear si la pausa fue por cambio de foco/visibilidad
let gamePausedByBlur = false;

/**
 * Configura todos los event listeners necesarios para el juego.
 */
export function initInputListeners() {
    console.log("InputManager: Configurando listeners...");

    // --- Listeners de Teclado ---
    document.addEventListener('keydown', (e) => {
        const isRunning = state.isGameRunning(); // Leer estado desde state.js

        // Saltar con Espacio durante el juego
        if (isRunning && (e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
            e.preventDefault();
            // <<<--- LOG DE SALTO (TECLADO) --- >>>
            console.log(`>>> inputManager: TECLA ESPACIO detectada. isRunning=${isRunning}. Llamando a jump...`);
            // Pasar combo actual desde state.js
            playerController.jump(state.getCombo(), isRunning);
        }
        // Iniciar juego con Enter/Espacio desde StartScreen
        else if (!state.isGameEffectivelyRunning() && dom.startScreen && !dom.startScreen.classList.contains('screen--hidden') && (e.key === 'Enter' || e.keyCode === 13 || e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
            e.preventDefault();
            console.log("InputManager: Tecla Start/Enter detectada en StartScreen."); // LOG
            gameLoop.startGame();
        }
        // Reiniciar juego con Enter/Espacio desde RankingScreen
        else if (!state.isGameEffectivelyRunning() && dom.rankingDisplayScreen && !dom.rankingDisplayScreen.classList.contains('screen--hidden') && (e.key === 'Enter' || e.keyCode === 13 || e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
            e.preventDefault();
             console.log("InputManager: Tecla Start/Enter detectada en RankingScreen."); // LOG
            dom.restartButton?.click();
        }
        // Aceptar términos con Enter
        else if (dom.termsModal && dom.termsModal.style.display === 'block' && document.activeElement === dom.acceptTermsBtn && (e.key === 'Enter' || e.keyCode === 13)) {
             e.preventDefault();
             uiManager.acceptTerms();
        }
         // Cerrar modal con Escape
        else if (dom.termsModal && dom.termsModal.style.display === 'block' && (e.key === 'Escape' || e.keyCode === 27)) {
             uiManager.closeTermsModal();
        }
        // Pausa con 'P' (requiere pause/resume en gameLoop/state)
        // else if (state.isGameEffectivelyRunning() && (e.code === 'KeyP' || e.key === 'p')) {
        //     if (state.isPaused()) { gameLoop.resumeGame(); }
        //     else { gameLoop.pauseGame(); }
        // }
    });

    // --- Listeners Táctiles ---
    dom.container?.addEventListener('touchstart', (e) => {
        const isRunning = state.isGameRunning();
        if (isRunning && !e.target.closest('button, a, input, .modal')) {
            // <<<--- LOG DE SALTO (TÁCTIL) --- >>>
            console.log(`>>> inputManager: TOUCH detectado. isRunning=${isRunning}. Llamando a jump...`);
            // Pasar combo actual desde state.js
            playerController.jump(state.getCombo(), isRunning);
        }
    }, { passive: true });

    // Prevenir scroll con touchmove durante el juego en móviles
    if (isMobileDevice()) {
        document.body.addEventListener('touchmove', (e) => {
            if (state.isGameRunning()) { // Usar state.isGameRunning()
                e.preventDefault();
            }
        }, { passive: false });
    }

    // --- Listeners de Ventana (Foco, Visibilidad) ---
    window.addEventListener('blur', () => {
        if (state.isGameRunning()) { // Solo pausar si está activo
            console.log("InputManager: Ventana perdió foco, pausando...");
            gamePausedByBlur = true;
            gameLoop.pauseGame(); // Llamar a pauseGame de gameLoop (que llama a state)
        }
    });
    window.addEventListener('focus', () => {
         if (gamePausedByBlur) { // Solo reanudar si fue pausado por blur/visibility
            console.log("InputManager: Ventana recuperó foco, reanudando...");
            gamePausedByBlur = false;
            gameLoop.resumeGame(); // Llamar a resumeGame de gameLoop (que llama a state)
         }
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (state.isGameRunning()) {
                 console.log("InputManager: Pestaña oculta, pausando...");
                 gamePausedByBlur = true;
                 gameLoop.pauseGame();
            }
        } else {
             if (gamePausedByBlur) {
                 console.log("InputManager: Pestaña visible, reanudando...");
                 gamePausedByBlur = false;
                 gameLoop.resumeGame();
             }
        }
    });

    console.log("InputManager: Listeners configurados.");
}