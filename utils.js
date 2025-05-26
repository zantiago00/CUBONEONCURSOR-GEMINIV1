// Módulo: utils.js
// Descripción: Contiene funciones auxiliares generales reutilizables en el juego.

/**
 * Detecta si el agente de usuario corresponde a un dispositivo móvil común.
 * @returns {boolean} True si parece ser móvil, false en caso contrario.
 */
export function isMobileDevice() {
    // Esta expresión regular cubre la mayoría de los navegadores móviles.
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Muestra u oculta un elemento añadiendo o quitando una clase CSS ('screen--hidden').
 * @param {HTMLElement | null} element - El elemento del DOM a modificar.
 * @param {boolean} isVisible - True para mostrar (quitar clase), false para ocultar (añadir clase).
 */
export function setElementVisibility(element, isVisible) {
    if (!element) return; // Salir si el elemento no existe o es null

    const HIDDEN_CLASS = 'screen--hidden'; // Nombre de la clase CSS para ocultar

    if (isVisible) {
        element.classList.remove(HIDDEN_CLASS);
    } else {
        element.classList.add(HIDDEN_CLASS);
    }
}

/**
 * Escapa caracteres HTML básicos ('<' y '>') para prevenir XSS simple al insertar texto en el DOM.
 * @param {string | number | null | undefined} str - La cadena de texto o número a escapar.
 * @returns {string} La cadena escapada, o una cadena vacía si la entrada es null/undefined.
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) return ''; // Manejar null/undefined explícitamente
    // Convertir a string antes de reemplazar, por si la entrada es un número
    return String(str).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Nota: No incluimos aquí funciones más específicas como showFloatingText o updateUI,
// ya que probablemente pertenecerán a un módulo de UI más específico ('uiManager.js').