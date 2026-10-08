// Reclamos a Proveedores — Eficiencia Energética.
// Frontend conectado directo a Supabase (mismo proyecto que Frío Alimentario).
// Las escrituras pasan por funciones de la base (crear_reclamo, cambiar_estado_reclamo, editar_reclamo,
// comentar_reclamo, reiterar_reclamo, derivar_reclamo) que validan el usuario, generan el ID y dejan historial.

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var ESTADOS = ['Nuevo', 'Enviado al proveedor', 'Respuesta proveedor', 'En resolución', 'Pendiente validación', 'Escalado', 'Reabierto', 'Cerrado'];
var COLOR_FORMATO = { HIPERMERCADO: 'var(--hiper)', MAXI: 'var(--maxi)', MARKET: 'var(--market)', EXPRESS: 'var(--express)' };
var TRAMOS = [['0-7 días', 'var(--line)'], ['8-15 días', 'var(--warn)'], ['16-30 días', 'var(--orange)'], ['+30 días', 'var(--bad)']];
var DIA = 864e5;
var CLASE_PRIORIDAD = { Alta: 'a3', Media: 'a1', Baja: 'a0' };

var S = { usuario: null, tiendas: {}, provs: [], cats: [], opciones: { tipo: [], motivo: [], via: [], area: [] }, reclamos: [], eventos: {}, sel: null };

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------

