// Login único: el front manda el token de la sesión de Supabase (el mismo del hub).
// 1) Se valida con Supabase Auth (/auth/v1/user) → mail verificado.
// 2) Se leen sus accesos en la base (accesos_de_, SQL 031): hace falta "porteria" o "admin".
// 3) Rol en Portería: "admin" si tiene Administración en Central; si no, "porteria".
const pool = require('./db');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Cache corto para no consultar Supabase en cada pedido (el token dura 1 h).
const CACHE_MS = 60 * 1000;
const cache = new Map();

async function usuarioDelToken(token) {
  const hit = cache.get(token);
  if (hit && hit.hasta > Date.now()) return hit.usuario;

  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  const u = await r.json();
  const email = (u && u.email ? String(u.email) : '').toLowerCase();
  if (!email) return null;

  const { rows } = await pool.query('SELECT public.accesos_de_($1) AS m', [email]);
  const modulos = (rows[0] && rows[0].m) || [];
  const usuario = {
    email,
    modulos,
    rol: modulos.includes('admin') ? 'admin' : 'porteria',
    habilitado: modulos.includes('porteria') || modulos.includes('admin'),
  };

  if (cache.size > 500) cache.clear();
  cache.set(token, { usuario, hasta: Date.now() + CACHE_MS });
  return usuario;
}

// Exige sesión válida con acceso a Portería.
async function requireAuth(req, res, next) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ ok: false, error: 'Login no configurado (faltan SUPABASE_URL / SUPABASE_ANON_KEY)' });
  }
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '');
  if (!m) return res.status(401).json({ ok: false, error: 'Sesión requerida' });
  try {
    const usuario = await usuarioDelToken(m[1]);
    if (!usuario) return res.status(401).json({ ok: false, error: 'Sesión vencida o inválida' });
    if (!usuario.habilitado) return res.status(403).json({ ok: false, error: 'No tenés acceso a Portería' });
    req.usuario = usuario;
    next();
  } catch (err) {
    console.error('auth:', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo verificar la sesión' });
  }
}

// Sólo admins (va después de requireAuth).
function requireAdmin(req, res, next) {
  if (req.usuario && req.usuario.rol === 'admin') return next();
  res.status(403).json({ ok: false, error: 'Sólo un administrador puede hacer esto' });
}

module.exports = { requireAuth, requireAdmin };
