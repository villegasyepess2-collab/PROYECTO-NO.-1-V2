# Meeting Task Extraction Platform (V1)

Internal web app for meeting task extraction and follow-up.

## Current status
- ✅ Fase 1: documentación + estructura base alineadas.
- ✅ Fase 2: Teams transcript demo local desde `/meetings` (PoC, sin servicios externos).
- ✅ Fase 3: grabación presencial demo local desde `/meetings` (PoC, sin micrófono obligatorio).
- ⏳ Fase 4+ quedan en avance controlado por orden oficial.

## Official build order (strict)
1. documentación y estructura base app
2. Teams transcript
3. grabación presencial
4. extracción IA
5. validación
6. Graph chatMessage
7. recordatorios y pruebas

## Key APIs
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`
- Demo (Phase 2): `POST /api/demo/seed-teams`
- Demo (Phase 3): `POST /api/demo/seed-inperson`
- Ingestion: `POST /api/meetings/teams/ingest`, `POST /api/meetings/inperson/upload`
- Extraction: `POST /api/extraction/run`
- Review: `GET /api/reviews`, `POST /api/reviews/{candidateId}/approve|edit|reject`
- Tasks: `POST /api/tasks/{taskId}/status`
- Reminders: `POST /api/reminders/run`

## Runtime dependencies
- PocketBase
- Microsoft Graph token (`MS_GRAPH_TOKEN`) with access to Teams chatMessage APIs
- faster-whisper CLI
- Ollama local server

## PoC local demo (sin auth real)
Para desbloquear la demo local sin credenciales reales de PocketBase:
1. Ejecuta `npm run dev`.
2. Abre `/login`.
3. Haz clic en **Start local demo**.
4. En `/meetings` haz clic en **Load Teams demo transcript**.
5. En el bloque **In-person Recording Flow**, haz clic en **Load in-person demo recording**.
6. Verifica IDs de `meetingId` y `transcriptId` creados (quedan listos para fase de extracción).

**Limitación:** este bypass solo es para PoC local (demo/validación) y no representa el diseño final del MVP.

**Reversión para MVP:** desactivar `POC_DEMO_AUTH_BYPASS` (o ejecutar en `NODE_ENV=production`) para volver al flujo real de autenticación con PocketBase.

### Qué queda simulado en PoC demo
- Ingesta Teams y flujo presencial sin Graph/PocketBase/faster-whisper/Ollama reales.
- Cola de review y task lifecycle sobre almacenamiento en memoria local (se reinicia al reiniciar `npm run dev`).
- Notificaciones y reminders como ejecución simulada.

## Run
1. `npm install`
2. configure env vars
3. `npm run dev`
4. `npm test`
