# Med-IoT — Documentación del Proyecto

> **Stack:** Next.js 16 · Firebase (Auth + Firestore + Cloud Functions) · Vercel · ESP32  
> **Diseño:** Cyberpunk / Neon (modo oscuro, acentos cian/verde/magenta)

---

## 🚦 ESTADO ACTUAL — 24 Jun 2026

| Componente | Estado | Detalle |
|---|---|---|
| 🖥️ Frontend Next.js | ✅ Listo | Corriendo en `localhost:3000` |
| 🎨 Sistema de diseño | ✅ Listo | Cyberpunk/Neon, 4 páginas completas |
| 🔐 Google Auth | ✅ Listo | Falta conectar credenciales Firebase |
| 🗄️ Firestore listeners | ✅ Listo | Tabla y dashboard en tiempo real |
| ⚡ Cloud Functions | ✅ Código listo | **Pendiente: deploy** |
| 🔑 `.env.local` | ⚠️ Creado (Valores Mock) | **Pendiente: reemplazar con credenciales reales** |
| 📡 ESP32 / Sketch | ✅ Listo | Pendiente: URL del endpoint |
| 🐍 Simulador Python | ✅ Listo | Pendiente: URL del endpoint |
| ☁️ Deploy Vercel | ⏳ Pendiente | Requiere `.env.local` completo |
| 🔥 Deploy Functions | ⏳ Pendiente | Primer paso antes de Vercel |

### 🔴 Próxima acción requerida

1. Crear proyecto en **Firebase Console** y habilitar Firestore + Google Auth.
2. Copiar las credenciales web obtenidas en el archivo `med-iot-web/.env.local`.
3. Iniciar sesión en la CLI con `npx firebase login`.
4. Ejecutar `npx firebase deploy --only functions` para desplegar las Cloud Functions y obtener la URL del endpoint.
5. Configurar el endpoint en `simulator.py` y `med_iot_esp32.ino`.

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
- [ ] Alertas configurables si variable supera umbral
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
│   ├── med_iot_esp32.ino             # Sketch Arduino (DHT22 + HTTPS POST)
│   └── simulator.py                  # Simulador datos ficticios (Python)
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
