#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *WIFI_SSID = "R-ISTDAB-DOCENTES-2.4G";
const char *WIFI_PASSWORD = "ID0centes/2025";
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
  // 1. Verificación rápida de WiFi
  if (WiFi.status() != WL_CONNECTED) {
    ESP.restart(); // Si pierde WiFi, es más limpio reiniciar el stack de red
  }

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    // Definir cliente dentro del alcance local pero asegurando limpieza
    WiFiClientSecure *client = new WiFiClientSecure;
    client->setInsecure();

    HTTPClient http;

    // Usar timeout para que no se quede colgado
    http.setTimeout(5000);

    if (http.begin(*client, ENDPOINT_URL)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Token", DEVICE_TOKEN);
      http.addHeader("Connection",
                     "close"); // IMPORTANTE: cerrar la conexión tras el POST

      String jsonPayload = "{\"deviceId\":\"" + String(DEVICE_ID) +
                           "\",\"variables\":{\"temperature\":" + String(t) +
                           ",\"humidity\":" + String(h) + "}}";

      int code = http.POST(jsonPayload);

      if (code > 0) {
        fallosConsecutivos = 0;
        Serial.printf("Respuesta: %d | Temp: %.1f, Hum: %.1f\n", code, t, h);
      } else {
        fallosConsecutivos++;
        Serial.printf("Error HTTP: %s\n", http.errorToString(code).c_str());
      }
      http.end(); // Libera el recurso HTTP
    }

    delete client; // Libera la memoria del cliente SSL explícitamente
  } else {
    Serial.println("[DHT] Error al leer el sensor");
  }

  // Si llegamos a los fallos máximos, reinicio de hardware
  if (fallosConsecutivos >= MAX_FALLOS_ANTES_DE_REINICIAR) {
    ESP.restart();
  }

  delay(10000); // 10 seg
}
