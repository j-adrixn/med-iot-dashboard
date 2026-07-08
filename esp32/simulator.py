#!/usr/bin/env python3
"""
=====================================================
  Med-IoT Simulador de ESP32
  Envía lecturas ficticias al endpoint de Cloud Functions
  para pruebas de desarrollo sin hardware real.
=====================================================
  Requisitos:
    pip install requests

  Uso:
    python simulator.py
=====================================================
"""

import requests
import json
import time
import random
import math
from datetime import datetime

# ── Configuración ──────────────────────────────────
ENDPOINT_URL  = "https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData"
DEVICE_ID     = "esp32-sensor-01"
DEVICE_TOKEN  = "tu-token-secreto"
INTERVAL_SECS = 5   # Enviar cada 5 segundos

# Para pruebas locales con el emulador de Firebase, usa:
# ENDPOINT_URL = "http://localhost:5001/TU-PROYECTO/us-central1/postDeviceData"

def get_simulated_readings(t: float) -> dict:
    """Genera lecturas simuladas con variación senoidal realista."""
    return {
        "temperature": round(22.0 + 3.0 * math.sin(t / 30) + random.uniform(-0.5, 0.5), 2),
        "humidity":    round(55.0 + 5.0 * math.cos(t / 25) + random.uniform(-1.0, 1.0), 2),
        "voltage":     round(3.30 + random.uniform(-0.05, 0.05), 3),
        "light":       round(max(0, 500 + 200 * math.sin(t / 20) + random.uniform(-20, 20))),
    }

def send_reading(variables: dict) -> bool:
    payload = {
        "deviceId": DEVICE_ID,
        "variables": variables,
    }
    headers = {
        "Content-Type": "application/json",
        "X-Device-Token": DEVICE_TOKEN,
    }

    try:
        response = requests.post(ENDPOINT_URL, json=payload, headers=headers, timeout=10)
        if response.status_code == 201:
            print(f"  [SUCCESS] OK [{response.status_code}] ID: {response.json().get('readingId', '?')}")
            return True
        else:
            print(f"  [ERROR] [{response.status_code}]: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("  [ERROR] Sin conexion - ¿el endpoint es correcto?")
        return False
    except Exception as e:
        print(f"  [EXCEPT] Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 55)
    print("  MED-IoT Simulador ESP32")
    print(f"  Endpoint: {ENDPOINT_URL}")
    print(f"  Device:   {DEVICE_ID}")
    print(f"  Intervalo: {INTERVAL_SECS}s")
    print("=" * 55)
    print("  Presiona Ctrl+C para detener\n")

    t = 0
    count = 0
    while True:
        count += 1
        ts = datetime.now().strftime("%H:%M:%S")
        variables = get_simulated_readings(t)
        
        print(f"[{ts}] #{count:04d} Enviando: {json.dumps(variables)}")
        send_reading(variables)
        
        t += INTERVAL_SECS
        time.sleep(INTERVAL_SECS)