function $(id) { return document.getElementById(id); }
function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
function hoy() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function soloFecha(x) { var d = new Date(x); d.setHours(0, 0, 0, 0); return d; }
function fechaLocal(ymd) { if (!ymd) return null; var p = ymd.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function fmtD(x) { return x ? new Date(x).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'; }
function fmtDH(x) { return new Date(x).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
function guardarLocal(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
function leerLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function opciones(lista, actual, vacia) {
  return (vacia ? '<option value="">' + vacia + '</option>' : '') + lista.map(function (v) {
    return '<option' + (v === actual ? ' selected' : '') + '>' + esc(v) + '</option>';
  }).join('');
}

var _tt;
function toast(m, mal) {
  var t = $('toast'); t.textContent = m; t.className = 'toast' + (mal ? ' mal' : ''); t.hidden = false;
  clearTimeout(_tt); _tt = setTimeout(function () { t.hidden = true; }, mal ? 5000 : 2400);
}
function mensajeError(err) {
  var m = (err && (err.message || err.error_description)) || String(err);
  return m.replace(/^.*?ERROR:\s*/, '');
}

function tienda(r) { return S.tiendas[r.tienda_numero] || null; }
function regionDe(t) { return !t ? 'Sin tienda' : String(t.formato).toUpperCase() === 'EXPRESS' ? 'Express' : (t.region || 'Sin región'); }
function dias(r) { return Math.round(((r.fecha_cierre ? soloFecha(r.fecha_cierre) : hoy()) - soloFecha(r.fecha_alta)) / DIA); }
function aging(r) {
  if (r.estado === 'Cerrado') return ['Cerrado', 'aok'];
  var n = dias(r);
  return n <= 7 ? ['0-7 días', 'a0'] : n <= 15 ? ['8-15 días', 'a1'] : n <= 30 ? ['16-30 días', 'a2'] : ['+30 días', 'a3'];
}
function vencido(r) { return r.estado !== 'Cerrado' && r.fecha_compromiso && hoy() > fechaLocal(r.fecha_compromiso); }
function vecesReclamado(r) { return 1 + (r.reiteraciones || 0); }
function esGestor() { return S.usuario && S.usuario.rol === 'gestor'; }

function vista(nombre) {
  ['v-login', 'v-consola', 'v-cargando'].forEach(function (v) { $(v).hidden = v !== 'v-' + nombre; });
}

// PostgREST corta en 1000 filas: se pagina.
async function traerTodo(tabla, columnas, filtro) {
  var out = [];
  for (var desde = 0; ; desde += 1000) {
    var q = supabase.from(tabla).select(columnas).range(desde, desde + 999);
    if (filtro) q = filtro(q);
    var r = await q;
    if (r.error) throw r.error;
    out = out.concat(r.data || []);
    if (!r.data || r.data.length < 1000) return out;
  }
}

// ---------------------------------------------------------------
// Login
// ---------------------------------------------------------------

async function entrar() {
  var mail = $('login-mail').value.trim().toLowerCase();
  var err = $('login-error');
  err.hidden = true;
  if (!/^[^\s@]+@carrefour\.com$/.test(mail)) { err.textContent = 'Usá tu mail @carrefour.com.'; err.hidden = false; return; }
  vista('cargando');
  try {
    var r = await supabase.from('reclamos_usuarios').select('email,nombre,rol').eq('email', mail).eq('activo', true).maybeSingle();
    if (r.error) throw r.error;
    if (!r.data) {
      vista('login');
      err.textContent = 'Tu mail no está habilitado para Reclamos. Pedile acceso a un gestor del equipo de Eficiencia Energética.';
      err.hidden = false;
      return;
    }
    S.usuario = r.data;
    guardarLocal('reclamos_mail', mail);
    $('usuario-nombre').textContent = (r.data.nombre || mail) + (r.data.rol === 'gestor' ? ' · gestor' : ' · carga');
    $('usuario').hidden = false;
    await cargarTodo();
    vista('consola');
  } catch (e) {
    vista('login');
    err.textContent = 'No se pudo entrar: ' + mensajeError(e);
    err.hidden = false;
  }
}

function salir() {
  S.usuario = null; S.sel = null;
  guardarLocal('reclamos_mail', '');
  $('usuario').hidden = true;
  vista('login');
}

// ---------------------------------------------------------------
// Datos
// ---------------------------------------------------------------

async function cargarTodo() {
  var r = await Promise.all([
    traerTodo('tiendas', 'numero,local,formato,region'),
    supabase.from('reclamos_proveedores').select('*').eq('activo', true).order('orden'),
    supabase.from('reclamos_categorias').select('*').eq('activo', true).order('orden'),
    supabase.from('reclamos_opciones').select('*').eq('activo', true).order('orden'),
    traerTodo('reclamos', '*', function (q) { return q.order('fecha_alta', { ascending: false }); })
  ]);
  [1, 2, 3].forEach(function (i) { if (r[i].error) throw r[i].error; });
  S.tiendas = {};
  r[0].forEach(function (t) { S.tiendas[t.numero] = t; });
  S.provs = r[1].data.map(function (p) { return p.nombre; });
  S.cats = r[2].data.map(function (c) { return c.nombre; });
  S.opciones = { tipo: [], motivo: [], via: [], area: [] };
  r[3].data.forEach(function (o) { if (S.opciones[o.lista]) S.opciones[o.lista].push(o.valor); });
  S.reclamos = r[4];
  S.eventos = {};
  armarSelects();
  render();
}

async function recargarReclamo(id) {
  var r = await supabase.from('reclamos').select('*').eq('id', id).maybeSingle();
  if (r.error) throw r.error;
  var i = S.reclamos.findIndex(function (x) { return x.id === id; });
  if (r.data) { if (i >= 0) S.reclamos[i] = r.data; else S.reclamos.unshift(r.data); }
  delete S.eventos[id];
}

async function cargarEventos(id) {
  if (S.eventos[id]) return S.eventos[id];
  var r = await supabase.from('reclamos_eventos').select('*').eq('reclamo_id', id).order('fecha', { ascending: true });
  if (r.error) throw r.error;
  S.eventos[id] = r.data || [];
  return S.eventos[id];
}

function armarSelects() {
  var conservar = function (id, html) { var el = $(id), v = el.value; el.innerHTML = html; el.value = v; };
  conservar('f-prov', opciones(S.provs, null, 'Todos los proveedores'));
  conservar('f-tipo', opciones(S.opciones.tipo, null, 'Todos los tipos'));
  conservar('f-motivo', opciones(S.opciones.motivo, null, 'Todos los motivos'));
  var regiones = {};
  Object.keys(S.tiendas).forEach(function (n) { regiones[regionDe(S.tiendas[n])] = true; });
  conservar('f-region', opciones(Object.keys(regiones).sort(), null, 'Todas las regiones'));
  $('n-prov').innerHTML = opciones(S.provs);
  $('n-tipo').innerHTML = opciones(S.opciones.tipo);
  $('n-motivo').innerHTML = opciones(S.opciones.motivo);
  $('n-via').innerHTML = opciones(S.opciones.via);
  $('n-cat').innerHTML = opciones(S.cats);
  $('lista-tiendas').innerHTML = Object.keys(S.tiendas).map(function (n) {
    return '<option value="' + esc(S.tiendas[n].local || n) + '">';
  }).join('');
}

// ---------------------------------------------------------------
// Consola
// ---------------------------------------------------------------

function filtrados() {
  var q = $('q').value.toLowerCase().trim(), fp = $('f-prov').value, ft = $('f-tipo').value, fm = $('f-motivo').value,
    fr = $('f-region').value, fe = $('f-estado').value;
  return S.reclamos.filter(function (r) {
    var t = tienda(r);
    if (fp && r.proveedor !== fp) return false;
    if (ft && r.tipo !== ft) return false;
    if (fm && r.motivo !== fm) return false;
    if (fr && regionDe(t) !== fr) return false;
    if (fe === 'abiertos' && r.estado === 'Cerrado') return false;
    if (fe === 'vencidos' && !vencido(r)) return false;
    if (fe === 'mas30' && (r.estado === 'Cerrado' || dias(r) <= 30)) return false;
    if (fe === 'Cerrado' && r.estado !== 'Cerrado') return false;
    if (!q) return true;
    return [r.id, t && t.local, r.tienda_numero, r.descripcion, r.categoria, r.referencia, r.solicitante, r.tipo, r.motivo]
      .join(' ').toLowerCase().indexOf(q) !== -1;
  }).sort(function (a, b) {
    if ((a.estado === 'Cerrado') !== (b.estado === 'Cerrado')) return a.estado === 'Cerrado' ? 1 : -1;
    return a.estado === 'Cerrado' ? new Date(b.fecha_cierre) - new Date(a.fecha_cierre) : dias(b) - dias(a);
  });
}

function render() {
  var abiertos = S.reclamos.filter(function (r) { return r.estado !== 'Cerrado'; });
  var cerrados = S.reclamos.filter(function (r) { return r.estado === 'Cerrado'; });
  var prom = cerrados.length ? (cerrados.reduce(function (a, r) { return a + dias(r); }, 0) / cerrados.length).toFixed(1).replace('.', ',') : '–';
  var reit = abiertos.filter(function (r) { return r.reiteraciones > 0; }).length;
  var devs = S.reclamos.reduce(function (a, r) { return a + (r.devoluciones || 0); }, 0);
  $('kpis').innerHTML =
    '<div class="kpi clic" data-filtro="abiertos"><div class="l">Abiertos</div><div class="v">' + abiertos.length + '</div></div>' +
    '<div class="kpi bad clic" data-filtro="vencidos"><div class="l">Vencidos (pasó la fecha del proveedor)</div><div class="v">' + abiertos.filter(vencido).length + '</div></div>' +
    '<div class="kpi warn clic" data-filtro="mas30"><div class="l">Más de 30 días</div><div class="v">' + abiertos.filter(function (r) { return dias(r) > 30; }).length + '</div></div>' +
    '<div class="kpi"><div class="l">Abiertos reclamados más de una vez</div><div class="v">' + reit + '</div></div>' +
    '<div class="kpi"><div class="l">Devoluciones proveedor / compras / mant.</div><div class="v">' + devs + '</div></div>' +
    '<div class="kpi"><div class="l">Promedio de resolución</div><div class="v">' + prom + ' <span style="font-size:14px;font-weight:500;color:var(--muted)">días</span></div></div>';

  $('prov').innerHTML = S.provs.map(function (p) {
    var ab = abiertos.filter(function (r) { return r.proveedor === p; }), tot = ab.length || 1;
    var seg = TRAMOS.map(function (tr) {
      var n = ab.filter(function (r) { return aging(r)[0] === tr[0]; }).length;
      return n ? '<span style="width:' + (n / tot * 100) + '%;background:' + tr[1] + '" title="' + tr[0] + ': ' + n + '"></span>' : '';
    }).join('');
    return '<div class="pcard"><h4><span>' + esc(p) + '</span><span style="color:var(--muted);font-weight:500">' + ab.length + ' abiertos · ' + ab.filter(vencido).length + ' vencidos</span></h4><div class="bar">' + seg + '</div></div>';
  }).join('') + '<div class="pcard"><h4><span>Antigüedad de abiertos</span></h4><div class="legend">' +
    TRAMOS.map(function (tr) { return '<span><i style="background:' + tr[1] + '"></i>' + tr[0] + '</span>'; }).join('') + '</div></div>';

  renderSeguimiento();

  var lista = filtrados();
  $('rows').innerHTML = lista.length ? lista.map(function (r) {
    var ag = aging(r), t = tienda(r);
    var colorF = t ? (COLOR_FORMATO[String(t.formato).toUpperCase()] || 'var(--muted)') : 'var(--muted)';
    var marcas = (r.motivo ? '<span class="mini">' + esc(r.motivo) + '</span>' : '') + (r.tipo ? '<span class="mini">' + esc(r.tipo) + '</span>' : '');
    var cont = (r.reiteraciones ? '<span class="desc">Reclamado ' + vecesReclamado(r) + ' veces</span>' : '') +
      (r.devoluciones ? '<span class="desc">' + r.devoluciones + ' devoluciones · en ' + esc(r.area_actual) + '</span>' : '');
    return '<tr class="row ' + (S.sel === r.id ? 'sel' : '') + '" data-id="' + esc(r.id) + '" tabindex="0">' +
      '<td class="id">' + esc(r.id) + '</td>' +
      '<td><b>' + esc(r.proveedor) + '</b><br><span class="desc"><span class="fmt" style="background:' + colorF + '"></span>' + esc(t ? t.local : 'Sin tienda') + '</span></td>' +
      '<td>' + marcas + (marcas ? '<br>' : '') + esc(r.categoria) + '<span class="desc">' + esc(r.descripcion) + '</span></td>' +
      '<td><span class="chip ' + (CLASE_PRIORIDAD[r.prioridad] || 'a0') + '">' + esc(r.prioridad || '—') + '</span></td>' +
      '<td class="st">' + esc(r.estado) + (vencido(r) ? '<span class="venc">VENCIDO</span>' : '') + cont + '</td>' +
      '<td><span class="chip ' + ag[1] + '">' + ag[0] + '</span><br><span class="desc">' + dias(r) + ' días</span></td></tr>';
  }).join('') : '<tr><td colspan="6" class="empty">' + (S.reclamos.length ? 'No hay reclamos con estos filtros.' : 'Todavía no hay reclamos. Cargá el primero con "+ Nuevo reclamo".') + '</td></tr>';
  renderDetalle();
}

// Tabla de seguimiento: cantidad por proveedor, antigüedad, estado, veces reclamado y devoluciones.
function renderSeguimiento() {
  var provs = S.provs.slice();
  S.reclamos.forEach(function (r) { if (provs.indexOf(r.proveedor) === -1) provs.push(r.proveedor); });
  var fila = function (lista, nombre, total) {
    var ab = lista.filter(function (r) { return r.estado !== 'Cerrado'; });
    var ce = lista.filter(function (r) { return r.estado === 'Cerrado'; });
    var celdas = [lista.length, ab.length, ce.length, ab.filter(vencido).length]
      .concat(TRAMOS.map(function (tr) { return ab.filter(function (r) { return aging(r)[0] === tr[0]; }).length; }))
      .concat([lista.reduce(function (a, r) { return a + vecesReclamado(r); }, 0),
        lista.filter(function (r) { return r.reiteraciones > 0; }).length,
        lista.reduce(function (a, r) { return a + (r.devoluciones || 0); }, 0),
        ce.length ? (ce.reduce(function (a, r) { return a + dias(r); }, 0) / ce.length).toFixed(1).replace('.', ',') : '–']);
    return '<tr' + (total ? ' class="total"' : '') + '><td>' + esc(nombre) + '</td>' + celdas.map(function (c) { return '<td class="n">' + c + '</td>'; }).join('') + '</tr>';
  };
  var t1 = '<div class="seg-sub">Cantidad, antigüedad, veces reclamado y devoluciones</div><div class="seg-tabla"><table><thead><tr>' +
    ['Proveedor', 'Total', 'Abiertos', 'Cerrados', 'Vencidos'].concat(TRAMOS.map(function (t) { return t[0]; }))
      .concat(['Veces reclamado', 'Reclamados +1 vez', 'Devoluciones', 'Prom. días resolución'])
      .map(function (h, i) { return '<th' + (i ? ' style="text-align:right"' : '') + '>' + h + '</th>'; }).join('') +
    '</tr></thead><tbody>' + provs.map(function (p) { return fila(S.reclamos.filter(function (r) { return r.proveedor === p; }), p); }).join('') +
    fila(S.reclamos, 'TOTAL', true) + '</tbody></table></div>';
  var t2 = '<div class="seg-sub">Estado por proveedor</div><div class="seg-tabla"><table><thead><tr><th>Proveedor</th>' +
    ESTADOS.map(function (e) { return '<th style="text-align:right">' + e + '</th>'; }).join('') + '</tr></thead><tbody>' +
    provs.map(function (p) {
      return '<tr><td>' + esc(p) + '</td>' + ESTADOS.map(function (e) {
        return '<td class="n">' + S.reclamos.filter(function (r) { return r.proveedor === p && r.estado === e; }).length + '</td>';
      }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
  $('seguimiento').innerHTML = '<div class="seg-tablas">' + t1 + t2 + '</div>';
}

async function renderDetalle() {
  var cont = $('detalle');
  var r = S.reclamos.find(function (x) { return x.id === S.sel; });
  if (!r) { cont.innerHTML = '<p class="empty">Elegí un reclamo de la lista para ver el detalle, cambiar el estado y ver su historial.</p>'; return; }
  var t = tienda(r), g = esGestor(), abierto = r.estado !== 'Cerrado';
  cont.innerHTML =
    '<span class="id">' + esc(r.id) + '</span><h3>' + esc(r.categoria) + '</h3>' +
    '<p style="margin:0;color:var(--muted);font-size:13px">' + esc(r.descripcion) + '</p>' +
    '<dl class="kv">' +
      '<dt>Proveedor</dt><dd>' + esc(r.proveedor) + '</dd>' +
      '<dt>Tipo</dt><dd>' + esc(r.tipo || '—') + '</dd>' +
      '<dt>Motivo</dt><dd>' + esc(r.motivo || '—') + '</dd>' +
      '<dt>Tienda</dt><dd>' + esc(t ? t.local + ' · ' + t.formato + ' · ' + regionDe(t) : 'Sin tienda') + '</dd>' +
      '<dt>Prioridad</dt><dd><span class="chip ' + (CLASE_PRIORIDAD[r.prioridad] || 'a0') + '">' + esc(r.prioridad) + '</span></dd>' +
      '<dt>Vía</dt><dd>' + esc(r.canal || '—') + '</dd>' +
      '<dt>Quién reclamó</dt><dd>' + esc(r.solicitante || '—') + '</dd>' +
      '<dt>Alta</dt><dd>' + fmtD(r.fecha_alta) + ' · ' + dias(r) + ' días' + (r.estado === 'Cerrado' ? ' (cerrado ' + fmtD(r.fecha_cierre) + ')' : '') + '</dd>' +
      '<dt>Compromiso</dt><dd>' + (r.fecha_compromiso ? fmtD(fechaLocal(r.fecha_compromiso)) : 'Sin fecha') + (vencido(r) ? ' <span class="chip a3">Vencido</span>' : '') + '</dd>' +
      '<dt>Referencia</dt><dd>' + esc(r.referencia || '—') + '</dd>' +
      '<dt>En manos de</dt><dd><b>' + esc(r.area_actual || '—') + '</b></dd>' +
      '<dt>Veces reclamado</dt><dd><span class="contador">' + vecesReclamado(r) + '</span></dd>' +
      '<dt>Devoluciones</dt><dd><span class="contador">' + (r.devoluciones || 0) + '</span></dd>' +
      (r.reaperturas ? '<dt>Reaperturas</dt><dd><span class="chip a2">' + r.reaperturas + '</span></dd>' : '') +
    '</dl>' +
    '<textarea id="d-coment" rows="2" placeholder="Comentario (se guarda con la acción que elijas abajo)"></textarea>' +
    '<div class="seccion">Seguimiento</div>' +
    '<div class="acciones-seg">' +
      '<button class="btn chico" id="d-btn-reiterar"' + (abierto ? '' : ' disabled') + '>Reclamar de nuevo (+1)</button>' +
      '<button class="btn ghost chico" id="d-btn-coment">Sólo comentar</button>' +
    '</div>' +
    '<div class="acciones-seg"><span class="lbl">Derivar a:</span>' + S.opciones.area.map(function (a) {
      return '<button class="btn ghost chico" data-area="' + esc(a) + '"' + (g && a !== r.area_actual ? '' : ' disabled') + '>' + esc(a) + '</button>';
    }).join('') + '</div>' +
    '<div class="seccion">Estado' + (g ? '' : ' (sólo un gestor puede cambiarlo)') + '</div>' +
    '<div class="flow">' + ESTADOS.map(function (e) {
      return '<button data-estado="' + esc(e) + '" class="' + (e === r.estado ? 'on' : '') + '"' + (g ? '' : ' disabled') + '>' + esc(e) + '</button>';
    }).join('') + '</div>' +
    (g ? '<div class="seccion">Editar</div><div class="editar">' +
      '<div class="two"><select id="d-tipo">' + opciones(S.opciones.tipo, r.tipo, '— Tipo —') + '</select>' +
      '<select id="d-motivo">' + opciones(S.opciones.motivo, r.motivo, '— Motivo —') + '</select></div>' +
      '<div class="two"><select id="d-via">' + opciones(S.opciones.via, r.canal, '— Vía —') + '</select>' +
      '<select id="d-pri">' + opciones(['Alta', 'Media', 'Baja'], r.prioridad) + '</select></div>' +
      '<div class="two"><input id="d-solic" placeholder="Quién reclamó" value="' + esc(r.solicitante || '') + '">' +
      '<input id="d-comp" type="date" value="' + esc(r.fecha_compromiso || '') + '" title="Fecha comprometida por el proveedor"></div>' +
      '<input id="d-ref" placeholder="Referencia (OT SAP, Mantech, mail)" value="' + esc(r.referencia || '') + '">' +
      '<div style="display:flex;justify-content:flex-end"><button class="btn chico" id="d-btn-guardar">Guardar cambios</button></div></div>' : '') +
    '<div class="seccion">Historial</div><ul class="tl" id="d-historial"><li class="c">Cargando…</li></ul>';

  try {
    var ev = await cargarEventos(r.id);
    if (S.sel !== r.id) return;
    $('d-historial').innerHTML = ev.slice().reverse().map(function (e) {
      var txt = e.tipo === 'estado' ? esc(e.estado_anterior) + ' → <b>' + esc(e.estado_nuevo) + '</b>'
        : e.tipo === 'derivacion' ? 'Derivado: ' + esc(e.estado_anterior) + ' → <b>' + esc(e.estado_nuevo) + '</b>'
        : e.tipo === 'alta' ? '<b>Reclamo creado</b> · Nuevo' : '';
      if (e.comentario && e.tipo !== 'alta') txt += (txt ? '<br>' : '') + (e.tipo === 'reiteracion' ? '<b>' + esc(e.comentario) + '</b>' : esc(e.comentario));
      return '<li class="' + (e.tipo === 'comentario' || e.tipo === 'edicion' ? 'c' : '') + '"><time>' + fmtDH(e.fecha) + '</time> <span class="quien">· ' + esc(e.usuario || '') + '</span><br>' + txt + '</li>';
    }).join('') || '<li class="c">Sin movimientos.</li>';
  } catch (e) {
    $('d-historial').innerHTML = '<li class="c">No se pudo cargar el historial: ' + esc(mensajeError(e)) + '</li>';
  }
}

// ---------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------

async function ejecutar(fn, args, ok) {
  var r = await supabase.rpc(fn, args);
  if (r.error) throw r.error;
  if (ok) toast(ok);
  return r.data;
}

async function accion(fn, args, ok, textoError) {
  try {
    await ejecutar(fn, Object.assign({ p_usuario: S.usuario.email, p_id: S.sel }, args), ok);
    await recargarReclamo(S.sel);
    render();
  } catch (e) { toast(textoError + ': ' + mensajeError(e), true); }
}

function comentarioActual() { var el = $('d-coment'); return el ? el.value : ''; }

function cambiarEstado(estado) {
  var r = S.reclamos.find(function (x) { return x.id === S.sel; });
  if (!r || r.estado === estado) return;
  return accion('cambiar_estado_reclamo', { p_estado: estado, p_comentario: comentarioActual() }, 'Estado: ' + estado, 'No se pudo cambiar el estado');
}

function comentar() {
  var txt = comentarioActual().trim();
  if (!txt) { toast('Escribí el comentario primero.', true); return; }
  return accion('comentar_reclamo', { p_comentario: txt }, 'Comentario agregado', 'No se pudo comentar');
}

function reiterar() {
  return accion('reiterar_reclamo', { p_comentario: comentarioActual() }, 'Reclamado de nuevo', 'No se pudo registrar');
}

function derivar(area) {
  return accion('derivar_reclamo', { p_area: area, p_comentario: comentarioActual() }, 'Derivado a ' + area, 'No se pudo derivar');
}

function guardarEdicion() {
  return accion('editar_reclamo', {
    p_solicitante: $('d-solic').value, p_compromiso: $('d-comp').value || null, p_prioridad: $('d-pri').value,
    p_referencia: $('d-ref').value, p_tipo: $('d-tipo').value, p_motivo: $('d-motivo').value, p_via: $('d-via').value
  }, 'Cambios guardados', 'No se pudo guardar');
}

function tiendaDeTexto(txt) {
  txt = (txt || '').trim().toLowerCase();
  if (!txt) return null;
  var num = parseInt(txt, 10);
  var porNombre = Object.keys(S.tiendas).find(function (n) { return (S.tiendas[n].local || '').toLowerCase() === txt; });
  if (porNombre) return Number(porNombre);
  if (!isNaN(num) && S.tiendas[num]) return num;
  return null;
}

async function crear(e) {
  e.preventDefault();
  var err = $('n-error'); err.hidden = true;
  var tiendaNum = tiendaDeTexto($('n-tienda').value);
  if (!tiendaNum) { err.textContent = 'Elegí la tienda de la lista (podés escribir el número o el nombre).'; err.hidden = false; return; }
  var btn = $('btn-guardar'); btn.disabled = true; btn.textContent = 'Registrando…';
  try {
    var id = await ejecutar('crear_reclamo', {
      p_usuario: S.usuario.email, p_proveedor: $('n-prov').value, p_tienda: tiendaNum, p_categoria: $('n-cat').value,
      p_descripcion: $('n-desc').value, p_prioridad: $('n-pri').value, p_via: $('n-via').value,
      p_solicitante: $('n-solic').value, p_compromiso: $('n-comp').value || null, p_referencia: $('n-ref').value,
      p_tipo: $('n-tipo').value, p_motivo: $('n-motivo').value
    });
    await recargarReclamo(id);
    S.sel = id;
    $('f-nuevo').reset();
    $('sheet').hidden = true;
    $('f-estado').value = 'abiertos';
    render();
    toast('Reclamo ' + id + ' registrado');
  } catch (ex) {
    err.textContent = 'No se pudo registrar: ' + mensajeError(ex);
    err.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'Registrar reclamo';
  }
}

function exportarCSV() {
  var cols = ['ID', 'Fecha alta', 'Proveedor', 'Tipo', 'Motivo', 'Tienda', 'Formato', 'Región', 'Categoría', 'Descripción', 'Prioridad', 'Vía',
    'Estado', 'Días abiertos', 'Antigüedad', 'Vencido', 'Fecha compromiso', 'Fecha cierre', 'Quién reclamó', 'Referencia',
    'En manos de', 'Veces reclamado', 'Devoluciones', 'Reaperturas'];
  var filas = filtrados().map(function (r) {
    var t = tienda(r);
    return [r.id, fmtD(r.fecha_alta), r.proveedor, r.tipo, r.motivo, t ? t.local : '', t ? t.formato : '', regionDe(t), r.categoria, r.descripcion,
      r.prioridad, r.canal, r.estado, dias(r), aging(r)[0], vencido(r) ? 'Sí' : 'No', r.fecha_compromiso ? fmtD(fechaLocal(r.fecha_compromiso)) : '',
      r.fecha_cierre ? fmtD(r.fecha_cierre) : '', r.solicitante, r.referencia, r.area_actual, vecesReclamado(r), r.devoluciones, r.reaperturas];
  });
  var csv = [cols].concat(filas).map(function (f) {
    return f.map(function (v) { v = v == null ? '' : String(v); return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';');
  }).join('\r\n');
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'reclamos_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  $('btn-entrar').onclick = entrar;
  $('login-mail').addEventListener('keydown', function (e) { if (e.key === 'Enter') entrar(); });
  $('btn-salir').onclick = salir;
  ['q', 'f-prov', 'f-tipo', 'f-motivo', 'f-region', 'f-estado'].forEach(function (id) { $(id).addEventListener('input', render); });
  $('kpis').addEventListener('click', function (e) {
    var k = e.target.closest('[data-filtro]');
    if (k) { $('f-estado').value = k.dataset.filtro; render(); }
  });
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-id]');
    if (tr) { S.sel = tr.dataset.id; render(); }
  });
  $('rows').addEventListener('keydown', function (e) {
    var tr = e.target.closest('tr[data-id]');
    if (tr && e.key === 'Enter') { S.sel = tr.dataset.id; render(); }
  });
  $('detalle').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.estado) return cambiarEstado(b.dataset.estado);
    if (b.dataset.area) return derivar(b.dataset.area);
    if (b.id === 'd-btn-reiterar') return reiterar();
    if (b.id === 'd-btn-coment') return comentar();
    if (b.id === 'd-btn-guardar') return guardarEdicion();
  });
  $('btn-nuevo').onclick = function () {
    $('n-error').hidden = true;
    if (!$('n-solic').value && S.usuario) $('n-solic').value = S.usuario.nombre || '';
    $('sheet').hidden = false;
    $('n-tienda').focus();
  };
  $('btn-cancelar').onclick = function () { $('sheet').hidden = true; };
  $('sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet') $('sheet').hidden = true; });
  $('f-nuevo').addEventListener('submit', crear);
  $('btn-csv').onclick = exportarCSV;
  // Al volver a la pestaña, se refrescan los datos (otro usuario pudo cambiar algo).
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && S.usuario) cargarTodo().catch(function () { });
  });

  var mail = leerLocal('reclamos_mail');
  if (mail) { $('login-mail').value = mail; entrar(); } else vista('login');
});
