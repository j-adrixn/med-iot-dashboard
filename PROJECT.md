# Med-IoT — Documentación del Proyecto

> **Stack:** Next.js 16 · Firebase (Auth + Firestore + Cloud Functions) · Vercel · ESP32  
> **Diseño:** Cyberpunk / Neon (modo oscuro, acentos cian/verde/magenta)

---

## 🚦 ESTADO ACTUAL — 21 Jul 2026

| Componente | Estado | Detalle |
|---|---|---|
| 🖥️ Frontend Next.js | ✅ Listo | Código compilado sin errores con `npm run build` |
| 🎨 Sistema de diseño | ✅ Listo | Cyberpunk/Neon, 4 páginas completas |
| 🔐 Google Auth | ✅ Listo | Funcional (pendiente autorizar dominio Vercel en Firebase) |
| 🗄️ Firestore listeners | ✅ Listo | Tabla y dashboard en tiempo real |
| ⚡ Cloud Functions | ✅ Listo | Desplegado y verificado (permisos públicos activos) |
| 🔑 `.env.local` | ✅ Listo | Configurado con credenciales de Firebase de producción |
| 📡 ESP32 / Sketch | ✅ Listo | Optimizado y reubicado. Conexión HTTPS estable, intervalo de 3 min |
| 🐍 Simulador Python | ✅ Listo | Restaurado y funcional (`py esp32/simulator.py`) |
| ☁️ Deploy Vercel | ✅ Listo | Cuenta creada, GitHub asociado y dashboard configurado |
| 🔥 Deploy Functions | ✅ Listo | Despliegue de funciones y alertas de Telegram activo con éxito |
| 📢 Alertas Telegram | ✅ Listo | Integradas en backend y frontend con umbral configurable |

### 🔴 Próxima acción requerida

1. **Autorizar Dominio en Firebase (Si no se ha hecho):** Agregar el dominio asignado por Vercel (ej. `tu-proyecto.vercel.app`) en la lista de dominios autorizados de Firebase Console (Authentication -> Settings -> Authorized domains).

---

## 📋 CHANGELOG

### [2026-06-23] — Configuración del Entorno de Trabajo y Dependencias
#### Ejecutado
- Copiado del código base desde `Med-IoT` al espacio de trabajo activo `IoT-Proyecto`.
- Instalación exitosa de dependencias de Next.js en `/med-iot-web` y Firebase Functions en `/firebase-functions`.
- Creación de plantilla `.env.local` con credenciales de Firebase simuladas y configurada para desarrollo.
- Añadida configuración de puertos para `emulators` y archivo `firestore.indexes.json` para orden del proyecto.
- Vinculado flujo de desarrollo directo a Firebase Cloud (debido a falta de JRE local para el emulador de Firestore).

### [2026-06-10] — Sesión inicial de desarrollo

#### Ejecutado
- Proyecto Next.js 16 creado con App Router, TypeScript, Tailwind CSS
- Instaladas dependencias: `firebase`, `recharts`, `lucide-react`
- Creado sistema de diseño Cyberpunk/Neon completo en `globals.css`
- Implementadas las 4 páginas: Landing `/`, Login `/login`, Variables `/data`, Dashboard `/dashboard`
- Creado `AuthContext.tsx` para sesión global con Google
- Creado `Navbar.tsx` responsivo con estado de auth
- Creado `firebase-functions/index.js` → función `postDeviceData` con validación de token
- Creado `firestore.rules` con seguridad (solo auth puede leer, solo backend escribe)
- Creado sketch ESP32 `med_iot_esp32.ino` (DHT22 + WiFi + HTTPS POST)
- Creado simulador Python `simulator.py` con datos senoidales realistas

#### Bugs corregidos
- ❌ → ✅ CSS: `@import` de Google Fonts movido antes de `@import "tailwindcss"` (error de parsing)
- ❌ → ✅ Runtime: `'use client'` agregado a `page.tsx` (event handlers en Server Component)

#### Estado al cerrar sesión
- Servidor de desarrollo corriendo en `http://localhost:3000`
- Páginas cargando correctamente (sin credenciales Firebase aún)
- **Sin deploy realizado** — todo es local

---

## ⏳ PENDIENTES

### 🔴 Alta prioridad — Necesario para producción

