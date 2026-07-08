#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *WIFI_SSID = "adrix";
const char *WIFI_PASSWORD = "hola12345";
const char *ENDPOINT_URL =
    "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData";
const char *DEVICE_ID = "esp32-sensor-01"; // ID registrado en Firestore
const char *DEVICE_TOKEN = "tu-token-secreto"; // Token de autenticación del dispositivo

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Cliente seguro global para evitar fragmentación de memoria y fugas de sockets
WiFiClientSecure client;

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

  // Configurar cliente seguro global
  client.setInsecure(); // No verificar el certificado SSL
}

void loop() {
  // Asegurar que estamos conectados a WiFi antes de intentar enviar
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
    HTTPClient http;
    
    // Iniciamos la conexión pasando el cliente seguro global
    if (http.begin(client, ENDPOINT_URL)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Token", DEVICE_TOKEN); // Cabecera de autenticación
      http.addHeader("Connection", "close"); // Solicitar cerrar la conexión TCP después de la respuesta

      // Payload JSON con el ID del dispositivo y las variables medidas
      String jsonPayload = "{\"deviceId\":\"" + String(DEVICE_ID) +
                           "\",\"variables\":{\"temperature\":" + String(t) +
                           ",\"humidity\":" + String(h) + "}}";

      int code = http.POST(jsonPayload);
      if (code < 0) {
        Serial.printf("Error de conexión (%d): %s | Heap libre: %d bytes\n", 
                      code, http.errorToString(code).c_str(), ESP.getFreeHeap());
      } else {
        Serial.printf("Respuesta: %d | Temp: %.1f, Hum: %.1f | Heap libre: %d bytes\n", 
                      code, t, h, ESP.getFreeHeap());
      }
      http.end(); // Esto cierra la conexión y libera los recursos del HTTPClient
    } else {
      Serial.println("[HTTP] No se pudo inicializar la conexión");
    }
  } else {
    Serial.println("[DHT] Error al leer el sensor");
  }
  Serial.println("Esperando 3 minutos (180000 ms) para la siguiente lectura...");
  delay(180000);
}
