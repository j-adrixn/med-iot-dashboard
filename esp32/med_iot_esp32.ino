/* * MED-IoT ESP32 - Sketch Principal
 * Envía lecturas de temperatura y humedad a Firebase
 * mediante HTTPS POST.
 */

#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

// ---------------- CONFIGURACIÓN ----------------
const char *WIFI_SSID = "Celerity_Maldonado_ext";
const char *WIFI_PASSWORD = "M@ldon@do/1962";

// Tu URL de la Cloud Function
const char *ENDPOINT_URL =
    "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData";
const char *DEVICE_TOKEN =
    "tu-token-secreto"; // El mismo que usaste en Firebase

// Configuración del Sensor
#define DHTPIN 4
#define DHTTYPE DHT11 // Cambia a DHT22 si tu sensor es el blanco
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi conectado");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
      Serial.println("[ERROR] Falla al leer el sensor DHT!");
      delay(2000);
      return;
    }

    Serial.printf("[SENSOR] Temp: %.1f°C | Hum: %.1f%%\n", t, h);

    HTTPClient http;
    http.begin(ENDPOINT_URL);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{";
    jsonPayload += "\"deviceToken\":\"" + String(DEVICE_TOKEN) + "\",";
    jsonPayload += "\"temp\":" + String(t) + ",";
    jsonPayload += "\"hum\":" + String(h);
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.printf("[TX] HTTP %d \n", httpResponseCode);
    } else {
      Serial.printf("[ERROR] Fallo en el envío: %s\n",
                    http.errorToString(httpResponseCode).c_str());
    }

    http.end();
  } else {
    WiFi.reconnect();
  }

  delay(5000); // 5 segundos entre lecturas
}
