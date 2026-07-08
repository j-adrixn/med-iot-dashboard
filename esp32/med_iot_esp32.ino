#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

const char *WIFI_SSID = "Celerity_Maldonado_ext";
const char *WIFI_PASSWORD = "M@ldon@do/1962";
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
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (!isnan(h) && !isnan(t)) {
    HTTPClient http;
    http.begin(ENDPOINT_URL);
    http.addHeader("Content-Type", "application/json");

    // ESTRUCTURA RIGUROSA PARA EVITAR EL ERROR 400
    // Estamos enviando un objeto 'variables' que contiene 'temperature' y
    // 'humidity'
    String jsonPayload = "{\"deviceToken\":\"" + String(DEVICE_TOKEN) +
                         "\",\"variables\":{\"temperature\":" + String(t) +
                         ",\"humidity\":" + String(h) + "}}";

    int code = http.POST(jsonPayload);
    Serial.printf("Respuesta: %d | Temp: %.1f, Hum: %.1f\n", code, t, h);
    http.end();
  }
  delay(5000);
}
