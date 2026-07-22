// =============================================================
//  app.js — Vanilla JavaScript puro. Sin frameworks ni librerías.
//  Lee datos de FIRESTORE (colección "readings") en tiempo real.
//  Requiere Chart.js cargado en index.html mediante CDN.
// =============================================================

// Importaciones del SDK de Firebase v10 desde CDN (ES Modules nativos)
// Tu proyecto usa FIRESTORE, no Realtime Database.
import { initializeApp }                      from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query,
         orderBy, limit, onSnapshot }         from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE
//    Credenciales reales del proyecto med-iot-pastillero
// ==========================================
const firebaseConfig = {
    apiKey:            "AIzaSyDM0CdV7ZIjYro43aA0w8w2WSnpZGXQu80",
    authDomain:        "med-iot-pastillero.firebaseapp.com",
    projectId:         "med-iot-pastillero",
    storageBucket:     "med-iot-pastillero.firebasestorage.app",
    messagingSenderId: "536272990844",
    appId:             "1:536272990844:web:07db6a7b18692831a24ff9"
};

// Inicializar Firebase y obtener la instancia de Firestore
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ==========================================
// 2. CREDENCIALES DE TELEGRAM Y UMBRAL
// ==========================================
const TELEGRAM_TOKEN = "8837151012:AAEtUX7RSP_QrxlcfD-BErsuEj1nOpZ0OME";
const CHAT_ID        = "8986965123";

// Umbral crítico en °C — se actualiza dinámicamente desde el slider del HTML
let UMBRAL_CRITICO = 80;

// ==========================================
// 3. BANDERA BOOLEANA ANTI-SPAM
//    Se pone en true al enviar la alerta.
//    Solo se resetea cuando el valor baja del umbral.
// ==========================================
let alertaEnviada = false;

// ==========================================
// 4. FUNCIÓN DE ALERTA — fetch() a Telegram
//    HTTP POST estándar sin ninguna librería.
// ==========================================
/**
 * Envía un mensaje de texto a Telegram usando fetch().
 * @param {number} valor - Valor actual de temperatura que disparó la alerta
 */
