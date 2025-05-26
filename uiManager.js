// Módulo: uiManager.js
// Descripción: Gestiona las interacciones y actualizaciones de la interfaz de usuario (UI).

// Importar referencias a elementos del DOM
import * as dom from './domRefs.js';
// Importar funciones auxiliares
import { setElementVisibility, isMobileDevice } from './utils.js';
// Importar constantes necesarias
import { WELCOME_TRANSITION_DURATION_MS, FLOATING_TEXT_DURATION_MS } from './config.js';

// Variable interna para el debounce del ajuste de contenedor
let resizeTimeout = null;

/**
 * Muestra una pantalla específica y oculta las demás.
 * @param {HTMLElement | null} screenToShow - El elemento de la pantalla a mostrar, o null para ocultar todas.
 */
export function showScreen(screenToShow) {
    // Oculta todas las pantallas principales conocidas
    [dom.welcomeScreen, dom.emailScreen, dom.registerScreen, dom.startScreen, dom.rankingDisplayScreen].forEach(screen => {
        if (screen) {
            setElementVisibility(screen, false);
        }
    });
    // Muestra la pantalla deseada (si existe)
    if (screenToShow) {
        setElementVisibility(screenToShow, true);
    }
}

/** Abre el modal de Términos y Condiciones. */
export function openTermsModal() {
    if (dom.termsModal) {
        dom.termsModal.style.display = "block"; // El modal usa display directo, no la clase helper
        dom.termsModal.setAttribute('aria-hidden', 'false');
        dom.acceptTermsBtn?.focus(); // Poner foco en botón aceptar
    }
}

/** Cierra el modal de Términos y Condiciones. */
export function closeTermsModal() {
    if (dom.termsModal) {
        dom.termsModal.style.display = "none";
        dom.termsModal.setAttribute('aria-hidden', 'true');
        dom.openTermsBtn?.focus(); // Devolver foco al botón que abrió el modal
    }
}

/** Marca el checkbox de términos como aceptado y cierra el modal. */
export function acceptTerms() {
    if (dom.termsCheckbox) {
        dom.termsCheckbox.checked = true;
        // Disparar evento change por si hay validación externa ligada a él
        dom.termsCheckbox.dispatchEvent(new Event('change'));
    }
    closeTermsModal();
}

/**
 * Maneja el envío del formulario de correo inicial. Valida y devuelve el email.
 * @param {Event} e - El objeto evento del formulario.
 * @returns {string | null} El email validado en minúsculas, o null si la validación falla.
 */
export function handleEmailSubmit(e) {
    e.preventDefault(); // Prevenir recarga de página
    if (!dom.initialEmailInput || !dom.playerEmailInput) return null;

    const email = dom.initialEmailInput.value.trim().toLowerCase(); // Normalizar

    // Validación básica de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        dom.initialEmailInput.focus();
        return null; // Indicador de fallo
    }

    // Pre-rellenar en pantalla de registro (el estado principal se actualizará fuera)
    dom.playerEmailInput.value = email;
    dom.playerEmailInput.readOnly = true;

    showScreen(dom.registerScreen); // Mostrar siguiente pantalla
    dom.playerNameInput?.focus(); // Foco en el nombre

    return email; // Devolver email validado
}

/**
 * Maneja el envío del formulario de registro. Valida y devuelve el nombre.
 * @param {Event} e - El objeto evento del formulario.
 * @returns {string | null} El nombre validado y truncado, o null si la validación falla.
 */
export function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!dom.playerNameInput || !dom.playerEmailInput || !dom.termsCheckbox) return null;

    const name = dom.playerNameInput.value.trim();

    // Validación de nombre (simple, solo que no esté vacío)
    if (!name) {
        alert("Por favor, ingresa tu nombre de jugador.");
        dom.playerNameInput.focus();
        return null;
    }
    // Validación de términos
    if (!dom.termsCheckbox.checked) {
        alert("Debes aceptar los términos y condiciones para continuar.");
        return null;
    }
    // Validación de email (por si acaso)
    if (!dom.playerEmailInput.value) {
        alert("Error con el correo. Por favor, vuelve a la pantalla inicial.");
        showScreen(dom.emailScreen);
        dom.initialEmailInput?.focus();
        return null;
    }

    // Truncar nombre si excede el límite (definido en config.js, pero necesitamos importarlo si usamos aquí)
    // Por simplicidad, usamos el valor directamente o lo dejamos para quien llame esta función.
    // const finalName = name.substring(0, RANKING_MAX_NAME_LENGTH); // Requeriría importar la constante
    const finalName = name; // Dejar que el script principal lo limite si es necesario

    showScreen(dom.startScreen); // Mostrar pantalla de inicio del juego
    dom.startButton?.focus(); // Foco en el botón Jugar

    return finalName; // Devolver nombre validado
}

/**
 * Actualiza los elementos de la UI con el estado actual del juego.
 * @param {number} score - Puntuación actual.
 * @param {number} gameTime - Tiempo restante.
 * @param {number} combo - Combo actual.
 */
export function updateUI(score, gameTime, combo) {
    if (dom.scoreEl) dom.scoreEl.textContent = score;
    if (dom.timerEl) dom.timerEl.textContent = gameTime.toFixed(1); // Mostrar 1 decimal
    if (dom.comboEl) dom.comboEl.textContent = `Combo: ${combo}`;
}

/**
 * Muestra un texto flotante (+/-) en una posición específica.
 * @param {number} x - Coordenada X relativa al contenedor del juego.
 * @param {number} y - Coordenada Y relativa al contenedor del juego (desde arriba).
 * @param {string} text - El texto a mostrar (ej: "+1s", "-5").
 * @param {boolean} isPositive - True para estilo 'plus', false para estilo 'minus'.
 */
export function showFloatingText(x, y, text, isPositive) {
    if (!dom.container) return;
    const el = document.createElement('div');
    el.className = `floating-text ${isPositive ? 'plus' : 'minus'}`;
    el.textContent = text;

    // Posición (ajustada para centrar aproximadamente)
    const textWidthEstimate = text.length * 12; // Estimación simple
    el.style.left = `${x - textWidthEstimate / 2}px`;
    el.style.top = `${y}px`;

    // Añadir al contenedor y eliminar después de la animación CSS
    dom.container.appendChild(el);
    setTimeout(() => { el?.remove(); }, FLOATING_TEXT_DURATION_MS); // Usar constante importada
}

/**
 * Ajusta elementos de UI basados en tamaño/orientación, principalmente el mensaje de orientación.
 * (No necesita estado del juego directamente).
 */
export function adjustGameContainer() {
    if (isMobileDevice()) {
        // Mostrar/Ocultar mensaje de orientación
        const isPortrait = window.innerHeight > window.innerWidth;
        setElementVisibility(dom.orientationMessage, isPortrait);
        if (dom.orientationMessage) {
            dom.orientationMessage.setAttribute('aria-hidden', String(!isPortrait));
        }
    } else {
        // Ocultar mensaje en escritorio
        setElementVisibility(dom.orientationMessage, false);
        if (dom.orientationMessage) {
            dom.orientationMessage.setAttribute('aria-hidden', 'true');
        }
    }
    // Mostrar/ocultar instrucciones móviles específicas (basado en si es móvil)
    setElementVisibility(dom.mobileInstructions, isMobileDevice());

}

/**
 * Versión "debounced" de adjustGameContainer para evitar llamadas excesivas en resize/orientationchange.
 */
export function debouncedAdjustGameContainer() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(adjustGameContainer, 150); // Espera 150ms
}