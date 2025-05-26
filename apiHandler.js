// Módulo: apiHandler.js
// Descripción: Gestiona la comunicación con la API externa para el ranking.

// Importar constantes necesarias
import { RANKING_URL, RANKING_MAX_NAME_LENGTH, RANKING_TOP_N } from './config.js';
// Importar referencias DOM necesarias
import { rankingDiv, finalScoreTextEl, rankingDisplayScreen, restartButton } from './domRefs.js';
// Importar funciones de UI necesarias
import { showScreen } from './uiManager.js';
// Importar utilidades necesarias
import { escapeHTML } from './utils.js';
// Importar referencia al estado del juego (para saber si sigue corriendo)
// Necesitaremos una forma de saber si el juego se reinició mientras cargaba.
// Podríamos importar una variable o función 'isGameRunning' desde gameLoop.js
// Por ahora, lo manejaremos comprobando si la pantalla sigue visible.


/**
 * Función interna para mostrar el ranking o mensajes de error en el div correspondiente.
 * @param {Array|null} data - Los datos del ranking (array de objetos) o null si hubo error de fetch.
 * @param {Error|null} sendErr - Error ocurrido durante el envío de la puntuación (si hubo).
 * @param {Error|null} fetchErr - Error ocurrido durante la obtención del ranking (si hubo).
 * @private
 */
function _displayRanking(data, sendErr, fetchErr) {
    if (!rankingDiv) return; // Salir si el div no existe

    if (fetchErr) { // Priorizar error al OBTENER el ranking
        rankingDiv.innerHTML = `<p style='color:orange;'>No se pudo cargar el ranking (${escapeHTML(fetchErr.message)}). Verifica tu conexión.</p>`;
        if (sendErr) {
            rankingDiv.innerHTML += `<p style='color:var(--color-error); font-size:0.8em;'>Además, no se pudo guardar tu puntuación (${escapeHTML(sendErr.message)}).</p>`;
        } else {
             // Si no hubo error de envío, asumimos que se envió bien aunque no se pudo cargar el ranking
             rankingDiv.innerHTML += `<p style='color:var(--color-green); font-size:0.8em;'>Tu puntuación fue enviada, pero el ranking no está disponible ahora.</p>`;
        }
    } else if (Array.isArray(data)) { // Si se OBTUVIERON datos y son un array
        try {
            // Mapear, limpiar y validar datos recibidos
            const topPlayers = data
                .map(r => ({
                    nombre: String(r?.nombre || "???").substring(0, RANKING_MAX_NAME_LENGTH),
                    puntaje: Number(String(r?.puntaje || '0').replace(/[^\d.-]/g, '')) || 0
                }))
                .filter(r => !isNaN(r.puntaje) && r.puntaje >= 0) // Filtrar inválidos
                .sort((a, b) => b.puntaje - a.puntaje) // Ordenar
                .slice(0, RANKING_TOP_N); // Tomar Top N

            // Construir tabla HTML
            let tableHTML = `<h2>Ranking Top ${RANKING_TOP_N}</h2><table><thead><tr><th>#</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>`;
            if (topPlayers.length > 0) {
                topPlayers.forEach((r, i) => {
                    tableHTML += `<tr><td>${i + 1}</td><td>${escapeHTML(r.nombre)}</td><td>${r.puntaje}</td></tr>`;
                });
            } else {
                tableHTML += '<tr><td colspan="3">Ranking vacío o no disponible.</td></tr>';
            }
            tableHTML += '</tbody></table>';
            rankingDiv.innerHTML = tableHTML; // Mostrar tabla

            // Añadir nota si hubo error al ENVIAR pero el ranking SÍ cargó
            if (sendErr) {
                rankingDiv.innerHTML += `<p style='color:orange; font-size:0.8em;'>Nota: No se pudo confirmar el guardado de tu puntuación (${escapeHTML(sendErr.message)}), pero el ranking sí se cargó.</p>`;
            }

        } catch (processingError) {
            console.error("Error al procesar datos del ranking:", processingError);
            rankingDiv.innerHTML = "<p>Error al mostrar el ranking. Intenta de nuevo más tarde.</p>";
        }
    } else { // Caso: No hubo error de fetch, pero los datos no son un array válido
        console.warn("Los datos del ranking recibidos no son un array:", data);
        rankingDiv.innerHTML = "<p>Formato de ranking inesperado recibido del servidor.</p>";
        if (sendErr) {
             rankingDiv.innerHTML += `<p style='color:var(--color-error); font-size:0.8em;'>Además, hubo un error al guardar tu puntuación (${escapeHTML(sendErr.message)}).</p>`;
        }
    }
}


