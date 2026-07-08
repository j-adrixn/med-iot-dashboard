const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

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