- [ ] **Llenar `.env.local`** con credenciales de Firebase
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
  NEXT_PUBLIC_FIREBASE_APP_ID=...
  ```
  → Obtener en: [console.firebase.google.com](https://console.firebase.google.com) → Configuración → Web App

- [ ] **Registrar dispositivo en Firestore** (colección `devices`, doc `esp32-sensor-01`)
  ```json
  { "deviceId": "esp32-sensor-01", "name": "ESP32 Principal", "token": "tu-token-secreto" }
  ```

- [ ] **Deploy Cloud Functions**
  ```bash
  npm install -g firebase-tools
  firebase login && firebase use <project-id>
  cd firebase-functions && npm install && cd ..
  firebase deploy --only functions
  ```
  → Anotar la URL: `https://us-central1-<project>.cloudfunctions.net/postDeviceData`

- [ ] **Actualizar endpoint en `simulator.py` y `med_iot_esp32.ino`** con la URL del paso anterior

- [ ] **Deploy Vercel**
  ```bash
  cd med-iot-web && npx vercel --prod
  ```
  → Agregar variables de entorno en dashboard de Vercel

- [ ] **Agregar dominio Vercel en Firebase Auth** → Authorized Domains

### 🟡 Media prioridad — Mejoras funcionales

- [ ] Página de gestión de dispositivos (agregar/ver/eliminar desde la UI)
- [ ] Filtros de fecha en tabla `/data`
- [ ] Selector de dispositivo en dashboard (cuando haya múltiples ESP32)
- [x] Alertas configurables si variable supera umbral
- [ ] Protección de rutas con middleware de Next.js (`middleware.ts`)
- [ ] Página de perfil de usuario

### 🟢 Baja prioridad — Mejoras visuales/UX

- [ ] Animaciones de transición entre páginas
- [ ] Widget de `lastSeen` del dispositivo (cuándo fue la última lectura)
- [ ] Gráfica tipo gauge/velocímetro para temperatura
- [ ] Modo pantalla completa para el dashboard
- [ ] PWA (instalar como app en móvil)

---

## 🗂️ Estructura del Repositorio

```
Med-IoT/
│
├── med-iot-web/                  ← Frontend Next.js (deploy → Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css           # Sistema de diseño Cyberpunk/Neon
│   │   │   ├── layout.tsx            # Layout raíz (AuthProvider + Navbar)
│   │   │   ├── page.tsx              # Landing Page (/)          [use client]
│   │   │   ├── login/page.tsx        # Login con Google (/login) [use client]
│   │   │   ├── data/page.tsx         # Tabla tiempo real (/data) [use client]
│   │   │   └── dashboard/page.tsx    # Dashboard gráficas (/dashboard) [use client]
│   │   ├── components/
│   │   │   └── Navbar.tsx            # Nav responsivo            [use client]
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Context Google Auth        [use client]
│   │   └── lib/
│   │       └── firebase.ts           # Init Firebase SDK
│   ├── .env.local                    # ⚠️ Credenciales (NO a git)
│   └── package.json
│
├── firebase-functions/           ← Backend (deploy → Firebase)
│   ├── index.js                      # postDeviceData (Node.js)
│   └── package.json
│
├── esp32/
│   ├── med_iot_esp32/
│   │   └── med_iot_esp32.ino             # Sketch Arduino (DHT11 + WiFi + HTTPS POST)
│   └── simulator.py                      # Simulador datos ficticios (Python)
│
├── firebase.json                 ← Config Firebase CLI
├── firestore.rules               ← Reglas de seguridad
└── PROJECT.md                    ← Este archivo
```

---

## ⚡ Comandos Rápidos

```bash
# Dev local
cd med-iot-web && npm run dev            # → http://localhost:3000

# Emulador Firebase local
firebase emulators:start --only functions,firestore

# Simulador ESP32
pip install requests
python esp32/simulator.py

# Deploy
firebase deploy --only functions         # Backend
cd med-iot-web && npx vercel --prod      # Frontend
```

---

## 🗃️ Modelo de Datos (Firestore)

### `readings/{id}`
```json
{
  "deviceId": "esp32-sensor-01",
  "timestamp": "<serverTimestamp>",
  "variables": { "temperature": 25.4, "humidity": 58.2, "voltage": 3.3 }
}
```

