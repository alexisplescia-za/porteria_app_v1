const express = require('express');
const router  = express.Router();

// Los usuarios de Portería ahora son los de Central Mantenimiento (Supabase Auth) y se
// habilitan en Admin → Accesos. Acá sólo queda "¿quién soy?".

// GET /api/usuarios/me
router.get('/me', (req, res) => {
  const { email, rol } = req.usuario;
  res.json({ ok: true, usuario: { id: email, username: email, rol } });
});

module.exports = router;
