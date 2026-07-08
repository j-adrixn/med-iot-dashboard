#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *WIFI_SSID = "adrix";
const char *WIFI_PASSWORD = "hola12345";
const char *ENDPOINT_URL =
    "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData";
const char *DEVICE_ID = "esp32-sensor-01";
const char *DEVICE_TOKEN = "tu-token-secreto";

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Contador de fallos consecutivos para el reinicio de seguridad
int fallosConsecutivos = 0;
const int MAX_FALLOS_ANTES_DE_REINICIAR = 5;

void setup() {
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi conectado");
  Serial.print("IP asignada: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Conexión perdida. Reconectando...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(2000);
    return;
  }

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    WiFiClientSecure client;
    client.setInsecure();
    // Buffers reducidos: por defecto BearSSL pide ~16KB RX + 16KB TX,
    // lo cual falla si el heap está fragmentado aunque haya espacio "libre" de
    // sobra
    client.setBufferSizes(1024, 512);

    HTTPClient http;

    if (http.begin(client, ENDPOINT_URL)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Token", DEVICE_TOKEN);
      http.addHeader("Connection", "close");

      String jsonPayload = "{\"deviceId\":\"" + String(DEVICE_ID) +
                           "\",\"variables\":{\"temperature\":" + String(t) +
                           ",\"humidity\":" + String(h) + "}}";

      int code = http.POST(jsonPayload);

      if (code < 0) {
        fallosConsecutivos++;
        Serial.printf("Error de conexión (%d): %s | Heap libre: %d | Bloque "
                      "max: %d | Fallos seguidos: %d\n",
                      code, http.errorToString(code).c_str(), ESP.getFreeHeap(),
                      ESP.getMaxAllocHeap(), fallosConsecutivos);
      } else {
        fallosConsecutivos = 0; // se resetea con cualquier éxito
        Serial.printf("Respuesta: %d | Temp: %.1f, Hum: %.1f | Heap libre: %d "
                      "| Bloque max: %d\n",
                      code, t, h, ESP.getFreeHeap(), ESP.getMaxAllocHeap());
      }
      http.end();
    } else {
      fallosConsecutivos++;
      Serial.println("[HTTP] No se pudo inicializar la conexión");
    }

    client.stop();
  } else {
    Serial.println("[DHT] Error al leer el sensor");
  }

  // Red de seguridad: si el heap ya no se recupera, reiniciar antes de quedar
  // en loop muerto
  if (fallosConsecutivos >= MAX_FALLOS_ANTES_DE_REINICIAR) {
    Serial.println(
        "[FATAL] Demasiados fallos consecutivos. Reiniciando ESP32...");
    delay(1000);
    ESP.restart();
  }

  Serial.println("Esperando 1 minuto (60000 ms) para la siguiente lectura...");
  delay(60000);
}
