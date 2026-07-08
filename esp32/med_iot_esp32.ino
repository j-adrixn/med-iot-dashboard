git add .
git commit -m "Configuración de credenciales de Firebase lista"
 * =====================================================
 *  MED-IoT ESP32 - Sketch Principal
 *  Envia lecturas de temperatura y humedad (DHT22)
 *  a Firebase Cloud Functions mediante HTTPS POST.
 *
 *  Hardware:
 *    - DHT22  -> GPIO 4
 *    - LED    -> GPIO 14 (notificacion audiovisual)
 *
 *  Librerias necesarias (instalar desde Library Manager):
 *    - DHT sensor library by Adafruit
 *    - Adafruit Unified Sensor
 *    - ArduinoJson by Benoit Blanchon
 * =====================================================
 * =====================================================
 *  MED-IoT ESP32 - Sketch de ejemplo
 *  Envía lecturas de temperatura y humedad (DHT22)
 *  a Firebase Cloud Functions mediante HTTPS POST
 * =====================================================
 *
 * Librerías necesarias (instalar desde Library Manager):
 *  - DHT sensor library by Adafruit
 *  - Adafruit Unified Sensor
 *  - ArduinoJson by Benoit Blanchon
 * =====================================================
 */

#include "DHT.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>

// ── CONFIGURACIÓN WiFi ──────────────────────────────
const char *WIFI_SSID = "Cisco-ISTDAB";
const char *WIFI_PASSWORD = "L4B0R4ToR10_c1sc0.2024";

// ── CONFIGURACIÓN DEL DISPOSITIVO ──────────────────
const char *DEVICE_ID = "esp32-sensor-01";
const char *DEVICE_TOKEN = "tu-token-secreto"; // Registrado en Firestore

// ── URL DEL ENDPOINT (Firebase Cloud Function) ─────
// Reemplaza con tu URL real después del deploy:
const char *ENDPOINT_URL =
    "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData";

// -- SENSOR DHT22 ------------------------------------
#define DHT_PIN 4 // GPIO donde esta conectado el DHT22
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// -- LED DE NOTIFICACION ------------------------------
#define LED_PIN 14 // GPIO para el LED de estado/notificacion

// -- INTERVALO DE ENVIO --------------------------------
const unsigned long SEND_INTERVAL_MS = 10000; // 10 segundos
unsigned long lastSendTime = 0;

// -- HELPERS DE LED -----------------------------------
void ledBlink(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}

// -------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Inicializar LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("\n=== MED-IoT ESP32 ===");

  // Inicializar sensor
  dht.begin();

  // Conectar WiFi
  Serial.printf("Conectando a WiFi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
    ledBlink(1, 200); // Parpadeo rapido durante la conexion
  }

  ledBlink(3, 150); // Triple parpadeo = WiFi conectado

  Serial.println("\n[OK] WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// -------------------------------------------------------
void sendReading(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] Sin conexion WiFi");
    ledBlink(5, 500); // Parpadeo lento = error de red
    return;
  }

  // Construir payload JSON
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  JsonObject variables = doc.createNestedObject("variables");
  variables["temperature"] = temperature;
  variables["humidity"] = humidity;
  variables["voltage"] =
      analogRead(34) * (3.3 / 4095.0); // Lectura ADC (pin 34)

  String payload;
  serializeJson(doc, payload);

  // Enviar HTTP POST
  HTTPClient http;
  http.begin(ENDPOINT_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  Serial.println("[TX] Enviando datos...");
  Serial.println("Payload: " + payload);

  int httpCode = http.POST(payload);

  if (httpCode == 201) {
    String response = http.getString();
    Serial.printf("[OK] HTTP %d: %s\n", httpCode, response.c_str());
    // Exito: LED encendido 1 segundo
    digitalWrite(LED_PIN, HIGH);
    delay(1000);
    digitalWrite(LED_PIN, LOW);
  } else {
    String response = http.getString();
    Serial.printf("[ERROR] HTTP %d: %s\n", httpCode, response.c_str());
    ledBlink(3, 500); // Error: parpadeo lento x3
  }

  http.end();
}

// -------------------------------------------------------
void loop() {
  unsigned long now = millis();

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); // Celsius

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("[ERROR] Fallo en lectura del sensor DHT22");
      ledBlink(2, 300); // Error de sensor: 2 parpadeos
      return;
    }

    Serial.printf("[SENSOR] Temperatura: %.1fC  Humedad: %.1f%%\n", temperature,
                  humidity);
    sendReading(temperature, humidity);
  }
}
