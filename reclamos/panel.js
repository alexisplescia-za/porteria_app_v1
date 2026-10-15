// Reclamos EE — vistas "Dashboard" y "Desarrollo" (tareas del proyecto).
// Usa el estado y las utilidades de app.js (S, $, esc, vigentes_, vencido, dias, ejecutar, toast…).

// ---------------------------------------------------------------
// Colores por sistema (validados para daltonismo en claro y oscuro)
// ---------------------------------------------------------------
var COLOR_SISTEMA = {
  light: { BMS: '#1E9E5E', PME: '#7C5CE0', CONSUMO: '#D93A3F', PREDIAL: '#2F7FD8', MULTA: '#C2409A', OTRO: '#B87D00' },
  dark:  { BMS: '#33AD6E', PME: '#9278F2', CONSUMO: '#EE5A60', PREDIAL: '#4A92EE', MULTA: '#D957AC', OTRO: '#BB831F' }
};
function colorSistema(nombre) {
  var p = COLOR_SISTEMA[window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'];
  var k = String(nombre || '').toUpperCase();
  if (k.indexOf('BMS') === 0) return p.BMS;
  if (k.indexOf('PME') === 0) return p.PME;
  if (k.indexOf('CONSUMO') === 0) return p.CONSUMO;
  if (k.indexOf('PREDIAL') === 0) return p.PREDIAL;
  if (k.indexOf('MULTA') === 0) return p.MULTA;
  return p.OTRO;
}

function plural_(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }
var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
var TAB = 'tickets';

// ---------------------------------------------------------------
// Pestañas
// ---------------------------------------------------------------
function cambiarTab(nombre) {
  if (nombre === 'dev' && !esGestor()) nombre = 'tickets';
  TAB = nombre;
  try { localStorage.setItem('reclamos_tab', nombre); } catch (e) { }
  ['tickets', 'dashboard', 'dev'].forEach(function (t) {
    $('t-' + t).hidden = t !== nombre;
    var b = document.querySelector('#tabs [data-tab="' + t + '"]');
    if (b) { b.classList.toggle('on', t === nombre); b.setAttribute('aria-selected', t === nombre ? 'true' : 'false'); }
  });
  renderPanel();
}

function renderPanel() {
  if (!S.usuario) return;
  $('tab-dev').hidden = !esGestor();
  if (TAB === 'dashboard') renderDashboard();
  if (TAB === 'dev') renderTareas();
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------
function periodoDashboard() {
  var el = $('db-periodo');
  return el ? el.value : '12m';
}

function mesesDelPeriodo(lista, periodo) {
  var hoy = new Date(), fin = new Date(hoy.getFullYear(), hoy.getMonth(), 1), ini;
  if (periodo === 'anio') ini = new Date(hoy.getFullYear(), 0, 1);
  else if (periodo === 'todo') {
    var primero = lista.reduce(function (m, r) { var d = new Date(r.fecha_alta); return d < m ? d : m; }, fin);
    ini = new Date(primero.getFullYear(), primero.getMonth(), 1);
    if ((fin.getFullYear() - ini.getFullYear()) * 12 + fin.getMonth() - ini.getMonth() > 23) ini = new Date(fin.getFullYear(), fin.getMonth() - 23, 1);
  } else ini = new Date(fin.getFullYear(), fin.getMonth() - 11, 1);
  var out = [];
  for (var d = new Date(ini); d <= fin; d.setMonth(d.getMonth() + 1)) out.push({ y: d.getFullYear(), m: d.getMonth() });
  return out;
}

function enPeriodo(r, meses) {
  if (!meses.length) return false;
  var d = new Date(r.fecha_alta), a = meses[0], z = meses[meses.length - 1];
  var v = d.getFullYear() * 12 + d.getMonth();
  return v >= a.y * 12 + a.m && v <= z.y * 12 + z.m;
}

// Orden fijo en el dashboard: el que pasó la validación de colores (vecinos distinguibles con daltonismo).
var ORDEN_SISTEMA = ['BMS', 'PME', 'CONSUMO', 'PREDIAL', 'MULTA'];
function rangoSistema(nombre) {
  var k = String(nombre || '').toUpperCase();
  for (var i = 0; i < ORDEN_SISTEMA.length; i++) if (k.indexOf(ORDEN_SISTEMA[i]) === 0) return i;
  return 99;
}
function sistemasDe(lista) {
  var out = S.provs.slice();
  lista.forEach(function (r) { if (out.indexOf(r.proveedor) === -1) out.push(r.proveedor); });
  return out.sort(function (a, b) { return rangoSistema(a) - rangoSistema(b); });
}

function renderDashboard() {
  var cont = $('t-dashboard');
  var todos = vigentes_();
  var periodo = periodoDashboard();
  var meses = mesesDelPeriodo(todos, periodo);
  var lista = todos.filter(function (r) { return enPeriodo(r, meses); });
  var abiertos = lista.filter(function (r) { return r.estado !== 'Cerrado'; });
  var cerrados = lista.filter(function (r) { return r.estado === 'Cerrado'; });
  var prom = cerrados.length ? (cerrados.reduce(function (a, r) { return a + dias(r); }, 0) / cerrados.length).toFixed(1).replace('.', ',') : '–';
  var sistemas = sistemasDe(lista);
  var porSis = sistemas.map(function (s) {
    var l = lista.filter(function (r) { return r.proveedor === s; });
    var ab = l.filter(function (r) { return r.estado !== 'Cerrado'; });
    var ce = l.filter(function (r) { return r.estado === 'Cerrado'; });
    return {
      nombre: s, color: colorSistema(s), total: l.length, abiertos: ab.length, cerrados: ce.length,
      vencidos: ab.filter(vencido).length,
      reclamos: l.reduce(function (a, r) { return a + vecesReclamado(r); }, 0),
      respuestas: l.reduce(function (a, r) { return a + (r.respuestas || 0); }, 0),
      prom: ce.length ? (ce.reduce(function (a, r) { return a + dias(r); }, 0) / ce.length).toFixed(1).replace('.', ',') : '–'
    };
  });
  var conDatos = porSis.filter(function (s) { return s.total > 0; });

  var html =
    '<div class="db-barra"><label>Período <select id="db-periodo">' +
      [['12m', 'Últimos 12 meses'], ['anio', 'Este año'], ['todo', 'Todo']].map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === periodo ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></label>' +
      '<span class="desc-in">Sin tickets anulados. Tocá un sistema para ver sus tickets.</span></div>' +

    '<div class="kpis db-kpis">' +
      kpi_('Tickets', lista.length) + kpi_('Abiertos', abiertos.length) + kpi_('Cerrados', cerrados.length) +
      kpi_('Vencidos', abiertos.filter(vencido).length, 'bad') + kpi_('Promedio de resolución', prom, '', 'días') +
    '</div>' +

    '<div class="db-sistemas">' + porSis.map(function (s) {
      return '<button class="db-sis" data-ir-sistema="' + esc(s.nombre) + '" style="--c:' + s.color + '">' +
        '<span class="db-sis-n"><i style="background:' + s.color + '"></i>' + esc(s.nombre) + '</span>' +
        '<b>' + s.total + '</b><span class="desc-in">' + plural_(s.abiertos, 'abierto', 'abiertos') + ' · ' +
        plural_(s.vencidos, 'vencido', 'vencidos') + ' · ' + plural_(s.respuestas, 'respuesta', 'respuestas') + '</span></button>';
    }).join('') + '</div>' +

    '<div class="db-graficos">' +
      '<div class="card db-card"><h3>Tickets por sistema</h3>' + donut_(conDatos, 'total', 'tickets') + '</div>' +
      '<div class="card db-card"><h3>Abiertos por sistema</h3>' + donut_(conDatos.filter(function (s) { return s.abiertos; }), 'abiertos', 'abiertos') + '</div>' +
    '</div>' +

    '<div class="card db-card" id="db-card-barras"><h3>Tickets por mes y sistema</h3>' + barras_(lista, meses, conDatos, Math.max(520, cont.clientWidth - 34)) + '</div>' +

    '<div class="card db-card"><h3>Comparativa entre sistemas</h3><div class="seg-tabla"><table class="db-tabla"><thead><tr>' +
      ['Sistema', 'Tickets', 'Abiertos', 'Cerrados', 'Vencidos', 'Veces reclamado', 'Respuestas', 'Prom. días resolución']
        .map(function (h, i) { return '<th' + (i ? ' class="n"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      porSis.map(function (s) {
        return '<tr><td><i class="db-dot" style="background:' + s.color + '"></i>' + esc(s.nombre) + '</td>' +
          [s.total, s.abiertos, s.cerrados, s.vencidos, s.reclamos, s.respuestas, s.prom].map(function (v) { return '<td class="n">' + v + '</td>'; }).join('') + '</tr>';
      }).join('') +
    '</tbody></table></div></div>';

  cont.innerHTML = html;
  Andes.mejorar(cont);
  // Si se dibujó con la pantalla todavía oculta (ancho 0), se redibuja apenas se vea.
  if (!cont.clientWidth) setTimeout(function () { if (TAB === 'dashboard' && cont.clientWidth) renderDashboard(); }, 80);
}

function kpi_(label, valor, cls, unidad) {
  return '<div class="kpi' + (cls ? ' ' + cls : '') + '"><div class="l">' + label + '</div><div class="v">' + valor +
    (unidad ? ' <span class="kpi-u">' + unidad + '</span>' : '') + '</div></div>';
}

// Anillo: un segmento por sistema, con 2px de separación y el total al centro.
function donut_(series, campo, unidad) {
  var total = series.reduce(function (a, s) { return a + s[campo]; }, 0);
  if (!total) return '<p class="empty">Sin datos en el período.</p>';
  var R = 62, C = 2 * Math.PI * R, ini = 0, gap = series.length > 1 ? 2 : 0;
  var segs = series.map(function (s) {
    var largo = s[campo] / total * C;
    var trazo = Math.max(largo - gap, 0.5);
    var out = '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="' + s.color + '" stroke-width="20" ' +
      'stroke-dasharray="' + trazo.toFixed(2) + ' ' + (C - trazo).toFixed(2) + '" stroke-dashoffset="' + (-ini).toFixed(2) + '" ' +
      'transform="rotate(-90 80 80)"><title>' + esc(s.nombre) + ': ' + s[campo] + ' ' + unidad + ' (' + Math.round(s[campo] / total * 100) + '%)</title></circle>';
    ini += largo;
    return out;
  }).join('');
  return '<div class="db-donut"><svg viewBox="0 0 160 160" role="img" aria-label="Distribución de ' + unidad + ' por sistema">' +
    '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="var(--surface-2)" stroke-width="20"/>' + segs +
    '<text x="80" y="78" text-anchor="middle" class="db-donut-v">' + total + '</text>' +
    '<text x="80" y="98" text-anchor="middle" class="db-donut-l">' + unidad + '</text></svg>' +
    '<ul class="db-leyenda">' + series.map(function (s) {
      return '<li><i style="background:' + s.color + '"></i><span>' + esc(s.nombre) + '</span><b>' + s[campo] + '</b>' +
        '<span class="desc-in">' + Math.round(s[campo] / total * 100) + '%</span></li>';
    }).join('') + '</ul></div>';
}

// Barras agrupadas: un grupo por mes, una barra por sistema (mismo eje, misma escala).
function barras_(lista, meses, series, ancho) {
  if (!series.length) return '<p class="empty">Sin tickets en el período.</p>';
  var W = Math.round(ancho || 760), H = 260, M = { t: 16, r: 8, b: 34, l: 32 };
  var pw = W - M.l - M.r, ph = H - M.t - M.b;
  var datos = meses.map(function (mm) {
    return series.map(function (s) {
      return lista.filter(function (r) {
        var d = new Date(r.fecha_alta);
        return r.proveedor === s.nombre && d.getFullYear() === mm.y && d.getMonth() === mm.m;
      }).length;
    });
  });
  var max = Math.max(1, Math.max.apply(null, datos.map(function (g) { return Math.max.apply(null, g); })));
  var paso = max <= 5 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5);
  var tope = Math.ceil(max / paso) * paso;
  var y = function (v) { return M.t + ph - v / tope * ph; };
  var gw = pw / meses.length, bw = Math.max(Math.min((gw * 0.78) / series.length - 2, 26), 3);
  var grid = '';
  for (var v = 0; v <= tope; v += paso) {
    grid += '<line x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="db-grid"/>' +
      '<text x="' + (M.l - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" class="db-eje">' + v + '</text>';
  }
  var barras = '', etiquetas = '';
  meses.forEach(function (mm, i) {
    var x0 = M.l + i * gw + (gw - (bw + 2) * series.length + 2) / 2;
    series.forEach(function (s, j) {
      var val = datos[i][j];
      if (!val) return;
      var x = x0 + j * (bw + 2), top = y(val), h = M.t + ph - top, rr = Math.min(3, h / 2, bw / 2);
      barras += '<path d="M' + x + ',' + (top + h) + 'V' + (top + rr) + 'Q' + x + ',' + top + ' ' + (x + rr) + ',' + top +
        'H' + (x + bw - rr) + 'Q' + (x + bw) + ',' + top + ' ' + (x + bw) + ',' + (top + rr) + 'V' + (top + h) + 'Z" fill="' + s.color + '">' +
        '<title>' + esc(s.nombre) + ' · ' + MESES_CORTOS[mm.m] + ' ' + mm.y + ': ' + val + (val === 1 ? ' ticket' : ' tickets') + '</title></path>';
    });
    if (meses.length <= 12 || i % 2 === 0) {
      etiquetas += '<text x="' + (M.l + i * gw + gw / 2) + '" y="' + (H - M.b + 16) + '" text-anchor="middle" class="db-eje">' +
        MESES_CORTOS[mm.m] + (mm.m === 0 || i === 0 ? ' ' + String(mm.y).slice(2) : '') + '</text>';
    }
  });
  return '<ul class="db-leyenda db-leyenda-h">' + series.map(function (s) {
      return '<li><i style="background:' + s.color + '"></i><span>' + esc(s.nombre) + '</span><b>' + s.total + '</b></li>';
    }).join('') + '</ul>' +
    '<div class="db-barras"><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Tickets por mes y sistema">' +
    grid + '<line x1="' + M.l + '" x2="' + (W - M.r) + '" y1="' + (M.t + ph) + '" y2="' + (M.t + ph) + '" class="db-base"/>' +
    barras + etiquetas + '</svg></div>';
}

// ---------------------------------------------------------------
// Desarrollo: tareas pendientes del proyecto
// ---------------------------------------------------------------
var AREAS = ['Reclamos', 'Frío', 'Portería', 'Seguridad', 'Backup', 'General'];
var ESTADOS_TAREA = ['Pendiente', 'En curso', 'Hecho'];
var PESO_TAREA = { Alta: 1, Media: 2, Baja: 3 };
S.tareas = null;

async function cargarTareas() {
  var r = await supabase.from('dev_tareas').select('*').neq('estado', 'Descartada').order('creado_at', { ascending: true });
  if (r.error) throw r.error;
  S.tareas = r.data || [];
}

async function renderTareas() {
  var cont = $('t-dev');
  if (S.tareas === null) {
    cont.innerHTML = '<p class="empty">Cargando tareas…</p>';
    try { await cargarTareas(); } catch (e) {
      cont.innerHTML = '<p class="empty">No se pudieron cargar las tareas (' + esc(mensajeError(e)) + '). ¿Ya se corrió el SQL 018?</p>';
      return;
    }
  }
  var filtroArea = (leerLocal('dev_area') || '');
  var lista = S.tareas.filter(function (t) { return !filtroArea || t.area === filtroArea; });
  var cuenta = function (e) { return lista.filter(function (t) { return t.estado === e; }).length; };
  cont.innerHTML =
    '<div class="dev-cab"><div><h2>Tareas del proyecto</h2>' +
      '<span class="desc-in">' + cuenta('Pendiente') + ' pendientes · ' + cuenta('En curso') + ' en curso · ' + cuenta('Hecho') + ' hechas</span></div>' +
      '<div class="dev-acc"><select id="dev-area" aria-label="Filtrar por área">' + opciones(AREAS, filtroArea, 'Todas las áreas') + '</select>' +
      '<button class="btn chico" id="dev-nueva">+ Nueva tarea</button></div></div>' +
    '<div class="card dev-form" id="dev-form" hidden>' +
      '<input id="dev-titulo" placeholder="Qué hay que hacer">' +
      '<textarea id="dev-detalle" rows="2" placeholder="Detalle, pasos o contexto (opcional)"></textarea>' +
      '<div class="two"><select id="dev-f-area">' + opciones(AREAS, filtroArea || 'General') + '</select>' +
      '<select id="dev-f-pri">' + opciones(['Alta', 'Media', 'Baja'], 'Media') + '</select></div>' +
      '<div class="acciones"><button class="btn ghost chico" id="dev-cancelar">Cancelar</button><button class="btn chico" id="dev-guardar">Agregar tarea</button></div></div>' +
    '<div class="dev-tablero">' + ESTADOS_TAREA.map(function (e) {
      var col = lista.filter(function (t) { return t.estado === e; }).sort(function (a, b) {
        if (e === 'Hecho') return new Date(b.completado_at) - new Date(a.completado_at);
        return (PESO_TAREA[a.prioridad] - PESO_TAREA[b.prioridad]) || (new Date(a.creado_at) - new Date(b.creado_at));
      });
      return '<section class="dev-col"><h3>' + e + ' <span class="desc-in">' + col.length + '</span></h3>' +
        (col.map(tarjetaTarea_).join('') || '<p class="empty dev-vacio">Nada por acá.</p>') + '</section>';
    }).join('') + '</div>';
  Andes.mejorar(cont);
}

function tarjetaTarea_(t) {
  var botones = t.estado === 'Pendiente'
    ? '<button class="ev-btn" data-tarea="' + t.id + '" data-a="En curso">Empezar</button><button class="ev-btn ok-txt" data-tarea="' + t.id + '" data-a="Hecho">Hecha</button><button class="ev-btn peligro" data-tarea="' + t.id + '" data-a="Descartada">Descartar</button>'
    : t.estado === 'En curso'
      ? '<button class="ev-btn ok-txt" data-tarea="' + t.id + '" data-a="Hecho">Hecha</button><button class="ev-btn" data-tarea="' + t.id + '" data-a="Pendiente">Volver a pendiente</button>'
      : '<button class="ev-btn" data-tarea="' + t.id + '" data-a="Pendiente">Reabrir</button>';
  return '<article class="dev-tarea pri-' + esc(t.prioridad) + (t.estado === 'Hecho' ? ' hecha' : '') + '">' +
    '<div class="dev-tags"><span class="chip ' + (CLASE_PRIORIDAD[t.prioridad] || 'a0') + '">' + esc(t.prioridad) + '</span><span class="sector">' + esc(t.area) + '</span></div>' +
    '<h4>' + esc(t.titulo) + '</h4>' + (t.detalle ? '<p>' + esc(t.detalle) + '</p>' : '') +
    '<div class="desc-in">' + (t.estado === 'Hecho' && t.completado_at
      ? 'Hecha el ' + fmtD(t.completado_at) + ' por ' + esc(nombreUsuario(t.completado_por))
      : 'Cargada el ' + fmtD(t.creado_at) + ' por ' + esc(nombreUsuario(t.creado_por))) + '</div>' +
    '<div class="dev-btns">' + botones + '</div></article>';
}

async function accionTarea(fn, args, ok) {
  try {
    await ejecutar(fn, Object.assign({ p_usuario: S.usuario.email }, args), ok);
    await cargarTareas();
    renderTareas();
  } catch (e) { toast('No se pudo guardar: ' + mensajeError(e), true); }
}

// ---------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  try { TAB = localStorage.getItem('reclamos_tab') || 'tickets'; } catch (e) { }
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]');
    if (b) cambiarTab(b.dataset.tab);
  });
  $('t-dashboard').addEventListener('input', function (e) { if (e.target.id === 'db-periodo') renderDashboard(); });
  $('t-dashboard').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ir-sistema]');
    if (!b) return;
    $('f-prov').value = b.dataset.irSistema;
    Andes.refrescar();
    cambiarTab('tickets');
    render();
  });
  $('t-dev').addEventListener('input', function (e) {
    if (e.target.id === 'dev-area') { guardarLocal('dev_area', e.target.value); renderTareas(); }
  });
  $('t-dev').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'dev-nueva') { $('dev-form').hidden = false; $('dev-titulo').focus(); return; }
    if (b.id === 'dev-cancelar') { $('dev-form').hidden = true; return; }
    if (b.id === 'dev-guardar') {
      var tit = $('dev-titulo').value.trim();
      if (!tit) { toast('Escribí qué hay que hacer.', true); $('dev-titulo').focus(); return; }
      return accionTarea('crear_tarea', { p_titulo: tit, p_detalle: $('dev-detalle').value, p_area: $('dev-f-area').value, p_prioridad: $('dev-f-pri').value }, 'Tarea agregada');
    }
    if (b.dataset.tarea) {
      var msgs = { 'En curso': 'Tarea en curso', Hecho: 'Tarea hecha ✓', Pendiente: 'Tarea pendiente', Descartada: 'Tarea descartada' };
      return accionTarea('actualizar_tarea', { p_id: Number(b.dataset.tarea), p_estado: b.dataset.a }, msgs[b.dataset.a]);
    }
  });
  // Al cambiar el ancho de la ventana se redibuja (el gráfico se dibuja al ancho real).
  var _rz;
  window.addEventListener('resize', function () { clearTimeout(_rz); _rz = setTimeout(function () { if (TAB === 'dashboard') renderDashboard(); }, 200); });
  // El dashboard sigue el tema del sistema: si cambia, se redibuja con los colores del otro modo.
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderPanel);
});
