# Keep-Alive — Render + Supabase (plan gratuito)

## Por qué es necesario

- **Render (free tier)**: pausa el servidor tras 15 minutos de inactividad. El primer request tarda ~30s en despertar.
- **Supabase (free tier)**: pausa la DB tras 7 días sin actividad (desde Jun 2024 es 7 días).
- **Solución**: dos capas de keep-alive que se complementan.

---

## Capa 1 — Self-ping interno (ya implementado)

El servidor se llama a sí mismo en `GET /api/ping` cada 10 minutos cuando `NODE_ENV=production`.

- Se activa automáticamente al iniciar en Render.
- Hace `SELECT 1` a Supabase para mantener la DB activa.
- Loguea `🏓 Self-ping OK` en los logs de Render (visible en Dashboard → Logs).

**Variable de entorno requerida en Render:**
```
NODE_ENV=production
```
Render inyecta `RENDER_EXTERNAL_URL` automáticamente (ej: `https://porteria-backend.onrender.com`).

---

## Capa 2 — Cron externo con cron-job.org (recomendado)

El self-ping solo funciona mientras el servidor esté despierto. Si Render ya lo durmió, el self-ping no puede ejecutarse. El cron externo lo despierta desde afuera.

### Pasos para configurar cron-job.org

1. Entrar a [cron-job.org](https://cron-job.org) y crear cuenta gratuita.
2. Ir a **Cronjobs → Create cronjob**.
3. Completar:
   - **Title**: `Porteria Keep-Alive`
   - **URL**: `https://porteria-backend.onrender.com/api/ping`
   - **Schedule**: cada 10 minutos → seleccionar "Every 10 minutes"
   - **Method**: GET
4. Guardar. El estado debe quedar en **Active**.
5. Verificar en la pestaña **History** que devuelva HTTP 200.

---

## Cómo funciona la combinación

```
cron-job.org (cada 10 min)
    │
    └─► GET /api/ping  ←── despierta Render si estaba dormido
            │
            └─► SELECT 1  ←── mantiene Supabase activo
                    │
                    └─► 🏓 Self-ping OK (log en Render)
```

- Si Render está activo: el self-ping interno mantiene todo vivo.
- Si Render se durmió: cron-job.org lo despierta cada 10 minutos máximo.
- Resultado: el servidor nunca está dormido más de 10 minutos.

---

## Verificar que funciona

```bash
curl https://porteria-backend.onrender.com/api/ping
# Respuesta esperada:
# { "ok": true, "timestamp": "2026-04-22T...", "db": "connected" }
```

En los logs de Render debería verse:
```
🏓 Ping OK — 2026-04-22T14:30:00.000Z
🏓 Self-ping OK — 2026-04-22T14:40:00.000Z
```
