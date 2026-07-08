#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

const char *WIFI_SSID = "Celerity_Maldonado_ext";
const char *WIFI_PASSWORD = "M@ldon@do/1962";

// URL de tu Cloud Function
const char *ENDPOINT_URL =
    "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData";
const char *DEVICE_TOKEN = "tu-token-secreto";

#define DHTPIN 4
#define DHTTYPE DHT11
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

    if (!isnan(h) && !isnan(t)) {
      HTTPClient http;
      http.begin(ENDPOINT_URL);
      http.addHeader("Content-Type", "application/json");

      // ESTRUCTURA CORREGIDA: Ajustada a lo que Firestore espera
      String jsonPayload = "{\"deviceToken\":\"tu-token-secreto\","
                           "\"variables\":{\"temperature\":" +
                           String(t) + ",\"humidity\":" + String(h) + "}}";

      int httpResponseCode = http.POST(jsonPayload);

      Serial.printf("[TX] HTTP %d | Temp: %.1f, Hum: %.1f\n", httpResponseCode,
                    t, h);
      http.end();
    } else {
      Serial.println("[ERROR] Lectura fallida del sensor");
    }
  } else {
    WiFi.reconnect();
  }
  delay(5000);
}