### `devices/{deviceId}`
```json
{
  "deviceId": "esp32-sensor-01",
  "name": "ESP32 Principal",
  "token": "secreto",
  "lastSeen": "<Timestamp>",
  "createdAt": "<Timestamp>"
}
```

---

## 🌐 API Cloud Function

```
POST https://us-central1-<proyecto>.cloudfunctions.net/postDeviceData
Headers: Content-Type: application/json | X-Device-Token: <token>
Body:    { "deviceId": "esp32-sensor-01", "variables": { "temperature": 25.4 } }
→ 201:   { "success": true, "readingId": "abc..." }
```

---

## 📦 Dependencias Clave

| Paquete | Uso |
|---|---|
| `next@16` | Framework frontend |
| `firebase@12` | Auth + Firestore client |
| `recharts@3` | Gráficas interactivas |
| `lucide-react` | Iconos |
| `firebase-admin@12` | Admin SDK (Cloud Functions) |
| `firebase-functions@4` | Cloud Functions SDK |
| `cors@2` | CORS en Cloud Functions |

---

## ⚠️ Notas Importantes

- `.env.local` **nunca** va a Git (ya en `.gitignore`)
- Firestore: escritura solo desde backend (Cloud Function). Para pruebas directas en consola Firebase, cambiar reglas temporalmente
- Las variables del dashboard son **dinámicas**: detecta automáticamente los keys en `variables` — no hay que hardcodear nombres de sensores
- Todas las páginas de datos (`/data`, `/dashboard`) redirigen a `/login` si no hay sesión activa

---

## 📝 REGISTRO DE SESIONES Y CAMBIOS (LOGS)

### 📅 Sesión: 23 Jun 2026
- **Acción**: Copiado del código base del prototipo (`C:\Users\adrix\Med-IoT`) al workspace actual (`C:\Users\adrix\IoT-Proyecto`).
- **Acción**: Instalación exitosa de dependencias del Frontend (`npm install` en `/med-iot-web`).
- **Acción**: Instalación exitosa de dependencias del Backend (`npm install` en `/firebase-functions`).
- **Acción**: Configuración del archivo `med-iot-web/.env.local` con credenciales de Firebase simuladas.
- **Acción**: Cambio en la estrategia de pruebas: se deshabilitó el emulador local (`NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` en `.env.local` y actualización en `firebase.ts`) debido a la falta de Java (JRE) en la máquina del usuario. Se procedió a configurar la conexión directa a la nube.
- **Acción**: Añadido bloque `emulators` en `firebase.json` y creado `firestore.indexes.json` para consistencia del proyecto.
- **Acción**: Ejecución en segundo plano del servidor local de desarrollo (`npm run dev`) corriendo correctamente en `http://localhost:3000` bajo Turbopack.
- **Estado de la sesión**: Servidor frontend operativo. Pendiente configuración de credenciales de Firebase reales del usuario en `.env.local` para iniciar vinculación de base de datos y Cloud Functions.

### 📅 Sesión: 24 Jun 2026
- **Acción**: Re-formateado del archivo `med-iot-web/.env.local` para usar la sintaxis estándar `KEY=VALUE` requerida por Next.js en lugar del bloque de código JavaScript nativo.
- **Acción**: Eliminado el paso de `predeploy` (lint) de `firebase.json` al no contar con un script de linter configurado en functions, solucionando el fallo en el inicio del despliegue.
- **Acción**: Actualizada la versión del runtime de Node.js de 18 a 22 en `firebase-functions/package.json` para resolver la restricción de obsolescencia impuesta por Google Cloud.
- **Acción**: Despliegue exitoso del backend (Cloud Function `postDeviceData` en Node 22, reglas de seguridad `firestore.rules` e índices) tras la activación del plan Blaze por parte del usuario.
- **Acción**: Configuración del endpoint de producción `https://us-central1-med-iot-pastillero.cloudfunctions.net/postDeviceData` en los archivos `esp32/simulator.py` y `esp32/med_iot_esp32.ino`.
- **Acción**: Instalación del módulo `requests` en el entorno Python local y modificación de `simulator.py` para reemplazar los caracteres emoji de consola por texto plano ASCII, evitando el fallo de codificación de terminal `UnicodeEncodeError` en Windows.
- **Detección de Error**: El simulador de ESP32 arrojó un error `403 Forbidden` al intentar postear datos. Se identificó que la Cloud Function se desplegó por defecto en modo privado, restringiendo las llamadas externas que no estén autenticadas mediante OAuth de Google.
- **Estado de la sesión**: Backend y Frontend conectados con credenciales reales. Pendiente otorgar permisos públicos a la función `postDeviceData` en Google Cloud IAM para permitir que el ESP32 envíe datos, y validar el flujo completo.

