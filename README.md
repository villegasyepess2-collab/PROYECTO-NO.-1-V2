# Meeting Task Extraction Platform (V1)

Internal web app for meeting task extraction and follow-up.

## Current status
- ✅ Phase 1-5 complete.
- ✅ Phase 6 complete: manual review queue with approve/edit/reject actions.
- ✅ Phase 7 complete: final task creation and Graph `chatMessage` notifications.
- ✅ Phase 8 complete: task status flow, reminder scheduler, overdue logic, delivery attempts, audit/status history hooks.

## Key APIs
- Auth: `POST /api/auth/login`, `POST /api/auth/logout`
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
4. En `/meetings` haz clic en **Load demo scenario**.
5. Navega a `/review` para aprobar/rechazar candidatos.
6. Navega a `/tasks` para operar tareas existentes y correr reminders simulados.

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
