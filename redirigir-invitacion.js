// Si se llega a la portada por un link de invitación o recuperación de contraseña de
// Supabase (el Site URL del proyecto apunta a la raíz en vez de a /reclamos — la única
// app que hoy usa Supabase Auth), reenvía para allá sin perder el hash ni los parámetros,
// para que la pantalla de "elegí tu contraseña" se muestre donde corresponde.
(function () {
  var marca = /type=invite|type=recovery/.test(location.hash + location.search) || /[?&]code=/.test(location.search);
  if (marca) location.replace('/reclamos' + location.search + location.hash);
})();
