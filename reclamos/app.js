// Reclamos a Proveedores — Eficiencia Energética.
// Frontend conectado directo a Supabase (mismo proyecto que Frío Alimentario).
// Las escrituras pasan por funciones de la base (crear_reclamo, cambiar_estado_reclamo,
// editar_reclamo, comentar_reclamo) que validan el usuario, generan el ID y dejan historial.

var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

var ESTADOS = ['Nuevo', 'Enviado al proveedor', 'Respuesta proveedor', 'En resolución', 'Pendiente validación', 'Escalado', 'Reabierto', 'Cerrado'];
var COLOR_FORMATO = { HIPERMERCADO: 'var(--hiper)', MAXI: 'var(--maxi)', MARKET: 'var(--market)', EXPRESS: 'var(--express)' };
var TRAMOS = [['0-7 días', 'var(--line)'], ['8-15 días', 'var(--warn)'], ['16-30 días', 'var(--orange)'], ['+30 días', 'var(--bad)']];
var DIA = 864e5;

var S = { usuario: null, tiendas: {}, provs: [], cats: [], reclamos: [], eventos: {}, sel: null };

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
    traerTodo('reclamos', '*', function (q) { return q.order('fecha_alta', { ascending: false }); })
  ]);
  if (r[1].error) throw r[1].error;
  if (r[2].error) throw r[2].error;
  S.tiendas = {};
  r[0].forEach(function (t) { S.tiendas[t.numero] = t; });
  S.provs = r[1].data.map(function (p) { return p.nombre; });
  S.cats = r[2].data.map(function (c) { return c.nombre; });
  S.reclamos = r[3];
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
  var fp = $('f-prov'), actualP = fp.value;
  fp.innerHTML = '<option value="">Todos los proveedores</option>' + S.provs.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
  fp.value = actualP;
  var regiones = {};
  Object.keys(S.tiendas).forEach(function (n) { regiones[regionDe(S.tiendas[n])] = true; });
  var fr = $('f-region'), actualR = fr.value;
  fr.innerHTML = '<option value="">Todas las regiones</option>' + Object.keys(regiones).sort().map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
  fr.value = actualR;
  $('n-prov').innerHTML = S.provs.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');
  $('n-cat').innerHTML = S.cats.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
  $('lista-tiendas').innerHTML = Object.keys(S.tiendas).map(function (n) {
    return '<option value="' + esc(S.tiendas[n].local || n) + '">';
  }).join('');
}

// ---------------------------------------------------------------
// Consola
// ---------------------------------------------------------------

