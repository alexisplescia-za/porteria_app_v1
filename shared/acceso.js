// Accesos por módulo (login único del hub). Lo usan el hub, Frío, Reclamos y Admin.
// Ocultar una app es comodidad de pantalla: el bloqueo real lo hace la base
// (RLS y funciones con es_admin() / reclamos_usuarios).
(function () {
  var NOMBRES = {
    porteria: 'Portería',
    reclamos: 'Eficiencia Energética',
    frio: 'Frío Alimentario',
    admin: 'Administración'
  };

  // Devuelve la lista de módulos del usuario logueado, o null si no se pudo
  // consultar (por ejemplo, si el SQL 031 todavía no está aplicado).
  async function mis(sb) {
    try {
      var r = await sb.rpc('mis_accesos');
      if (r.error) return null;
      return r.data || [];
    } catch (e) {
      return null;
    }
  }

  // Si el usuario no tiene el módulo, vuelve al hub con un aviso.
  // Si no se pudo consultar, deja pasar (la app sigue validando por su cuenta).
  async function exigir(sb, modulo) {
    // Con la contraseña genérica, primero hay que cambiarla en el hub.
    try {
      var g = await sb.rpc('debe_cambiar_password');
      if (!g.error && g.data === true) { location.replace('/'); return false; }
    } catch (e) { /* si no se puede consultar, sigue */ }
    var m = await mis(sb);
    if (m === null || m.indexOf(modulo) !== -1) return true;
    location.replace('/?sin_acceso=' + encodeURIComponent(modulo));
    return false;
  }

  window.Acceso = { NOMBRES: NOMBRES, MODULOS: Object.keys(NOMBRES), mis: mis, exigir: exigir };
})();
