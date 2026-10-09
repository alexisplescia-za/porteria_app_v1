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
// Tiendas del reclamo: el grupo si lo tiene, si no la tienda única.
function tiendasDe(r) { return r.tiendas_grupo && r.tiendas_grupo.length > 1 ? r.tiendas_grupo : [r.tienda_numero]; }
function nombreTienda(n) { return S.tiendas[n] ? S.tiendas[n].local : 'Tienda ' + n; }
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
  if (!S.sel) abrirDesdeUrl();
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
  Andes.mejorar(document);
  Andes.refrescar();
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
    if (fr && !tiendasDe(r).some(function (n) { return regionDe(S.tiendas[n]) === fr; })) return false;
    if (fe === 'abiertos' && r.estado === 'Cerrado') return false;
    if (fe === 'vencidos' && !vencido(r)) return false;
    if (fe === 'mas30' && (r.estado === 'Cerrado' || dias(r) <= 30)) return false;
    if (fe === 'Cerrado' && r.estado !== 'Cerrado') return false;
    if (fe === 'reiterados' && (r.estado === 'Cerrado' || !r.reiteraciones)) return false;
    if (fe === 'devueltos' && !r.devoluciones) return false;
    if (fe === 'fuera' && (r.estado === 'Cerrado' || (r.area_actual || 'PROVEEDOR') === 'PROVEEDOR')) return false;
    if (!q) return true;
    return [r.id, tiendasDe(r).map(nombreTienda).join(' '), r.tienda_numero, r.descripcion, r.categoria, r.referencia, r.solicitante, r.tipo, r.motivo]
      .join(' ').toLowerCase().indexOf(q) !== -1;
  }).sort(function (a, b) {
    if ((a.estado === 'Cerrado') !== (b.estado === 'Cerrado')) return a.estado === 'Cerrado' ? 1 : -1;
    var orden = $('f-orden').value, d = 0;
    if (orden === 'reclamados') d = vecesReclamado(b) - vecesReclamado(a);
    else if (orden === 'prioridad') d = (PESO_PRIORIDAD[a.prioridad] || 9) - (PESO_PRIORIDAD[b.prioridad] || 9);
    else if (orden === 'compromiso') d = (a.fecha_compromiso ? new Date(a.fecha_compromiso) : 8e15) - (b.fecha_compromiso ? new Date(b.fecha_compromiso) : 8e15);
    else if (orden === 'recientes') d = new Date(b.fecha_alta) - new Date(a.fecha_alta);
    if (d) return d;
    return a.estado === 'Cerrado' ? new Date(b.fecha_cierre) - new Date(a.fecha_cierre) : dias(b) - dias(a);
  });
}

var PESO_PRIORIDAD = { Alta: 1, Media: 2, Baja: 3 };
var FILTROS_TEXTO = { '': 'Todos', vencidos: 'Sólo vencidos', mas30: 'Más de 30 días', reiterados: 'Reclamados más de una vez',
  devueltos: 'Con devoluciones', fuera: 'En Compras / Mantenimiento', Cerrado: 'Cerrados' };

// "Mostrando N de M" + chips con los filtros activos (cada uno se saca con ✕).
function renderInfoLista(lista) {
  var chips = [];
  var q = $('q').value.trim();
  if (q) chips.push(['q', '"' + q + '"']);
  ['f-prov', 'f-tipo', 'f-motivo', 'f-region'].forEach(function (id) { if ($(id).value) chips.push([id, $(id).value]); });
  if ($('f-estado').value !== 'abiertos') chips.push(['f-estado', FILTROS_TEXTO[$('f-estado').value] || $('f-estado').value]);
  $('lista-info').innerHTML = '<b>' + lista.length + '</b> de ' + S.reclamos.length + ' reclamos' +
    ($('f-estado').value === 'abiertos' ? ' · abiertos' : '') +
    chips.map(function (c) { return '<button class="filtro-chip" data-quitar="' + c[0] + '">' + esc(c[1]) + ' ✕</button>'; }).join('') +
    (chips.length ? '<button class="link-btn" data-quitar="todo">Limpiar filtros</button>' : '');
}

function quitarFiltro(id) {
  var ids = id === 'todo' ? ['q', 'f-prov', 'f-tipo', 'f-motivo', 'f-region', 'f-estado'] : [id];
  ids.forEach(function (i) { $(i).value = i === 'f-estado' ? 'abiertos' : ''; });
  Andes.refrescar();
  render();
}

