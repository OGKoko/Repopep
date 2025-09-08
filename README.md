# Unity Cloud Save Proxy (Express)

Proxy mínimo para listar archivos de Unity Cloud Save (por jugador) y generar URLs de descarga temporales.
Pensado para ser consumido por una web WordPress sin exponer tus credenciales de Unity.

## Variables de entorno (obligatorias)
- `UCS_PROJECT_ID`: ID de tu proyecto en Unity
- `UCS_KEY_ID`: Service Account Key ID (Unity Dashboard → Administration → Service Accounts)
- `UCS_SECRET_KEY`: Service Account Secret

## Comandos
```bash
npm install
npm start
```

Se inicia en `http://localhost:3000` (o el puerto que marque `PORT`).

## Endpoints
- `GET /files?playerId=...` → Lista de archivos del jugador.
- `GET /files/url?playerId=...&file=...` → Genera URL de descarga temporal.
- `POST /link/create` (body: `{ "playerId": "..." }`) → Crea un código de 6 dígitos.
- `POST /link/resolve` (body: `{ "code": "123456" }`) → Devuelve `{ "playerId": "..." }` para vincular en WordPress.

## Notas
- Este servidor mantiene los códigos de vinculación **en memoria** (solo para pruebas). En producción usa Redis/DB.
- Ajusta `BASE` si tu documentación de Unity indica un host distinto para Cloud Save.
