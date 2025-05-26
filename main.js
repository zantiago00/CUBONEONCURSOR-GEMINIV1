// Módulo: main.js
// Descripción: Punto de entrada principal. (Versión con Log de Verificación de Botón)

// Log inicial para saber si el archivo se carga
console.log("--- main.js: Archivo cargado y ejecutándose ---");

// Importar referencias DOM
import * as dom from './domRefs.js';
// Importar gestor de UI
import * as uiManager from './uiManager.js';
// Importar gestor de Inputs
import * as inputManager from './inputManager.js';
// Importar gameLoop
import * as gameLoop from './gameLoop.js';
// Importar FUNCIONES ESPECÍFICAS de state.js
import { setPlayerInfo } from './state.js';
// Importar constantes
import { WELCOME_TRANSITION_DURATION_MS } from './config.js';


/**
 * Función principal de inicialización.
 */
function initializeApp() {
    console.log("--- main.js: Entrando a initializeApp() ---");

    console.log("Main: Inicializando aplicación...");
    let currentEmail = '';

    uiManager.adjustGameContainer();
    uiManager.showScreen(dom.welcomeScreen);
    dom.welcomeStartBtn?.focus();

    inputManager.initInputListeners();

    // --- Configurar Listeners de UI Específicos ---
    console.log("Main: Añadiendo listeners de UI...");

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // Listener para el Botón "Comenzar" con Logs
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

    // <<<--- LOG AÑADIDO PARA VERIFICAR EL BOTÓN --- >>>
    console.log("Main: Intentando añadir listener a welcomeStartBtn:", dom.welcomeStartBtn);

    dom.welcomeStartBtn?.addEventListener('click', () => {
        // Log que debería aparecer al hacer clic
        console.log(">>> Main: ¡Clic en welcomeStartBtn detectado!");

        console.log(">>> Main: Verificando referencias - welcomeScreen:", dom.welcomeScreen, "emailScreen:", dom.emailScreen);
        if (dom.welcomeScreen && dom.emailScreen) {
            console.log(">>> Main: Aplicando clase 'transition-out' a welcomeScreen.");
            dom.welcomeScreen.classList.add('transition-out');
            console.log(`>>> Main: Iniciando setTimeout con duración: ${WELCOME_TRANSITION_DURATION_MS}ms`);
            setTimeout(() => {
                console.log(">>> Main: Ejecutando callback de setTimeout.");
                console.log(">>> Main: Llamando a uiManager.showScreen(dom.emailScreen)...");
                uiManager.showScreen(dom.emailScreen);
                console.log(">>> Main: Removiendo clase 'transition-out' de welcomeScreen.");
                dom.welcomeScreen?.classList.remove('transition-out');
                console.log(">>> Main: Poniendo foco en initialEmailInput.");
                dom.initialEmailInput?.focus();
                console.log(">>> Main: Callback de setTimeout completado.");
            }, WELCOME_TRANSITION_DURATION_MS);
        } else {
            console.error(">>> Main: ERROR - welcomeScreen o emailScreen no encontrados dentro del listener!");
            uiManager.showScreen(dom.emailScreen); // Fallback
            dom.initialEmailInput?.focus();
        }
        console.log(">>> Main: Fin del código del listener de clic.");
    });
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // Fin Listener welcomeStartBtn
    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


    dom.emailForm?.addEventListener('submit', (e) => {
        console.log("Main: Submit en emailForm"); const email = uiManager.handleEmailSubmit(e); if (email) { currentEmail = email; console.log("Main: Email recibido:", currentEmail); }
    });
    dom.registerForm?.addEventListener('submit', (e) => {
        console.log("Main: Submit en registerForm"); const name = uiManager.handleRegisterSubmit(e); if (name && currentEmail) { setPlayerInfo(name, currentEmail); } else { console.warn("Main: Registro fallido o email perdido."); if (!currentEmail) { /* Error manejo email */ } }
    });
    dom.startButton?.addEventListener('click', () => {
        console.log("Main: Click en startButton"); gameLoop.startGame();
    });
    dom.restartButton?.addEventListener('click', () => {
        console.log("Main: Click en restartButton"); uiManager.showScreen(dom.startScreen); dom.startButton?.focus();
    });
    dom.openTermsBtn?.addEventListener('click', (e) => { e.preventDefault(); uiManager.openTermsModal(); });
    dom.closeBtn?.addEventListener('click', uiManager.closeTermsModal);
    dom.acceptTermsBtn?.addEventListener('click', uiManager.acceptTerms);
    dom.termsModal?.addEventListener('click', (e) => { if (e.target === dom.termsModal) uiManager.closeTermsModal(); });

    // Listeners Globales Ventana
    console.log("Main: Añadiendo listeners de Ventana...");
    window.addEventListener('resize', uiManager.debouncedAdjustGameContainer);
    if (window.screen?.orientation) { try { window.screen.orientation.addEventListener('change', uiManager.debouncedAdjustGameContainer); } catch (e) { window.addEventListener('orientationchange', uiManager.debouncedAdjustGameContainer); } } else { window.addEventListener('orientationchange', uiManager.debouncedAdjustGameContainer); }
    window.onerror = function(message, source, lineno, colno, error) { console.error("Error global:", { message, source, lineno, colno, error }); };
    window.onunhandledrejection = function(event) { console.error("Promesa rechazada:", event.reason); };

    console.log("Main: Aplicación inicializada y listeners configurados.");
    console.log("--- main.js: Saliendo de initializeApp() ---");
}

// --- Punto de Entrada ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("--- main.js: DOMContentLoaded disparado ---");
    initializeApp();
});

console.log("--- main.js: Fin del script alcanzado ---");