### 📅 Sesión: 08 Jul 2026
- **Acción**: Validación de la compilación de Next.js (`npm run build`) para verificar la consistencia del frontend antes del despliegue de Vercel. Todo compiló correctamente.
- **Acción**: Validación del endpoint de producción `postDeviceData`. Mediante pruebas con una llamada POST simulada por script, se confirmó que la función responde con éxito `201 Created` y guarda los datos en Firestore (lo que indica que la Cloud Function es pública y el dispositivo `esp32-sensor-01` está bien registrado).
- **Acción**: Restauración del archivo simulador `esp32/simulator.py` desde el historial de Git para habilitar las pruebas locales rápidas usando el comando `py esp32/simulator.py`.
- **Acción**: Corrección del sketch del ESP32 en su nueva ruta de proyecto `esp32/med_iot_esp32/med_iot_esp32.ino`. Se corrigieron desajustes de los parámetros HTTP (enviando el token secreto en la cabecera `X-Device-Token` y el ID de dispositivo en el JSON).
- **Acción**: Resolución de los fallos de desconexión `connection refused` (-1) en el ESP32 mediante la declaración de un cliente seguro global (`WiFiClientSecure`), la inclusión de la cabecera `Connection: close` y la llamada explícita a `client.stop()` tras el envío, permitiendo que la memoria SSL se libere.
- **Acción**: Configuración del intervalo de envío del ESP32 a 3 minutos (180,000 ms) para prevenir picos de consumo de corriente durante el handshake de HTTPS que causaban caídas de tensión (brownout) y reinicios del microcontrolador.
- **Estado de la sesión**: El backend funciona y está completamente conectado al ESP32. El usuario completó la vinculación de GitHub y Vercel. Pendiente: configurar las variables de entorno de Firebase en el panel de Vercel y registrar el dominio asignado por Vercel en la consola de Firebase Authentication.

### 📅 Sesión: 21 Jul 2026
- **Acción**: Implementación del sistema de Alertas de Telegram tanto en Backend como en Frontend.
- **Acción**: Adición de constantes y la función helper `enviarAlertaTelegram` en `firebase-functions/index.js` usando `fetch` nativo de Node.js, evaluando si el sensor supera el umbral configurado.
- **Acción**: Implementación de la bandera booleana `alertaEnviada` en la base de datos Firestore (documento del dispositivo) para evitar el spam de alertas en Telegram, reseteando la bandera automáticamente cuando el valor cae bajo el umbral.
- **Acción**: Integración del panel interactivo de Alertas en `med-iot-web/src/app/dashboard/page.tsx`, con un slider de rango cyberpunk y badge visual parpadeante para indicar estados críticos.
- **Acción**: Persistencia del umbral crítico usando `localStorage` en el navegador del usuario.
- **Acción**: Configuración directa de las credenciales de Telegram del usuario (Token: `8837151012:AAEtUX7RSP_QrxlcfD-BErsuEj1nOpZ0OME` y Chat ID: `8986965123`) aportadas por capturas de pantalla en ambos entornos.
- **Corrección de Error**: El despliegue de las Cloud Functions arrojó inicialmente el fallo `admin.firestore is not a function`. Se corrigió migrando a la sintaxis moderna `getFirestore` de `firebase-admin/firestore`.
- **Corrección de Error**: El despliegue intentó actualizar la Cloud Function a 2ª Generación por defecto al actualizar las dependencias a la última versión (v6/v7), arrojando el error `Upgrading from 1st Gen to 2nd Gen is not yet supported`. Se solucionó degradando la SDK local a la versión `5.x`, forzando el despliegue correcto como 1ª Generación en Node.js 22.
- **Estado de la sesión**: Alertas de Telegram operativas al 100%. Código compilado exitosamente y desplegado tanto en Firebase Cloud Functions como en GitHub/Vercel (mediante push automático).