function filtrados() {
  var q = $('q').value.toLowerCase().trim(), fp = $('f-prov').value, fr = $('f-region').value, fe = $('f-estado').value;
  return S.reclamos.filter(function (r) {
    var t = tienda(r);
    if (fp && r.proveedor !== fp) return false;
    if (fr && regionDe(t) !== fr) return false;
    if (fe === 'abiertos' && r.estado === 'Cerrado') return false;
    if (fe === 'vencidos' && !vencido(r)) return false;
    if (fe === 'mas30' && (r.estado === 'Cerrado' || dias(r) <= 30)) return false;
    if (fe === 'Cerrado' && r.estado !== 'Cerrado') return false;
    if (!q) return true;
    return [r.id, t && t.local, r.tienda_numero, r.descripcion, r.categoria, r.referencia, r.responsable]
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
  $('kpis').innerHTML =
    '<div class="kpi clic" data-filtro="abiertos"><div class="l">Abiertos</div><div class="v">' + abiertos.length + '</div></div>' +
    '<div class="kpi bad clic" data-filtro="vencidos"><div class="l">Vencidos (pasó la fecha del proveedor)</div><div class="v">' + abiertos.filter(vencido).length + '</div></div>' +
    '<div class="kpi warn clic" data-filtro="mas30"><div class="l">Más de 30 días</div><div class="v">' + abiertos.filter(function (r) { return dias(r) > 30; }).length + '</div></div>' +
    '<div class="kpi"><div class="l">Escalados</div><div class="v">' + abiertos.filter(function (r) { return r.estado === 'Escalado'; }).length + '</div></div>' +
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

  var lista = filtrados();
  $('rows').innerHTML = lista.length ? lista.map(function (r) {
    var ag = aging(r), t = tienda(r);
    var colorF = t ? (COLOR_FORMATO[String(t.formato).toUpperCase()] || 'var(--muted)') : 'var(--muted)';
    return '<tr class="row ' + (S.sel === r.id ? 'sel' : '') + '" data-id="' + esc(r.id) + '" tabindex="0">' +
      '<td class="id">' + esc(r.id) + '</td>' +
      '<td><b>' + esc(r.proveedor) + '</b><br><span class="desc"><span class="fmt" style="background:' + colorF + '"></span>' + esc(t ? t.local : 'Sin tienda') + '</span></td>' +
      '<td>' + esc(r.categoria) + '<span class="desc">' + esc(r.descripcion) + '</span></td>' +
      '<td class="st">' + esc(r.estado) + (vencido(r) ? '<span class="venc">VENCIDO</span>' : '') + '</td>' +
      '<td><span class="chip ' + ag[1] + '">' + ag[0] + '</span><br><span class="desc">' + dias(r) + ' días</span></td></tr>';
  }).join('') : '<tr><td colspan="5" class="empty">' + (S.reclamos.length ? 'No hay reclamos con estos filtros.' : 'Todavía no hay reclamos. Cargá el primero con "+ Nuevo reclamo".') + '</td></tr>';
  renderDetalle();
}

async function renderDetalle() {
  var cont = $('detalle');
  var r = S.reclamos.find(function (x) { return x.id === S.sel; });
  if (!r) { cont.innerHTML = '<p class="empty">Elegí un reclamo de la lista para ver el detalle, cambiar el estado y ver su historial.</p>'; return; }
  var t = tienda(r), g = esGestor();
  cont.innerHTML =
    '<span class="id">' + esc(r.id) + '</span><h3>' + esc(r.categoria) + '</h3>' +
    '<p style="margin:0;color:var(--muted);font-size:13px">' + esc(r.descripcion) + '</p>' +
    '<dl class="kv">' +
      '<dt>Proveedor</dt><dd>' + esc(r.proveedor) + '</dd>' +
      '<dt>Tienda</dt><dd>' + esc(t ? t.local + ' · ' + t.formato + ' · ' + regionDe(t) : 'Sin tienda') + '</dd>' +
      '<dt>Prioridad</dt><dd>' + esc(r.prioridad) + '</dd>' +
      '<dt>Alta</dt><dd>' + fmtD(r.fecha_alta) + ' · ' + dias(r) + ' días' + (r.estado === 'Cerrado' ? ' (cerrado ' + fmtD(r.fecha_cierre) + ')' : '') + '</dd>' +
      '<dt>Compromiso</dt><dd>' + (r.fecha_compromiso ? fmtD(fechaLocal(r.fecha_compromiso)) : 'Sin fecha') + (vencido(r) ? ' <span class="chip a3">Vencido</span>' : '') + '</dd>' +
      '<dt>Responsable</dt><dd>' + esc(r.responsable || '—') + '</dd>' +
      '<dt>Canal</dt><dd>' + esc(r.canal || '—') + '</dd>' +
      '<dt>Referencia</dt><dd>' + esc(r.referencia || '—') + '</dd>' +
      (r.reaperturas ? '<dt>Reaperturas</dt><dd><span class="chip a2">' + r.reaperturas + '</span></dd>' : '') +
    '</dl>' +
    '<div class="seccion">Estado' + (g ? '' : ' (sólo un gestor puede cambiarlo)') + '</div>' +
    '<div class="flow">' + ESTADOS.map(function (e) {
      return '<button data-estado="' + esc(e) + '" class="' + (e === r.estado ? 'on' : '') + '"' + (g ? '' : ' disabled') + '>' + esc(e) + '</button>';
    }).join('') + '</div>' +
    '<textarea id="d-coment" rows="2" placeholder="Comentario (opcional al cambiar de estado)"></textarea>' +
    '<div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="btn ghost chico" id="d-btn-coment">Agregar comentario</button></div>' +
    (g ? '<div class="seccion">Editar</div><div class="editar">' +
      '<div class="two"><input id="d-resp" placeholder="Responsable" value="' + esc(r.responsable || '') + '">' +
      '<input id="d-comp" type="date" value="' + esc(r.fecha_compromiso || '') + '" title="Fecha comprometida por el proveedor"></div>' +
      '<div class="two"><select id="d-pri">' + ['Alta', 'Media', 'Baja'].map(function (p) { return '<option' + (p === r.prioridad ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select>' +
      '<input id="d-ref" placeholder="Referencia (OT SAP, Mantech, mail)" value="' + esc(r.referencia || '') + '"></div>' +
      '<div style="display:flex;justify-content:flex-end"><button class="btn chico" id="d-btn-guardar">Guardar cambios</button></div></div>' : '') +
    '<div class="seccion">Historial</div><ul class="tl" id="d-historial"><li class="c">Cargando…</li></ul>';

  try {
    var ev = await cargarEventos(r.id);
    if (S.sel !== r.id) return;
    $('d-historial').innerHTML = ev.slice().reverse().map(function (e) {
      var txt = e.tipo === 'estado' ? esc(e.estado_anterior) + ' → <b>' + esc(e.estado_nuevo) + '</b>'
        : e.tipo === 'alta' ? '<b>Reclamo creado</b> · Nuevo' : '';
      if (e.comentario && e.tipo !== 'alta') txt += (txt ? '<br>' : '') + esc(e.comentario);
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

async function cambiarEstado(estado) {
  var r = S.reclamos.find(function (x) { return x.id === S.sel; });
  if (!r || r.estado === estado) return;
  try {
    await ejecutar('cambiar_estado_reclamo', { p_usuario: S.usuario.email, p_id: r.id, p_estado: estado, p_comentario: $('d-coment').value }, 'Estado: ' + estado);
    await recargarReclamo(r.id);
    render();
  } catch (e) { toast('No se pudo cambiar el estado: ' + mensajeError(e), true); }
}

async function comentar() {
  var txt = $('d-coment').value.trim();
  if (!txt) { toast('Escribí el comentario primero.', true); return; }
  try {
    await ejecutar('comentar_reclamo', { p_usuario: S.usuario.email, p_id: S.sel, p_comentario: txt }, 'Comentario agregado');
    await recargarReclamo(S.sel);
    render();
  } catch (e) { toast('No se pudo comentar: ' + mensajeError(e), true); }
}

async function guardarEdicion() {
  try {
    await ejecutar('editar_reclamo', {
      p_usuario: S.usuario.email, p_id: S.sel, p_responsable: $('d-resp').value,
      p_compromiso: $('d-comp').value || null, p_prioridad: $('d-pri').value, p_referencia: $('d-ref').value
    }, 'Cambios guardados');
    await recargarReclamo(S.sel);
    render();
  } catch (e) { toast('No se pudo guardar: ' + mensajeError(e), true); }
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
      p_descripcion: $('n-desc').value, p_prioridad: $('n-pri').value, p_canal: $('n-canal').value,
      p_responsable: $('n-resp').value, p_compromiso: $('n-comp').value || null, p_referencia: $('n-ref').value
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
  var cols = ['ID', 'Fecha alta', 'Proveedor', 'Tienda', 'Formato', 'Región', 'Categoría', 'Descripción', 'Prioridad', 'Canal', 'Estado',
    'Días abiertos', 'Antigüedad', 'Vencido', 'Fecha compromiso', 'Fecha cierre', 'Responsable', 'Referencia', 'Reaperturas'];
  var filas = filtrados().map(function (r) {
    var t = tienda(r);
    return [r.id, fmtD(r.fecha_alta), r.proveedor, t ? t.local : '', t ? t.formato : '', regionDe(t), r.categoria, r.descripcion, r.prioridad,
      r.canal, r.estado, dias(r), aging(r)[0], vencido(r) ? 'Sí' : 'No', r.fecha_compromiso ? fmtD(fechaLocal(r.fecha_compromiso)) : '',
      r.fecha_cierre ? fmtD(r.fecha_cierre) : '', r.responsable, r.referencia, r.reaperturas];
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
  ['q', 'f-prov', 'f-region', 'f-estado'].forEach(function (id) { $(id).addEventListener('input', render); });
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
    var b = e.target.closest('button[data-estado]');
    if (b) return cambiarEstado(b.dataset.estado);
    if (e.target.id === 'd-btn-coment') return comentar();
    if (e.target.id === 'd-btn-guardar') return guardarEdicion();
  });
  $('btn-nuevo').onclick = function () { $('n-error').hidden = true; $('sheet').hidden = false; $('n-tienda').focus(); };
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