/**
 * Envía la puntuación del jugador a la API y luego obtiene y muestra el ranking.
 * Muestra mensajes de carga y maneja errores de red/API.
 * @param {string} playerName - Nombre del jugador.
 * @param {string} playerEmail - Email del jugador.
 * @param {number} score - Puntuación final obtenida.
 */
export async function submitScoreAndDisplayRanking(playerName, playerEmail, score) {
    // Mostrar pantalla de ranking y mensaje inicial
    if(finalScoreTextEl) finalScoreTextEl.textContent = `${escapeHTML(playerName) || 'Jugador'}, tu puntuación: ${score}`;
    if(rankingDiv) rankingDiv.innerHTML = "<p>Enviando puntuación y cargando ranking...</p>";
    showScreen(rankingDisplayScreen); // Usar función de uiManager
    restartButton?.focus(); // Poner foco en botón reiniciar

    // --- Envío y Carga de Ranking ---
    // Usamos GET con parámetros en la URL según el script original
    const requestParams = new URLSearchParams({
        nombre: playerName.substring(0, RANKING_MAX_NAME_LENGTH),
        email: playerEmail, // El email viaja como parámetro GET (considerar POST para más privacidad)
        puntaje: score
    });
    const urlEnviar = `${RANKING_URL}?${requestParams.toString()}`;

    let rankingData = null;
    let sendError = null;
    let fetchError = null;

    console.log("API Handler: Enviando puntuación...");
    const sendPromise = fetch(urlEnviar)
        .then(response => {
            if (!response.ok) {
                 // Intentar leer texto del error si existe
                 return response.text().then(text => {
                     throw new Error(`Error HTTP ${response.status} al enviar: ${text || response.statusText}`);
                 });
            }
            console.log("API Handler: Puntuación enviada correctamente.");
            // Podríamos procesar la respuesta si la API devolviera algo útil (ej: intentos restantes)
            return response.text();
        })
        .catch(err => {
            console.error("API Handler: Error al enviar puntuación:", err);
            sendError = err; // Guardar el error
            // No relanzar para que Promise.allSettled continúe
        });

    console.log("API Handler: Obteniendo ranking...");
    const fetchPromise = fetch(RANKING_URL) // GET simple para obtener ranking
        .then(response => {
             if (!response.ok) {
                 return response.text().then(text => {
                     throw new Error(`Error HTTP ${response.status} al obtener ranking: ${text || response.statusText}`);
                 });
            }
            return response.json(); // Esperamos un JSON con el ranking
        })
        .then(data => {
            console.log("API Handler: Ranking recibido.");
            rankingData = data; // Guardar los datos
        })
        .catch(err => {
            console.error("API Handler: Error al obtener ranking:", err);
            fetchError = err; // Guardar el error
        });

    // Esperar a que ambas operaciones (envío y fetch) terminen, sin importar si fallan
    await Promise.allSettled([sendPromise, fetchPromise]);

    console.log("API Handler: Operaciones de red finalizadas.");

    // Verificar si el usuario todavía está en la pantalla de ranking
    // (podría haber reiniciado el juego rápidamente)
    // Usamos la visibilidad de la pantalla como indicador.
    if (!rankingDisplayScreen || rankingDisplayScreen.classList.contains('screen--hidden')) {
        console.log("API Handler: Actualización de ranking cancelada (pantalla oculta).");
        return; // No actualizar el DOM si ya no es visible
    }

    // Mostrar los resultados (ranking o errores)
    _displayRanking(rankingData, sendError, fetchError);
}