// Elegir un reclamo: queda en la URL (#REC-...) para compartir el link.
function seleccionar(id, desplazar) {
  S.sel = id;
  try { history.replaceState(null, '', id ? '#' + id : location.pathname); } catch (e) { }
  render();
  var tr = document.querySelector('#rows tr[data-id="' + id + '"]');
  if (tr && desplazar !== false) tr.scrollIntoView({ block: 'nearest' });
}

function moverSeleccion(paso) {
  var lista = S.lista || [];
  if (!lista.length) return;
  var i = lista.findIndex(function (r) { return r.id === S.sel; });
  var j = i === -1 ? 0 : Math.min(Math.max(i + paso, 0), lista.length - 1);
  if (j !== i) seleccionar(lista[j].id);
}

// Abre el reclamo del link (#REC-...). Si los filtros lo esconden, los afloja.
function abrirDesdeUrl() {
  var id = decodeURIComponent(location.hash.slice(1));
  if (!id || !S.reclamos.some(function (r) { return r.id === id; })) return;
  S.sel = id;
  if (!filtrados().some(function (r) { return r.id === id; })) quitarFiltro('todo');
  if (!filtrados().some(function (r) { return r.id === id; })) { $('f-estado').value = ''; Andes.refrescar(); }
  render();
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
    '<div class="kpi clic" data-filtro="reiterados"><div class="l">Abiertos reclamados más de una vez</div><div class="v">' + reit + '</div></div>' +
    '<div class="kpi clic" data-filtro="devueltos"><div class="l">Devoluciones proveedor / compras / mant.</div><div class="v">' + devs + '</div></div>' +
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
  S.lista = lista;
  renderInfoLista(lista);
  $('rows').innerHTML = lista.length ? lista.map(function (r) {
    var ag = aging(r), t = tienda(r);
    var colorF = t ? (COLOR_FORMATO[String(t.formato).toUpperCase()] || 'var(--muted)') : 'var(--muted)';
    var marcas = r.motivo ? '<span class="mini">' + esc(r.motivo) + '</span>' : '';
    var grupo = tiendasDe(r);
    var celdaTienda = grupo.length > 1
      ? '<span class="desc grupo-t" title="' + esc(grupo.map(nombreTienda).join('\n')) + '"><span class="fmt" style="background:var(--muted)"></span><b>Grupo de ' + grupo.length + ' tiendas</b> · ' +
        esc(grupo.slice(0, 2).map(nombreTienda).join(', ')) + (grupo.length > 2 ? ' y ' + (grupo.length - 2) + ' más' : '') + '</span>'
      : '<span class="desc"><span class="fmt" style="background:' + colorF + '"></span>' + esc(t ? t.local : 'Sin tienda') + '</span>';
    var cont = (r.reiteraciones ? '<span class="desc">Reclamado ' + vecesReclamado(r) + ' veces</span>' : '') +
      (r.devoluciones ? '<span class="desc">' + r.devoluciones + ' devoluciones · en ' + esc(r.area_actual) + '</span>' : '');
    return '<tr class="row ' + (S.sel === r.id ? 'sel' : '') + '" data-id="' + esc(r.id) + '" tabindex="0">' +
      '<td class="id c-id">' + esc(r.id) + '</td>' +
      '<td class="c-prov"><b>' + esc(r.proveedor) + '</b><br>' + celdaTienda + '</td>' +
      '<td class="c-sec">' + (r.tipo ? '<span class="sector">' + esc(r.tipo) + '</span>' : '<span class="desc">—</span>') + '</td>' +
      '<td class="c-prob">' + marcas + (marcas ? '<br>' : '') + esc(r.categoria) + '<span class="desc">' + esc(r.descripcion) + '</span></td>' +
      '<td class="c-pri"><span class="chip ' + (CLASE_PRIORIDAD[r.prioridad] || 'a0') + '">' + esc(r.prioridad || '—') + '</span></td>' +
      '<td class="st c-est">' + esc(r.estado) + (vencido(r) ? '<span class="venc">VENCIDO</span>' : '') + cont + '</td>' +
      '<td class="c-ant"><span class="chip ' + ag[1] + '">' + ag[0] + '</span><br><span class="desc">' + dias(r) + ' días</span></td></tr>';
  }).join('') : '<tr><td colspan="7" class="empty">' + (S.reclamos.length ? 'No hay reclamos con estos filtros.' : 'Todavía no hay reclamos. Cargá el primero con "+ Nuevo reclamo".') + '</td></tr>';
  Andes.refrescar();
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
  var lista = S.lista || [], pos = lista.findIndex(function (x) { return x.id === r.id; });
  var esGrupo = tiendasDe(r).length > 1;
  var nav = '<div class="det-nav">' +
    '<button class="ev-btn" data-nav="-1"' + (pos <= 0 ? ' disabled' : '') + ' title="Anterior (flecha ↑)">‹ Anterior</button>' +
    '<span>' + (pos === -1 ? 'No está en la lista filtrada' : (pos + 1) + ' de ' + lista.length) + '</span>' +
    '<button class="ev-btn" data-nav="1"' + (pos === -1 || pos >= lista.length - 1 ? ' disabled' : '') + ' title="Siguiente (flecha ↓)">Siguiente ›</button>' +
    '<button class="ev-btn" data-copiar-link title="Copiar el link directo a este reclamo">🔗 Copiar link</button>' +
    '<button class="ev-btn" data-cerrar-det title="Cerrar el detalle">✕</button></div>';
  cont.innerHTML = nav +
    '<span class="id">' + esc(r.id) + '</span><h3>' + esc(r.categoria) + '</h3>' +
    '<p style="margin:0;color:var(--muted);font-size:13px">' + esc(r.descripcion) + '</p>' +
    '<dl class="kv">' +
      '<dt>Proveedor</dt><dd>' + esc(r.proveedor) + '</dd>' +
      '<dt>Tipo</dt><dd>' + esc(r.tipo || '—') + '</dd>' +
      '<dt>Motivo</dt><dd>' + esc(r.motivo || '—') + '</dd>' +
      (tiendasDe(r).length > 1
        ? '<dt>Tiendas</dt><dd><b>Grupo de ' + tiendasDe(r).length + ' tiendas</b><ul class="lista-t">' +
          tiendasDe(r).map(function (n) { var x = S.tiendas[n]; return '<li>' + esc(nombreTienda(n)) + (x ? ' <span class="desc-in">· ' + esc(x.formato) + ' · ' + esc(regionDe(x)) + '</span>' : '') + '</li>'; }).join('') + '</ul></dd>'
        : '<dt>Tienda</dt><dd>' + esc(t ? t.local + ' · ' + t.formato + ' · ' + regionDe(t) : 'Sin tienda') + '</dd>') +
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
      '<select id="d-prov">' + opciones(S.provs.indexOf(r.proveedor) === -1 ? S.provs.concat([r.proveedor]) : S.provs, r.proveedor) + '</select>' +
      '<div id="d-tiendas-box"></div>' +
      '<select id="d-cat">' + opciones(S.cats.indexOf(r.categoria) === -1 ? S.cats.concat([r.categoria]) : S.cats, r.categoria) + '</select>' +
      '<textarea id="d-desc" rows="2" placeholder="Descripción">' + esc(r.descripcion) + '</textarea>' +
      '<div class="two"><select id="d-tipo">' + opciones(S.opciones.tipo, r.tipo, '— Tipo —') + '</select>' +
      '<select id="d-motivo">' + opciones(S.opciones.motivo, r.motivo, '— Motivo —') + '</select></div>' +
      '<div class="two"><select id="d-via">' + opciones(S.opciones.via, r.canal, '— Vía —') + '</select>' +
      '<select id="d-pri">' + opciones(['Alta', 'Media', 'Baja'], r.prioridad) + '</select></div>' +
      '<div class="two"><input id="d-solic" placeholder="Quién reclamó" value="' + esc(r.solicitante || '') + '">' +
      '<input id="d-comp" type="date" value="' + esc(r.fecha_compromiso || '') + '" title="Fecha comprometida por el proveedor"></div>' +
      '<input id="d-ref" placeholder="Referencia (OT SAP, Mantech, mail)" value="' + esc(r.referencia || '') + '">' +
      '<div class="acciones"><button class="btn ghost chico" id="d-btn-cancelar">Cancelar cambios</button>' +
      '<button class="btn chico" id="d-btn-guardar">Guardar cambios</button></div></div>' : '') +
    '<div class="seccion">Historial</div><ul class="tl" id="d-historial"><li class="c">Cargando…</li></ul>';
  if ($('d-tiendas-box')) armarSelectorTiendas('d', esGrupo ? tiendasDe(r) : [r.tienda_numero]);
  Andes.mejorar(cont);

  try {
    var ev = await cargarEventos(r.id);
    if (S.sel !== r.id) return;
    // Sólo se puede anular la última derivación y el último cambio de estado vigentes.
    var ultimo = {};
    ev.forEach(function (e) { if (!e.anulado && (e.tipo === 'estado' || e.tipo === 'derivacion')) ultimo[e.tipo] = e.id; });
    $('d-historial').innerHTML = ev.slice().reverse().map(function (e) {
      var txt = e.tipo === 'estado' ? esc(e.estado_anterior) + ' → <b>' + esc(e.estado_nuevo) + '</b>'
        : e.tipo === 'derivacion' ? 'Derivado: ' + esc(e.estado_anterior) + ' → <b>' + esc(e.estado_nuevo) + '</b>'
        : e.tipo === 'alta' ? '<b>Reclamo creado</b> · Nuevo' : '';
      if (e.comentario && e.tipo !== 'alta') {
        txt += (txt ? '<br>' : '') + '<span class="ev-coment">' + (e.tipo === 'reiteracion' || e.tipo === 'anulacion' ? '<b>' + esc(e.comentario) + '</b>' : esc(e.comentario)) + '</span>';
      }
      if (e.editado_at) txt += ' <span class="ev-marca" title="Original: ' + esc(e.comentario_original || '') + '">(editado)</span>';
      var anulable = g && !e.anulado && (e.tipo === 'reiteracion' || e.tipo === 'comentario' || ultimo[e.tipo] === e.id);
      var editable = !e.anulado && ['alta', 'edicion', 'anulacion'].indexOf(e.tipo) === -1 && (g || e.usuario === S.usuario.email);
      var acciones = (editable ? '<button class="ev-btn" data-ev-editar="' + e.id + '">Editar</button>' : '') +
        (anulable ? '<button class="ev-btn peligro" data-ev-anular="' + e.id + '">Anular</button>' : '');
      var pie = e.anulado ? '<div class="ev-anulado">Anulado por ' + esc(e.anulado_por || '') + ' · ' + fmtDH(e.anulado_at) + '</div>' : '';
      var cls = (e.tipo === 'comentario' || e.tipo === 'edicion' || e.tipo === 'anulacion' ? 'c' : '') + (e.anulado ? ' anulado' : '');
      return '<li class="' + cls + '" data-ev="' + e.id + '"><time>' + fmtDH(e.fecha) + '</time> <span class="quien">· ' + esc(e.usuario || '') + '</span>' +
        (acciones ? '<span class="ev-acciones">' + acciones + '</span>' : '') +
        '<div class="ev-cuerpo">' + txt + '</div>' + pie + '<div class="ev-form"></div></li>';
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
  var sel = leerTiendas('d');
  if (sel.error) { toast(sel.error, true); return; }
  if (!$('d-desc').value.trim()) { toast('La descripción no puede quedar vacía.', true); return; }
  return accion('editar_reclamo', {
    p_solicitante: $('d-solic').value, p_compromiso: $('d-comp').value || null, p_prioridad: $('d-pri').value,
    p_referencia: $('d-ref').value, p_tipo: $('d-tipo').value, p_motivo: $('d-motivo').value, p_via: $('d-via').value,
    p_proveedor: $('d-prov').value, p_tienda: sel.lista[0], p_categoria: $('d-cat').value, p_descripcion: $('d-desc').value,
    p_tiendas: sel.lista.length > 1 ? sel.lista : []
  }, 'Cambios guardados', 'No se pudo guardar');
}

// Formulario chico dentro del movimiento del historial (editar comentario o confirmar anulación).
function abrirFormEvento(id, modo) {
  document.querySelectorAll('#d-historial .ev-form').forEach(function (f) { f.innerHTML = ''; });
  var li = document.querySelector('#d-historial li[data-ev="' + id + '"]');
  if (!li) return;
  var ev = (S.eventos[S.sel] || []).find(function (e) { return String(e.id) === String(id); });
  var form = li.querySelector('.ev-form');
  form.innerHTML = modo === 'editar'
    ? '<textarea rows="2" class="ev-texto">' + esc(ev && ev.comentario || '') + '</textarea>' +
      '<div class="acciones"><button class="btn ghost chico" data-ev-cerrar>Cancelar</button><button class="btn chico" data-ev-guardar="' + id + '">Guardar</button></div>'
    : '<input class="ev-texto" placeholder="Motivo de la anulación (opcional)">' +
      '<div class="acciones"><button class="btn ghost chico" data-ev-cerrar>Cancelar</button><button class="btn chico peligro" data-ev-confirmar="' + id + '">Confirmar anulación</button></div>';
  form.querySelector('.ev-texto').focus();
}

async function accionEvento(fn, args, ok, textoError) {
  try {
    await ejecutar(fn, Object.assign({ p_usuario: S.usuario.email }, args), ok);
    await recargarReclamo(S.sel);
    render();
  } catch (e) { toast(textoError + ': ' + mensajeError(e), true); }
}

// ---------------------------------------------------------------
// Selector "Una tienda / Grupo de tiendas" (alta = 'n', edición = 'd')
// ---------------------------------------------------------------
S.selT = {};

function armarSelectorTiendas(p, numeros) {
  var grupo = numeros.length > 1;
  S.selT[p] = { grupo: grupo, lista: grupo ? numeros.slice() : [] };
  $(p + '-tiendas-box').innerHTML =
    '<div class="sel-t" data-p="' + p + '">' +
      '<div class="sel-t-modo" role="group" aria-label="Cantidad de tiendas">' +
        '<button type="button" data-modo-t="una" class="' + (grupo ? '' : 'on') + '">Una tienda</button>' +
        '<button type="button" data-modo-t="grupo" class="' + (grupo ? 'on' : '') + '">Grupo de tiendas</button></div>' +
      '<input id="' + p + '-tienda" class="in-tienda" list="lista-tiendas" autocomplete="off" value="' + esc(!grupo && numeros[0] ? nombreTienda(numeros[0]) : '') + '">' +
      '<div class="sel-t-chips" id="' + p + '-chips"></div>' +
    '</div>';
  pintarSelectorTiendas(p);
}

function pintarSelectorTiendas(p) {
  var st = S.selT[p], box = $(p + '-tiendas-box');
  if (!st || !box) return;
  box.querySelectorAll('[data-modo-t]').forEach(function (b) { b.classList.toggle('on', (b.dataset.modoT === 'grupo') === st.grupo); });
  $(p + '-tienda').placeholder = st.grupo
    ? 'Elegí tiendas de a una para sumarlas, o pegá varios números separados por coma'
    : 'Escribí número o nombre y elegí de la lista';
  var chips = $(p + '-chips');
  chips.hidden = !st.grupo;
  chips.innerHTML = st.lista.map(function (n) {
    return '<span class="chip-t">' + esc(nombreTienda(n)) + '<button type="button" data-quitar-t="' + n + '" aria-label="Quitar ' + esc(nombreTienda(n)) + '">✕</button></span>';
  }).join('') + (st.lista.length
    ? '<span class="sel-t-n">' + st.lista.length + (st.lista.length === 1 ? ' tienda' : ' tiendas') + '</span><button type="button" class="link-btn" data-vaciar-t>Quitar todas</button>'
    : '<span class="sel-t-n">Todavía no sumaste tiendas.</span>');
}

// Suma al grupo lo escrito en el campo. estricto = sólo nombres completos (elegidos de la lista).
function sumarTiendasDelCampo(p, estricto) {
  var st = S.selT[p], inp = $(p + '-tienda');
  var piezas = inp.value.split(/[,;\n]+/), quedan = [];
  piezas.forEach(function (txt) {
    txt = txt.trim();
    if (!txt) return;
    var n = estricto ? tiendaPorNombre(txt) : tiendaDeTexto(txt);
    if (n) { if (st.lista.indexOf(n) === -1) st.lista.push(n); } else quedan.push(txt);
  });
  inp.value = quedan.join(', ');
  pintarSelectorTiendas(p);
}

function cambiarModoTiendas(p, grupo) {
  var st = S.selT[p], inp = $(p + '-tienda');
  if (st.grupo === grupo) return;
  st.grupo = grupo;
  if (grupo) sumarTiendasDelCampo(p, false);
  else { inp.value = st.lista.length ? nombreTienda(st.lista[0]) : inp.value; }
  pintarSelectorTiendas(p);
  inp.focus();
}

// Devuelve { lista: [números] } o { error }.
function leerTiendas(p) {
  var st = S.selT[p], inp = $(p + '-tienda');
  if (!st.grupo) {
    var n = tiendaDeTexto(inp.value);
    return n ? { lista: [n] } : { error: 'Elegí la tienda de la lista (podés escribir el número o el nombre).' };
  }
  sumarTiendasDelCampo(p, false);
  if (inp.value.trim()) return { error: 'No encontré esta tienda: ' + inp.value.trim() + '. Elegila de la lista.' };
  if (!st.lista.length) return { error: 'Sumá al menos una tienda al grupo.' };
  return { lista: st.lista.slice() };
}

function tiendaPorNombre(txt) {
  txt = (txt || '').trim().toLowerCase();
  var n = Object.keys(S.tiendas).find(function (k) { return (S.tiendas[k].local || '').toLowerCase() === txt; });
  return n ? Number(n) : null;
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
  var sel = leerTiendas('n');
  if (sel.error) { err.textContent = sel.error; err.hidden = false; return; }
  var btn = $('btn-guardar'); btn.disabled = true; btn.textContent = 'Registrando…';
  try {
    var id = await ejecutar('crear_reclamo', {
      p_usuario: S.usuario.email, p_proveedor: $('n-prov').value, p_tienda: sel.lista[0], p_tiendas: sel.lista.length > 1 ? sel.lista : null,
      p_categoria: $('n-cat').value,
      p_descripcion: $('n-desc').value, p_prioridad: $('n-pri').value, p_via: $('n-via').value,
      p_solicitante: $('n-solic').value, p_compromiso: $('n-comp').value || null, p_referencia: $('n-ref').value,
      p_tipo: $('n-tipo').value, p_motivo: $('n-motivo').value
    });
    await recargarReclamo(id);
    S.sel = id;
    $('f-nuevo').reset();
    armarSelectorTiendas('n', []);
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
  var cols = ['ID', 'Fecha alta', 'Proveedor', 'Tipo', 'Motivo', 'Tienda', 'Formato', 'Región', 'Tiendas del grupo', 'Categoría', 'Descripción', 'Prioridad', 'Vía',
    'Estado', 'Días abiertos', 'Antigüedad', 'Vencido', 'Fecha compromiso', 'Fecha cierre', 'Quién reclamó', 'Referencia',
    'En manos de', 'Veces reclamado', 'Devoluciones', 'Reaperturas'];
  var filas = filtrados().map(function (r) {
    var t = tienda(r);
    return [r.id, fmtD(r.fecha_alta), r.proveedor, r.tipo, r.motivo, t ? t.local : '', t ? t.formato : '', regionDe(t), tiendasDe(r).length > 1 ? tiendasDe(r).map(nombreTienda).join(' | ') : '', r.categoria, r.descripcion,
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
  var ordenGuardado = leerLocal('reclamos_orden');
  if (ordenGuardado) $('f-orden').value = ordenGuardado;
  $('f-orden').addEventListener('input', function () { guardarLocal('reclamos_orden', $('f-orden').value); render(); });
  $('lista-info').addEventListener('click', function (e) {
    var b = e.target.closest('[data-quitar]');
    if (b) quitarFiltro(b.dataset.quitar);
  });
  // Flechas ↑/↓ recorren la lista (salvo que se esté escribiendo o haya un desplegable abierto).
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    if (!S.usuario || !$('sheet').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, .andes-select, .andes-panel')) return;
    if (document.querySelector('.andes-panel') && document.querySelector('.andes-panel').offsetParent) return;
    e.preventDefault();
    moverSeleccion(e.key === 'ArrowDown' ? 1 : -1);
  });
  window.addEventListener('hashchange', function () { if (S.usuario) abrirDesdeUrl(); });
  document.addEventListener('click', function (e) {
    var box = e.target.closest('.sel-t');
    if (!box) return;
    var p = box.dataset.p, b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.modoT) cambiarModoTiendas(p, b.dataset.modoT === 'grupo');
    else if (b.dataset.quitarT) { S.selT[p].lista = S.selT[p].lista.filter(function (n) { return String(n) !== b.dataset.quitarT; }); pintarSelectorTiendas(p); }
    else if (b.hasAttribute('data-vaciar-t')) { S.selT[p].lista = []; pintarSelectorTiendas(p); }
  });
  document.addEventListener('input', function (e) {
    if (!e.target.classList.contains('in-tienda')) return;
    var p = e.target.closest('.sel-t').dataset.p;
    if (!S.selT[p].grupo) return;
    // Al elegir de la lista llega el nombre completo; si pegan varios separados por coma, se suman todos.
    sumarTiendasDelCampo(p, !/[,;\n]/.test(e.target.value));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || !e.target.classList || !e.target.classList.contains('in-tienda')) return;
    var p = e.target.closest('.sel-t').dataset.p;
    if (!S.selT[p].grupo) return;
    e.preventDefault();
    sumarTiendasDelCampo(p, false);
  });
  $('kpis').addEventListener('click', function (e) {
    var k = e.target.closest('[data-filtro]');
    if (k) { $('f-estado').value = k.dataset.filtro; render(); }
  });
  $('rows').addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    seleccionar(tr.dataset.id, false);
    if (window.innerWidth <= 1100) $('detalle').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('rows').addEventListener('keydown', function (e) {
    var tr = e.target.closest('tr[data-id]');
    if (tr && e.key === 'Enter') seleccionar(tr.dataset.id, false);
  });
  $('detalle').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.estado) return cambiarEstado(b.dataset.estado);
    if (b.dataset.area) return derivar(b.dataset.area);
    if (b.id === 'd-btn-reiterar') return reiterar();
    if (b.id === 'd-btn-coment') return comentar();
    if (b.id === 'd-btn-guardar') return guardarEdicion();
    if (b.dataset.nav) return moverSeleccion(Number(b.dataset.nav));
    if (b.hasAttribute('data-cerrar-det')) return seleccionar(null, false);
    if (b.hasAttribute('data-copiar-link')) {
      var link = location.origin + location.pathname + '#' + S.sel;
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject())
        .then(function () { toast('Link copiado: ' + S.sel); }, function () { prompt('Copiá este link:', link); });
      return;
    }
    if (b.id === 'd-btn-cancelar') { renderDetalle(); toast('Cambios descartados'); return; }
    if (b.dataset.evEditar) return abrirFormEvento(b.dataset.evEditar, 'editar');
    if (b.dataset.evAnular) return abrirFormEvento(b.dataset.evAnular, 'anular');
    if (b.hasAttribute('data-ev-cerrar')) { b.closest('.ev-form').innerHTML = ''; return; }
    if (b.dataset.evGuardar) {
      return accionEvento('editar_comentario_evento', { p_evento_id: Number(b.dataset.evGuardar), p_texto: b.closest('.ev-form').querySelector('.ev-texto').value },
        'Comentario corregido', 'No se pudo corregir');
    }
    if (b.dataset.evConfirmar) {
      return accionEvento('anular_evento', { p_evento_id: Number(b.dataset.evConfirmar), p_motivo: b.closest('.ev-form').querySelector('.ev-texto').value },
        'Movimiento anulado', 'No se pudo anular');
    }
  });
  $('btn-nuevo').onclick = function () {
    $('n-error').hidden = true;
    if (!$('n-solic').value && S.usuario) $('n-solic').value = S.usuario.nombre || '';
    if (!S.selT.n) armarSelectorTiendas('n', []);
    Andes.refrescar();
    $('sheet').hidden = false;
    $('n-tienda').focus();
  };
  $('btn-cancelar').onclick = function () { Andes.cerrar(); $('sheet').hidden = true; };
  $('sheet').addEventListener('click', function (e) { if (e.target.id === 'sheet') $('sheet').hidden = true; });
  $('f-nuevo').addEventListener('submit', crear);
  $('btn-csv').onclick = exportarCSV;
  // Al volver a la pestaña, se refrescan los datos (otro usuario pudo cambiar algo).
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && S.usuario) cargarTodo().catch(function () { });
  });

  Andes.mejorar(document);
  var mail = leerLocal('reclamos_mail');
  if (mail) { $('login-mail').value = mail; entrar(); } else vista('login');
});