async function enviarAlertaTelegram(valor) {
    const texto = `⚠️ ¡ALERTA MED-IOT!\nDispositivo: esp32-sensor-01\nTemperatura crítica detectada: ${valor}°C\nUmbral configurado: ${UMBRAL_CRITICO}°C`;
    const url   = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(texto)}`;

    try {
        const respuesta = await fetch(url, { method: "POST" });
        if (respuesta.ok) {
            console.log("✅ Alerta enviada correctamente a Telegram.");
        } else {
            console.error("❌ Error en la API de Telegram:", respuesta.statusText);
        }
    } catch (error) {
        console.error("❌ Error de red al contactar con Telegram:", error);
    }
}

// ==========================================
// 5. INICIALIZACIÓN DE CHART.JS (Tradicional)
//    new Chart(ctx, config) — sin JSX ni hooks.
// ==========================================
const ctx = document.getElementById("miGrafico").getContext("2d");

const miGrafico = new Chart(ctx, {
    type: "line",
    data: {
        labels:   [], // Arreglo dinámico de marcas de tiempo (eje X)
        datasets: [
            {
                label:                "Temperatura (°C)",
                data:                 [], // Arreglo dinámico de valores (eje Y)
                borderColor:          "rgba(88, 166, 255, 1)",
                backgroundColor:      "rgba(88, 166, 255, 0.15)",
                borderWidth:          2,
                fill:                 true,
                tension:              0.4,
                pointRadius:          4,
                pointHoverRadius:     6,
                pointBackgroundColor: "rgba(88, 166, 255, 1)"
            },
            {
                label:           "Humedad (%)",
                data:            [], // Arreglo dinámico de humedad (eje Y)
                borderColor:     "rgba(63, 185, 80, 1)",
                backgroundColor: "rgba(63, 185, 80, 0.1)",
                borderWidth:     2,
                fill:            false,
                tension:         0.4,
                pointRadius:     3
            }
        ]
    },
    options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: "#e6edf3" }
            }
        },
        scales: {
            x: {
                ticks: { color: "#8b949e" },
                grid:  { color: "rgba(48, 54, 61, 0.8)" }
            },
            y: {
                ticks: { color: "#8b949e" },
                grid:  { color: "rgba(48, 54, 61, 0.8)" }
            }
        }
    }
});

// ==========================================
// 6. CONTROL DEL SLIDER DE UMBRAL
// ==========================================
const slider     = document.getElementById("sliderUmbral");
const valorLabel = document.getElementById("valorUmbral");

slider.addEventListener("input", () => {
    UMBRAL_CRITICO        = parseFloat(slider.value);
    valorLabel.textContent = `${UMBRAL_CRITICO} °C`;
    // Al cambiar el umbral se reinicia la bandera para reevaluar
    alertaEnviada = false;
});

// ==========================================
// 7. LECTURA EN TIEMPO REAL CON onSnapshot
//    Escucha la colección "readings" de Firestore,
//    ordenada por timestamp descendente (las más
//    recientes primero), limitando a 20 documentos.
//
//    Estructura real de cada documento en Firestore:
//    {
//      deviceId:  "esp32-sensor-01",
//      timestamp: Timestamp (serverTimestamp),
//      variables: {
//          temperature: 25.4,
//          humidity:    58.2,
//          voltage:     3.30,
//          light:       490
//      }
//    }
// ==========================================
const q = query(
    collection(db, "readings"),
    orderBy("timestamp", "desc"),
    limit(20)
);

onSnapshot(q, (snapshot) => {
    // snapshot.docs viene en orden descendente (más reciente primero).
    // Invertimos para que el gráfico muestre el tiempo de izquierda a derecha.
    const docs = snapshot.docs.map(d => d.data()).reverse();

    // Reconstruir los arreglos del gráfico desde cero con cada actualización
    const etiquetas  = [];
    const tempValues = [];
    const humValues  = [];

    docs.forEach(data => {
        // Convertir el Timestamp de Firestore a hora legible
        const hora = data.timestamp
            ? data.timestamp.toDate().toLocaleTimeString("es-MX", {
                hour: "2-digit", minute: "2-digit", second: "2-digit"
              })
            : "--:--";

        // Extraer las variables del sensor
        const temp = data.variables?.temperature ?? data.variables?.temp ?? null;
        const hum  = data.variables?.humidity    ?? data.variables?.hum  ?? null;

        etiquetas.push(hora);
        tempValues.push(temp);
        humValues.push(hum);
    });

    // Actualizar los arreglos de datos del gráfico
    miGrafico.data.labels                  = etiquetas;
    miGrafico.data.datasets[0].data        = tempValues;
    miGrafico.data.datasets[1].data        = humValues;

    // Llamar a chart.update() para redibujar el canvas de forma dinámica
    miGrafico.update();

    // ------------------------------------------------
    // LÓGICA DE COMPARACIÓN Y BANDERA BOOLEANA
    // Tomamos el valor más reciente (último elemento)
    // ------------------------------------------------
    const ultimaTemp = tempValues[tempValues.length - 1];

    const panelAlerta = document.getElementById("panelAlerta");
    const indicador   = document.getElementById("indicador");
    const textoAlerta = document.getElementById("textoAlerta");

    if (ultimaTemp !== null && ultimaTemp !== undefined) {
        if (ultimaTemp > UMBRAL_CRITICO) {
            // Valor SUPERA el umbral
            panelAlerta.className = "critico";
            indicador.className   = "critico";
            textoAlerta.textContent = `🔴 ¡ALERTA! Temperatura crítica: ${ultimaTemp}°C  (Umbral: ${UMBRAL_CRITICO}°C)`;

            // Enviar alerta a Telegram solo la primera vez que cruza el límite hacia arriba
            if (!alertaEnviada) {
                enviarAlertaTelegram(ultimaTemp);
                alertaEnviada = true; // Bloquea envíos redundantes mientras siga en zona crítica
            }

        } else {
            // Valor está por debajo del umbral — zona segura
            panelAlerta.className = "seguro";
            indicador.className   = "seguro";
            textoAlerta.textContent = `🟢 Sistema seguro. Temperatura actual: ${ultimaTemp}°C`;

            // Resetear la bandera SOLO cuando el valor baja del umbral
            // Esto permite que se dispare una nueva alerta en el próximo cruce ascendente
            alertaEnviada = false;
        }
    }
});
