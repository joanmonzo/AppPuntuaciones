# Clasificación — Frontend React

Tabla de clasificación en tiempo real conectada a Google Apps Script.

## Requisitos

- Node.js 18+
- npm o pnpm

## Arrancar en desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Build para producción

```bash
npm run build
```

Los archivos estáticos quedan en `/dist`. Sirve esa carpeta con cualquier servidor (Nginx, Vercel, Netlify, GitHub Pages…).

## Configuración

En `src/App.jsx` hay dos constantes al principio del archivo:

```js
const API_URL = "https://script.google...";  // URL del Apps Script
const POLL_INTERVAL = 5000;                  // Intervalo de polling en ms
```

Cambia `API_URL` si la URL del script cambia, y ajusta `POLL_INTERVAL` (mínimo recomendado: 3000 ms para no saturar la cuota de Google).

## Estructura de datos esperada

El endpoint debe devolver un array JSON con esta forma:

```json
[
  { "Jugador": "Nombre", "1": 84, "2": 36, ..., "18": 86, "TOTAL": 906 },
  ...
]
```

- Las claves numéricas (`"1"` a `"18"`) son las rondas.
- `"Jugador"` es el nombre del jugador.
- `"TOTAL"` es la puntuación total (el frontend lo usa para ordenar).

## CORS

El Apps Script debe devolver los headers CORS adecuados para que el navegador acepte la respuesta.
En el script de tu compañero, asegúrate de que el `doGet` incluye:

```js
return ContentService
  .createTextOutput(JSON.stringify(data))
  .setMimeType(ContentService.MimeType.JSON);
```

Y que el script está desplegado como "Accessible by anyone".
