// Hub de Central Mantenimiento: login único (Supabase Auth) y tarjetas según los accesos
// del usuario (tabla accesos_modulos, ver admin/sql/031). La sesión queda guardada en el
// navegador y la comparten Frío, Reclamos y Admin (mismo dominio).
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  // Si supabase-js no cargó (red, proxy), se muestran todas las apps como antes.
  if (!window.supabase || !window.Acceso) {
    $('hub-cargando').hidden = true;
    $('hub-modulos').hidden = false;
    return;
  }

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function mostrarAviso() {
    var m = new URLSearchParams(location.search).get('sin_acceso');
    if (!m) return;
    var nombre = Acceso.NOMBRES[m] || m;
    $('hub-aviso').textContent = 'No tenés acceso a ' + nombre + '. Pedíselo a un administrador.';
    $('hub-aviso').hidden = false;
  }

  function verLogin() {
    $('hub-cargando').hidden = true;
    $('hub-usuario').hidden = true;
    $('hub-modulos').hidden = true;
    $('hub-vacio').hidden = true;
    $('hub-sub').textContent = 'Ingresá con tu cuenta para ver tus aplicaciones.';
    $('hub-login').hidden = false;
  }

  // Si todavía tiene la contraseña genérica, primero la tiene que cambiar.
  async function debeCambiar() {
    try { var r = await sb.rpc('debe_cambiar_password'); return !r.error && r.data === true; }
    catch (e) { return false; }
  }

  function verCambiar() {
    $('hub-cargando').hidden = true;
    $('hub-modulos').hidden = true;
    $('hub-vacio').hidden = true;
    $('hub-sub').textContent = 'Elegí tu contraseña';
    $('hub-cambiar').hidden = false;
    $('hub-pw1').focus();
  }

  async function verModulos(session) {
    $('hub-login').hidden = true;
    $('hub-cambiar').hidden = true;
    $('hub-cargando').hidden = false;
    $('hub-usuario-mail').textContent = session.user.email;
    $('hub-usuario').hidden = false;

    if (await debeCambiar()) { verCambiar(); return; }

    var mis = await Acceso.mis(sb);
    var visibles = 0;
    document.querySelectorAll('#hub-modulos [data-modulo]').forEach(function (a) {
      // Si no se pudo consultar (031 sin aplicar), se muestran todas como antes.
      var ver = mis === null || mis.indexOf(a.dataset.modulo) !== -1;
      a.hidden = !ver;
      if (ver) visibles++;
    });

    $('hub-cargando').hidden = true;
    $('hub-sub').textContent = visibles > 1 ? '¿A qué aplicación querés ingresar?' : 'Tu aplicación:';
    $('hub-modulos').hidden = visibles === 0;
    $('hub-vacio').hidden = visibles !== 0;
  }

  $('hub-login').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = $('hub-email').value.trim().toLowerCase();
    var pass = $('hub-password').value;
    var err = $('hub-error');
    err.hidden = true;
    if (!email || !pass) return;
    $('hub-entrar').disabled = true;
    $('hub-entrar').textContent = 'Entrando…';
    var r = await sb.auth.signInWithPassword({ email: email, password: pass });
    $('hub-entrar').disabled = false;
    $('hub-entrar').textContent = 'Entrar';
    if (r.error) {
      err.textContent = 'Mail o contraseña incorrectos.';
      err.hidden = false;
      return;
    }
    $('hub-password').value = '';
    await verModulos(r.data.session);
  });

  $('hub-cambiar').addEventListener('submit', async function (e) {
    e.preventDefault();
    var err = $('hub-cambiar-error');
    var p1 = $('hub-pw1').value, p2 = $('hub-pw2').value;
    err.hidden = true;
    var mal = !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(p1) ? 'La contraseña tiene que tener al menos 8 caracteres, una mayúscula, una minúscula y un número.'
      : p1 === 'Universo2026.' ? 'Esa es la contraseña genérica. Elegí otra.'
      : p1 !== p2 ? 'Las contraseñas no coinciden.' : '';
    if (mal) { err.textContent = mal; err.hidden = false; return; }
    $('hub-cambiar-btn').disabled = true;
    var r = await sb.auth.updateUser({ password: p1 });
    $('hub-cambiar-btn').disabled = false;
    if (r.error) { err.textContent = 'No se pudo guardar: ' + r.error.message; err.hidden = false; return; }
    $('hub-pw1').value = ''; $('hub-pw2').value = '';
    var s = await sb.auth.getSession();
    await verModulos(s.data.session);
  });

  $('hub-salir').addEventListener('click', async function () {
    await sb.auth.signOut();
    verLogin();
  });

  mostrarAviso();
  sb.auth.getSession().then(function (r) {
    if (r.data.session) verModulos(r.data.session);
    else verLogin();
  });
})();
