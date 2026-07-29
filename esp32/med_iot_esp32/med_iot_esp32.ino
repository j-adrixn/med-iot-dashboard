
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

// ── Configuración ────────────────────────────────────────────────────────────
const char *WIFI_SSID      = "R-ISTDAB-DOCENTES-2.4G";
const char *WIFI_PASSWORD  = "ID0centes/2025";
const char *ENDPOINT_URL   =
    "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData";
const char *DEVICE_ID      = "esp32-sensor-01";
const char *DEVICE_TOKEN   = "tu-token-secreto";

// ── Sensor ───────────────────────────────────────────────────────────────────
#define DHTPIN  4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ── Parámetros ───────────────────────────────────────────────────────────────
const unsigned long INTERVALO_MS         = 10000UL; // 10 seg entre lecturas
const int           MAX_FALLOS           = 5;        // reinicia tras N fallos
const int           TIMEOUT_HTTP_MS      = 10000;    // timeout HTTP total
const int           TIMEOUT_CONEXION_MS  = 8000;     // timeout TCP/TLS
const int           MAX_REINTENTOS_WIFI  = 20;       // ~10 seg para conectar

// ── Estado global ────────────────────────────────────────────────────────────
// NOTA: cliente estático para evitar fragmentación de heap en cada iteración
WiFiClientSecure clienteSSL;
int  fallosConsecutivos = 0;
unsigned long ultimaLectura = 0;

// ─────────────────────────────────────────────────────────────────────────────
bool reconectarWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.println("[WiFi] Reconectando...");
  WiFi.disconnect(true);
  delay(500);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  for (int i = 0; i < MAX_REINTENTOS_WIFI; i++) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.print("[WiFi] Reconectado. IP: ");
      Serial.println(WiFi.localIP());
      return true;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] No se pudo reconectar.");
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
void postDatos(float temp, float hum) {
  // Configurar cliente SSL
  clienteSSL.setInsecure();           // sin validación de certificado
  clienteSSL.setTimeout(TIMEOUT_CONEXION_MS); // timeout TLS/TCP ← clave

  HTTPClient http;
  http.setTimeout(TIMEOUT_HTTP_MS);
  http.setConnectTimeout(TIMEOUT_CONEXION_MS);

  if (!http.begin(clienteSSL, ENDPOINT_URL)) {
    Serial.println("[HTTP] No se pudo iniciar la conexión");
    fallosConsecutivos++;
    return;
  }

  http.addHeader("Content-Type",   "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  http.addHeader("Connection",     "close");

  // Construir payload
  char payload[128];
  snprintf(payload, sizeof(payload),
    "{\"deviceId\":\"%s\",\"variables\":{\"temperature\":%.1f,\"humidity\":%.1f}}",
    DEVICE_ID, temp, hum);

  Serial.printf("[POST] Enviando → Temp: %.1f°C  Hum: %.1f%%\n", temp, hum);

  int code = http.POST(payload);

  if (code > 0) {
    Serial.printf("[HTTP] Código: %d\n", code);
    if (code == HTTP_CODE_OK || code == HTTP_CODE_CREATED || code == 204) {
      Serial.println("[OK] Datos enviados correctamente");
    } else {
      Serial.printf("[AVISO] Respuesta inesperada: %d  Body: %s\n",
                    code, http.getString().c_str());
    }
    fallosConsecutivos = 0;
  } else {
    fallosConsecutivos++;
    Serial.printf("[ERROR] HTTP falló (%d): %s  | Fallos: %d/%d\n",
                  code, http.errorToString(code).c_str(),
                  fallosConsecutivos, MAX_FALLOS);
  }

  http.end();
  // Cerramos explícitamente la sesión SSL para liberar recursos
  clienteSSL.stop();
}

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[BOOT] Iniciando med-iot-esp32...");

  dht.begin();
  delay(2000); // El DHT11 necesita al menos 1-2 seg para estabilizarse

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Conectando");
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\n[WiFi] Conectado. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] No conectado al arranque. Reintentará en loop.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long ahora = millis();

  // Respetar el intervalo sin usar delay() bloqueante en el loop principal
  if (ahora - ultimaLectura < INTERVALO_MS) {
    delay(100);
    return;
  }
  ultimaLectura = ahora;

  // ── 1. Verificar/reconectar WiFi ─────────────────────────────────────────
  if (!reconectarWiFi()) {
    // Si tras los reintentos no hay red, esperamos antes de reiniciar
    fallosConsecutivos++;
    if (fallosConsecutivos >= MAX_FALLOS) {
      Serial.println("[FATAL] Demasiados fallos. Reiniciando ESP32...");
      delay(1000);
      ESP.restart();
    }
    return;
  }

  // ── 2. Leer sensor ───────────────────────────────────────────────────────
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("[DHT] Error al leer sensor (NaN). Reintentando en próximo ciclo.");
    return; // No suma fallo; puede ser una lectura sucia puntual
  }

  Serial.printf("[DHT] Temp: %.1f°C  Hum: %.1f%%\n", t, h);

  // ── 3. Enviar datos ──────────────────────────────────────────────────────
  postDatos(t, h);

  // ── 4. Watchdog de fallos ────────────────────────────────────────────────
  if (fallosConsecutivos >= MAX_FALLOS) {
    Serial.println("[FATAL] Demasiados fallos HTTP. Reiniciando ESP32...");
    delay(1000);
    ESP.restart();
  }
}
