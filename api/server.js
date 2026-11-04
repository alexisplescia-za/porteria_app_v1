const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const pool      = require('./db');
const { requireAuth } = require('./auth');
const registros = require('./routes/registros');
const config    = require('./routes/config');
const usuarios  = require('./routes/usuarios');
const backup    = require('./routes/backup');

const app = express();
app.disable('x-powered-by');

// CORS: sólo la web de la app (y localhost para pruebas). Lista separada por comas en CORS_ORIGINS.
// Los pedidos sin Origin (Apps Script del backup, cron del ping) no usan CORS y pasan.
const ORIGENES = (process.env.CORS_ORIGINS || 'https://crf-central-mantenimiento-app.vercel.app,http://localhost:3000')
  .split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ORIGENES.includes(origin)),
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '2mb' }));

// Públicas
app.get('/api/ping', async (req, res) => {
  const ts = new Date().toISOString();
  try {
    await pool.query('SELECT 1 FROM registros LIMIT 1');
    res.json({ ok: true, timestamp: ts, db: 'connected' });
  } catch (err) {
    console.error(`Ping DB error — ${ts}:`, err.message);
    res.status(500).json({ ok: false, timestamp: ts, error: 'Base no disponible' });
  }
});
app.use('/api/backup', backup);   // sólo lectura, con x-backup-key (Apps Script)

// Con sesión (login único de Central Mantenimiento)
app.use('/api/registros', requireAuth, registros);
app.use('/api/config',    requireAuth, config);
app.use('/api/usuarios',  requireAuth, usuarios);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
