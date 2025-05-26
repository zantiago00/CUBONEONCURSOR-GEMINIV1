// Módulo: domRefs.js
// Descripción: Obtiene y exporta referencias a los elementos clave del DOM.

export const player = document.getElementById('player');
export const container = document.getElementById('gameContainer');
export const scoreEl = document.getElementById('score');
export const timerEl = document.getElementById('timer');
export const comboEl = document.getElementById('combo');

// Pantallas y Formularios
export const welcomeScreen = document.getElementById('welcomeScreen');
export const emailScreen = document.getElementById('emailScreen');
export const emailForm = document.getElementById('emailForm');
export const initialEmailInput = document.getElementById('initialEmail');

export const registerScreen = document.getElementById('registerScreen');
export const registerForm = document.getElementById('registerForm');
export const startScreen = document.getElementById('startScreen');
export const rankingDisplayScreen = document.getElementById('rankingDisplay');

// Botones, Inputs y Elementos UI
export const welcomeStartBtn = document.getElementById('welcomeStartBtn');
export const startButton = document.getElementById('startButton');
export const playerNameInput = document.getElementById('playerName');
export const playerEmailInput = document.getElementById('playerEmail');
export const rankingDiv = document.getElementById('ranking');
export const finalScoreTextEl = document.getElementById('finalScoreText');
export const restartButton = document.getElementById('restartButton');
// export const registerButton = document.getElementById('registerButton'); // Comentado en original

// Referencia específica para instrucciones móviles (puede ser null si no existe)
export const mobileInstructions = startScreen?.querySelector('.mobile-instructions');
// Mensaje de orientación
export const orientationMessage = document.getElementById('orientation-message');

// Elementos de Términos y Condiciones
export const termsModal = document.getElementById('termsModal');
export const openTermsBtn = document.getElementById('openTermsBtn');
// Usar optional chaining (?) por si termsModal no existe o no tiene los botones dentro
export const closeBtn = termsModal?.querySelector('.close-btn');
export const acceptTermsBtn = termsModal?.querySelector('#acceptTermsBtn');
export const termsCheckbox = document.getElementById('termsCheckbox');

// Nota: Si algún getElementById puede fallar (elemento no siempre presente),
// podríamos añadir comprobaciones, pero por ahora asumimos que existen según el HTML.