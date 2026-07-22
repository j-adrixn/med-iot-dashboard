const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = getFirestore();

// ==========================================
// CONFIGURACIÓN DE ALERTAS DE TELEGRAM
// ==========================================
const TELEGRAM_TOKEN = "8837151012:AAEtUX7RSP_QrxlcfD-BErsuEj1nOpZ0OME"; // Reemplazar con el token real de tu Bot
const CHAT_ID = "8986965123";               // Reemplazar con tu ID de chat o canal real
const UMBRAL_CRITICO = 28;                  // Umbral de prueba IRL — superable con la mano (temp. corporal ~36°C)

/**
 * Envía un mensaje a Telegram utilizando la API de Bot de Telegram y fetch nativo.
 */
async function enviarAlertaTelegram(mensaje) {
  if (TELEGRAM_TOKEN === "TU_TELEGRAM_TOKEN" || CHAT_ID === "TU_CHAT_ID") {
    console.warn("⚠️ Telegram no configurado. Ignorando alerta.");
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(mensaje)}`;
  try {
    const response = await fetch(url, { method: "POST" });
    if (!response.ok) {
      console.error(`❌ Error en Telegram API: ${response.statusText}`);
    } else {
      console.log("✅ Alerta enviada con éxito a Telegram desde el Backend.");
    }
  } catch (error) {
    console.error("❌ Error de red enviando alerta a Telegram:", error);
  }
}

/**
 * POST /postDeviceData
 * Recibe lecturas del ESP32 y las guarda en Firestore.
 *
 * Headers requeridos:
 *   X-Device-Token: <token del dispositivo>
 *
 * Body JSON esperado:
 * {
 *   "deviceId": "esp32-sensor-01",
 *   "variables": {
 *     "temperature": 25.4,
 *     "humidity": 58.2
 *   }
 * }
 */
exports.postDeviceData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Solo aceptar POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

    const token = req.headers["x-device-token"];
    const { deviceId, variables } = req.body;

    // Validar campos requeridos
    if (!token || !deviceId || !variables) {
      return res.status(400).json({
        error: "Faltan campos requeridos: deviceId, variables y X-Device-Token header.",
      });
    }

    try {
      // Verificar si el dispositivo existe y el token es válido
      const deviceRef = db.collection("devices").doc(deviceId);
      const deviceSnap = await deviceRef.get();

      if (!deviceSnap.exists) {
        return res.status(401).json({ error: "Dispositivo no registrado." });
      }

      const deviceData = deviceSnap.data();
      if (deviceData.token !== token) {
        return res.status(403).json({ error: "Token inválido para este dispositivo." });
      }

      // Evaluar si hay variables de temperatura para enviar alertas
      const temp = variables.temperature !== undefined ? variables.temperature : variables.temp;
      if (temp !== undefined) {
        const valorTemp = parseFloat(temp);
        const alertaEnviada = !!deviceData.alertaEnviada;

        if (valorTemp > UMBRAL_CRITICO) {
          // Si supera el umbral y no se ha enviado la alerta aún
          if (!alertaEnviada) {
            const mensaje = `⚠️ ¡ALERTA MED-IOT! El dispositivo "${deviceData.name || deviceId}" superó el umbral crítico. Valor: ${valorTemp}°C (Límite: ${UMBRAL_CRITICO}°C)`;
            await enviarAlertaTelegram(mensaje);
            await deviceRef.update({ alertaEnviada: true });
          }
        } else {
          // Si cae por debajo del umbral, restablecer la bandera
          if (alertaEnviada) {
            await deviceRef.update({ alertaEnviada: false });
            console.log(`ℹ️ El dispositivo "${deviceData.name || deviceId}" regresó a la normalidad (${valorTemp}°C). Bandera de alerta reiniciada.`);
          }
        }
      }

      // Guardar la lectura en Firestore
      const readingRef = await db.collection("readings").add({
        deviceId,
        variables,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Actualizar lastSeen del dispositivo
      await deviceRef.update({
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Lectura guardada: ${readingRef.id} desde ${deviceId}`);

      return res.status(201).json({
        success: true,
        readingId: readingRef.id,
        message: "Datos almacenados correctamente.",
      });
    } catch (error) {
      console.error("❌ Error al guardar lectura:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  });
});
