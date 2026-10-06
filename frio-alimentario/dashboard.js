// Dashboard de capacidad instalada vs consumo real de refrigerante (sólo cuentas maestras).
// Usa: tiendas + relevamientos + parametros_kg (capacidad) y consumos_mensuales + objetivos_tienda (consumo).
// Depende de app.js (supabase, STATE, EQUIPOS, calcularCapacidad_, irA, esc_, onError).

// Potencial de calentamiento (GWP, IPCC AR4: el que usan F-Gas y el reporte GreenChill).
var GWP = { R22: 1810, R404: 3922, R410A: 2088, R134a: 1430, R290: 3, R448A: 1387, R449A: 1397, R507: 3985, CO2: 1 };
// Color fijo por refrigerante (la paleta categórica validada; el color sigue al refrigerante, no al ranking).
var COLOR_REF = { R22: '#2a78d6', R404: '#eb6834', R290: '#1baf7a', R410A: '#eda100', R134a: '#e87ba4' };
var COLOR_OTRO = '#898781';
var STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b', muted: '#c3c2b7' };
var OBJETIVO_FUGA = 0.20;     // objetivo de tasa de fuga de Carrefour
var REFERENCIA_GREENCHILL = 0.14;

var DASH = { datos: null, filtros: { region: '', formato: '', periodo: '12m' }, tabla: { orden: 'exceso', desc: true, limite: 30, buscar: '' } };

async function abrirDashboard() {
  irA('loading');
  try {
    if (!DASH.datos) DASH.datos = await cargarDatosDashboard_();
    armarFiltrosDashboard_();
    renderDashboard_();
    irA('dashboard');
  } catch (err) {
    irA('home');
    onError(err);
  }
}

// PostgREST devuelve hasta 1000 filas por pedido: se pagina.
async function traerTodo_(tabla, columnas, filtro) {
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

async function traerOpcional_(tabla, columnas, filtro) {
  try { return await traerTodo_(tabla, columnas, filtro); }
  catch (err) { console.warn(tabla + ':', err.message); return null; }
}

async function cargarDatosDashboard_() {
  var r = await Promise.all([
    traerTodo_('tiendas', 'numero,local,formato,region,m2,jefe_nombre'),
    traerTodo_('relevamientos', '*'),
    traerOpcional_('consumos_mensuales', 'tienda_numero,anio,mes,refrigerante,tipo,kg,importe', function (q) { return q.eq('tipo', 'FA'); }),
    traerOpcional_('objetivos_tienda', 'tienda_numero,anio,objetivo_kg,capacidad_topes_kg')
  ]);
  if (!STATE.params.length) STATE.params = await cargarParametros_();
  var rel = {};
  r[1].forEach(function (x) { rel[x.tienda_numero] = x; });
  var consumos = r[2] || [];
  var ultimo = consumos.reduce(function (m, c) { var k = c.anio * 12 + c.mes; return k > m ? k : m; }, 0);
  return { tiendas: r[0], rel: rel, consumos: consumos, hayConsumos: r[2] !== null && consumos.length > 0,
           objetivos: r[3] || [], ultimoMes: ultimo };
}

// ---------------------------------------------------------------
// Períodos de consumo
// ---------------------------------------------------------------

var MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function mesLabel_(k) { var a = Math.floor((k - 1) / 12), m = ((k - 1) % 12) + 1; return MESES_CORTOS[m - 1] + ' ' + String(a).slice(2); }

function periodos_() {
  var d = DASH.datos;
  if (!d.hayConsumos) return [];
  var u = d.ultimoMes;
  var uAnio = Math.floor((u - 1) / 12), uMes = ((u - 1) % 12) + 1;
  var lista = [{ key: '12m', label: 'Últimos 12 meses (' + mesLabel_(u - 11) + ' – ' + mesLabel_(u) + ')', desde: u - 11, hasta: u, factor: 1 }];
  var anios = {};
  d.consumos.forEach(function (c) { anios[c.anio] = true; });
  Object.keys(anios).map(Number).sort(function (a, b) { return b - a; }).forEach(function (a) {
    var desde = a * 12 + 1, hasta = a * 12 + 12;
    if (a === uAnio && uMes < 12) {
      lista.push({ key: String(a), label: a + ' (ene – ' + MESES_CORTOS[uMes - 1] + ', anualizado)', desde: desde, hasta: u, factor: 12 / uMes });
    } else {
      lista.push({ key: String(a), label: String(a), desde: desde, hasta: hasta, factor: 1 });
    }
  });
  return lista;
}

// ---------------------------------------------------------------
// Cálculo
// ---------------------------------------------------------------

// En tiendas Express la región de Supabase es un número de zona; se agrupan todas como "Express".
function regionDe_(t) {
  return grupoDeFormato_(t.formato) === 'EXPRESS' ? 'Express' : (t.region || 'Sin región');
}

function categoriaEstado_(rel) {
  if (!rel) return 'sin';
  var e = rel.estado;
  if (e === 'ACTUALIZADO' || e === 'SIN NOVEDADES') return 'ok';
  if (e === 'PENDIENTE POZOS Y GONDOLAS') return 'parcial';
  if (e === 'IMPORTADO EXCEL') return 'importado';
  if (e === 'CERRADA') return 'cerrada';
  return 'pendiente';
}
var ESTADOS = [
  { key: 'ok', label: 'Actualizado', color: STATUS.good, icono: '✓' },
  { key: 'parcial', label: 'Parcial (falta pozos/góndolas)', color: STATUS.warning, icono: '◐' },
  { key: 'pendiente', label: 'Pendiente', color: STATUS.critical, icono: '!' },
  { key: 'importado', label: 'Importado del Excel, sin confirmar', color: '#86b6ef', icono: '↓' },
  { key: 'sin', label: 'Sin datos', color: STATUS.muted, icono: '–' },
  { key: 'cerrada', label: 'Tienda cerrada', color: '#52514e', icono: '×' }
];

function nivelFuga_(tasa) {
  if (tasa == null) return { key: 'na', label: 'Sin capacidad', color: STATUS.muted, icono: '–' };
  if (tasa <= 0.10) return { key: 'good', label: 'Mejor práctica (≤10%)', color: STATUS.good, icono: '✓' };
  if (tasa <= OBJETIVO_FUGA) return { key: 'warning', label: 'Dentro del objetivo (≤20%)', color: STATUS.warning, icono: '◐' };
  if (tasa <= 0.35) return { key: 'serious', label: 'Sobre objetivo (20–35%)', color: STATUS.serious, icono: '▲' };
  // Consumir más que toda la carga instalada en un año (el umbral de fuga crónica de la EPA es 125%)
  // suele indicar que la capacidad relevada está incompleta.
  if (tasa > 1.25) return { key: 'revisar', label: 'Revisar capacidad (consumo > 125% de lo instalado)', color: STATUS.critical, icono: '?' };
  return { key: 'critical', label: 'Crítica (>35%)', color: STATUS.critical, icono: '!' };
}

function calcularDashboard_() {
  var d = DASH.datos, f = DASH.filtros;
  var per = periodos_().find(function (p) { return p.key === f.periodo; }) || periodos_()[0];
  var objAnio = per ? Math.floor((per.hasta - 1) / 12) : null;

  var consumoPorTienda = {};
  var mensual = {};
  d.consumos.forEach(function (c) {
    var k = c.anio * 12 + c.mes;
    (consumoPorTienda[c.tienda_numero] = consumoPorTienda[c.tienda_numero] || []).push({ k: k, ref: c.refrigerante, kg: Number(c.kg) || 0, importe: Number(c.importe) || 0 });
  });
  var objetivos = {};
  d.objetivos.forEach(function (o) { if (o.anio === objAnio) objetivos[o.tienda_numero] = o; });

  var filas = [];
  var tot = { cap: {}, capTotal: 0, porEquipo: {}, cons: {}, consTotal: 0, consAnual: 0, importe: 0, co2: 0, estados: {}, tiendas: 0 };
  d.tiendas.forEach(function (t) {
    if (f.region && regionDe_(t) !== f.region) return;
    if (f.formato && t.formato !== f.formato) return;
    var rel = d.rel[t.numero];
    var est = categoriaEstado_(rel);
    tot.estados[est] = (tot.estados[est] || 0) + 1;
    if (est !== 'cerrada') tot.tiendas++;

    var cap = { porRef: {}, total: 0 };
    if (rel) {
      var form = {};
      EQUIPOS.forEach(function (eq) { form[eq.key] = rel[eq.col] || 0; });
      cap = calcularCapacidad_(t, form, STATE.params);
    }
    Object.keys(cap.porRef).forEach(function (ref) { tot.cap[ref] = (tot.cap[ref] || 0) + cap.porRef[ref]; });
    (cap.detalle || []).forEach(function (d) {
      var e = tot.porEquipo[d.label] = tot.porEquipo[d.label] || { label: d.label, cant: 0, kg: 0, refs: {} };
      e.cant += d.cant; e.kg += d.kg;
      d.partes.forEach(function (p) { e.refs[p.refrigerante] = true; });
    });
    tot.capTotal += cap.total;

    var cons = 0, imp = 0, co2 = 0;
    (consumoPorTienda[t.numero] || []).forEach(function (c) {
      if (c.k >= per.desde && c.k <= per.hasta) {
        cons += c.kg; imp += c.importe; co2 += c.kg * (GWP[c.ref] || 0) / 1000;
        tot.cons[c.ref] = (tot.cons[c.ref] || 0) + c.kg;
      }
      mensual[c.k] = (mensual[c.k] || 0) + c.kg;
    });
    var anual = cons * (per ? per.factor : 1);
    tot.consTotal += cons; tot.consAnual += anual; tot.importe += imp; tot.co2 += co2;
    var obj = objetivos[t.numero];
    filas.push({
      t: t, est: est, cap: cap.total, capRef: cap.porRef, cons: cons, anual: anual,
      tasa: cap.total > 0 ? anual / cap.total : null,
      exceso: anual - cap.total * OBJETIVO_FUGA,
      objetivo: obj ? obj.objetivo_kg : null,
      vsObjetivo: obj && obj.objetivo_kg ? anual / obj.objetivo_kg : null
    });
  });
  tot.tasa = tot.capTotal > 0 ? tot.consAnual / tot.capTotal : null;
  return { per: per, filas: filas, tot: tot, mensual: mensual };
}

// ---------------------------------------------------------------
// Render
// ---------------------------------------------------------------

function armarFiltrosDashboard_() {
  var d = DASH.datos;
  var regiones = {}, formatos = {};
  d.tiendas.forEach(function (t) { regiones[regionDe_(t)] = true; if (t.formato) formatos[t.formato] = true; });
  llenarSelect_('dash-f-region', 'Todas las regiones', Object.keys(regiones).sort(), DASH.filtros.region);
  llenarSelect_('dash-f-formato', 'Todos los formatos', Object.keys(formatos).sort(), DASH.filtros.formato);
  var sel = document.getElementById('dash-f-periodo');
  sel.innerHTML = periodos_().map(function (p) {
    return '<option value="' + p.key + '"' + (p.key === DASH.filtros.periodo ? ' selected' : '') + '>' + esc_(p.label) + '</option>';
  }).join('');
  sel.parentNode.style.display = d.hayConsumos ? '' : 'none';
  document.getElementById('dash-f-region').onchange = function () { DASH.filtros.region = this.value; renderDashboard_(); };
  document.getElementById('dash-f-formato').onchange = function () { DASH.filtros.formato = this.value; renderDashboard_(); };
  sel.onchange = function () { DASH.filtros.periodo = this.value; renderDashboard_(); };
}

function llenarSelect_(id, todos, valores, actual) {
  document.getElementById(id).innerHTML = '<option value="">' + todos + '</option>' + valores.map(function (v) {
    return '<option' + (v === actual ? ' selected' : '') + '>' + esc_(v) + '</option>';
  }).join('');
}

function renderDashboard_() {
  var c = calcularDashboard_();
  var tot = c.tot;
  var hay = DASH.datos.hayConsumos;

  // Aviso si falta la base de consumos
  document.getElementById('dash-aviso').innerHTML = hay ? '' :
    '<div class="card"><p class="nota-aviso" style="margin:0;">Todavía no está cargada la base de consumos. Se muestra sólo la capacidad instalada. ' +
    'Hay que correr <code>sql/004_consumos.sql</code> y el script de carga.</p></div>';

  // Hero: tasa de fuga
  var nivel = nivelFuga_(tot.tasa);
  document.getElementById('dash-hero').innerHTML = hay ? (
    '<div class="dash-label">Tasa de fuga anual · frío alimentario</div>' +
    '<div class="dash-hero-valor">' + pct_(tot.tasa) + '</div>' +
    '<div class="dash-status"><span class="status-dot" style="background:' + nivel.color + '">' + nivel.icono + '</span>' + esc_(nivel.label) + '</div>' +
    '<div class="dash-meter">' + medidorFuga_(tot.tasa) + '</div>' +
    '<p class="dash-nota">Consumo anual de refrigerante ÷ capacidad instalada. Objetivo Carrefour 20%. Referencia: los supermercados del programa GreenChill (EPA, EE.UU.) promedian 14%; las mejores tiendas, menos de 10%.</p>'
  ) : (
    '<div class="dash-label">Capacidad instalada · frío alimentario</div>' +
    '<div class="dash-hero-valor">' + num_(tot.capTotal) + ' <span class="dash-unidad">kg</span></div>'
  );

  var sobre = c.filas.filter(function (f) { return f.tasa != null && f.tasa > OBJETIVO_FUGA; }).length;
  var revisar = c.filas.filter(function (f) { return f.tasa != null && f.tasa > 1.25; }).length;
  var conCap = c.filas.filter(function (f) { return f.tasa != null; }).length;
  var ok = tot.estados.ok || 0;
  var tiles = [
    { label: 'Capacidad instalada', valor: num_(tot.capTotal) + ' kg', sub: tot.tiendas + ' tiendas activas' + (tot.estados.cerrada ? ' + ' + tot.estados.cerrada + ' cerradas' : '') }
  ];
  if (hay) {
    tiles.push({ label: 'Consumo de refrigerante', valor: num_(tot.consTotal) + ' kg', sub: c.per.factor !== 1 ? 'anualizado: ' + num_(tot.consAnual) + ' kg' : esc_(c.per.label) });
    tiles.push({ label: 'Emisiones por fugas', valor: num_(tot.co2) + ' tCO₂e', sub: 'consumo × GWP de cada gas' });
    tiles.push({ label: 'Costo del refrigerante', valor: '$ ' + compacto_(tot.importe), sub: 'importe SAP del período' });
    tiles.push({ label: 'Tiendas sobre el 20%', valor: sobre + ' de ' + conCap, sub: revisar + ' con capacidad a revisar (consumo > 125%)' });
  }
  tiles.push({ label: 'Avance del relevamiento', valor: pct_(tot.tiendas ? ok / tot.tiendas : 0), sub: ok + ' de ' + tot.tiendas + ' confirmadas', meter: tot.tiendas ? ok / tot.tiendas : 0 });
  document.getElementById('dash-tiles').innerHTML = tiles.map(function (t) {
    return '<div class="card dash-tile"><div class="dash-label">' + t.label + '</div><div class="dash-tile-valor">' + t.valor + '</div>' +
      (t.meter != null ? '<div class="meter"><div style="width:' + Math.round(t.meter * 100) + '%"></div></div>' : '') +
      '<div class="dash-sub">' + t.sub + '</div></div>';
  }).join('');

  // Anillos
  var anillos = [donut_('Capacidad instalada por refrigerante', segmentosRef_(tot.cap), 'kg instalados')];
  if (hay) anillos.push(donut_('Consumo por refrigerante', segmentosRef_(tot.cons), 'kg consumidos'));
  anillos.push(donut_('Estado del relevamiento', ESTADOS.map(function (e) {
    return { label: e.icono + ' ' + e.label, valor: tot.estados[e.key] || 0, color: e.color };
  }), 'tiendas', true));
  document.getElementById('dash-anillos').innerHTML = anillos.join('');

  document.getElementById('dash-equipos').innerHTML = barrasEquipo_(tot.porEquipo, tot.capTotal);

  // Barras por región / formato
  document.getElementById('dash-barras').innerHTML = hay
    ? barrasFuga_('Tasa de fuga por región', agrupar_(c.filas, function (f) { return regionDe_(f.t); })) +
      barrasFuga_('Tasa de fuga por formato', agrupar_(c.filas, function (f) { return f.t.formato || 'Sin formato'; }))
    : barrasKg_('Capacidad instalada por región', agrupar_(c.filas, function (f) { return regionDe_(f.t); }));

  document.getElementById('dash-tendencia').innerHTML = hay ? columnasMensuales_(c.mensual, DASH.datos.ultimoMes) : '';
  document.getElementById('dash-dispersion').innerHTML = hay ? dispersion_(c.filas) : '';
  renderTablaDashboard_(c.filas, hay);
  activarTooltips_();
}

function agrupar_(filas, clave) {
  var g = {};
  filas.forEach(function (f) {
    var k = clave(f);
    g[k] = g[k] || { label: k, cap: 0, anual: 0, n: 0 };
    g[k].cap += f.cap; g[k].anual += f.anual; g[k].n++;
  });
  return Object.keys(g).map(function (k) { var x = g[k]; x.tasa = x.cap > 0 ? x.anual / x.cap : null; return x; });
}

function segmentosRef_(porRef) {
  var orden = ['R22', 'R404', 'R290', 'R410A', 'R134a'];
  var claves = Object.keys(porRef).filter(function (k) { return porRef[k] > 0; });
  claves.sort(function (a, b) {
    var ia = orden.indexOf(a), ib = orden.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return claves.map(function (k) { return { label: k, valor: porRef[k], color: COLOR_REF[k] || COLOR_OTRO }; });
}

// ---------------------------------------------------------------
// Gráficos (SVG)
// ---------------------------------------------------------------

function donut_(titulo, segs, unidad, enteros) {
  var total = segs.reduce(function (s, x) { return s + x.valor; }, 0);
  var R = 62, W = 16, C = 2 * Math.PI * R, GAP = 2;
  var off = 0, arcs = '';
  segs.forEach(function (s) {
    if (!s.valor) return;
    var len = s.valor / total * C;
    var visible = Math.max(len - GAP, 0.5);
    var tip = esc_(s.label) + ': ' + (enteros ? s.valor : num_(s.valor) + ' kg') + ' (' + pct_(s.valor / total) + ')';
    arcs += '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="' + s.color + '" stroke-width="' + W + '"' +
      ' stroke-dasharray="' + visible + ' ' + (C - visible) + '" stroke-dashoffset="' + (-off) + '"' +
      ' transform="rotate(-90 80 80)" data-tip="' + tip + '"></circle>';
    off += len;
  });
  if (!total) arcs = '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="#e1e0d9" stroke-width="' + W + '"></circle>';
  var leyenda = segs.map(function (s) {
    return '<div class="leyenda-fila"><span class="swatch" style="background:' + s.color + '"></span>' +
      '<span class="leyenda-label">' + esc_(s.label) + '</span>' +
      '<span class="leyenda-valor">' + (enteros ? s.valor : num_(s.valor)) + '</span>' +
      '<span class="leyenda-pct">' + (total ? pct_(s.valor / total) : '–') + '</span></div>';
  }).join('');
  return '<div class="card dash-chart"><div class="dash-chart-titulo">' + titulo + '</div>' +
    '<div class="donut-wrap"><svg viewBox="0 0 160 160" class="donut" role="img" aria-label="' + esc_(titulo) + '">' + arcs +
    '<text x="80" y="78" text-anchor="middle" class="donut-total">' + (enteros ? total : compacto_(total)) + '</text>' +
    '<text x="80" y="96" text-anchor="middle" class="donut-unidad">' + unidad + '</text></svg>' +
    '<div class="leyenda">' + leyenda + '</div></div></div>';
}

function barrasFuga_(titulo, grupos) {
  grupos = grupos.filter(function (g) { return g.tasa != null; }).sort(function (a, b) { return b.tasa - a.tasa; });
  var max = Math.max(0.4, grupos.reduce(function (m, g) { return Math.max(m, g.tasa); }, 0) * 1.1);
  var LW = 120, BW = 300, ROW = 30, TOP = 22, H = grupos.length * ROW + 34 + TOP;
  var x = function (v) { return LW + v / max * BW; };
  var s = '<svg viewBox="0 0 ' + (LW + BW + 60) + ' ' + H + '" class="chart-svg" role="img" aria-label="' + esc_(titulo) + '">';
  [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].forEach(function (t) {
    if (t > max) return;
    s += '<line x1="' + x(t) + '" x2="' + x(t) + '" y1="' + (TOP - 6) + '" y2="' + (H - 22) + '" class="grid"/>' +
      '<text x="' + x(t) + '" y="' + (H - 8) + '" text-anchor="middle" class="tick">' + Math.round(t * 100) + '%</text>';
  });
  s += '<line x1="' + x(OBJETIVO_FUGA) + '" x2="' + x(OBJETIVO_FUGA) + '" y1="' + (TOP - 6) + '" y2="' + (H - 22) + '" class="ref-line"/>' +
    '<text x="' + x(OBJETIVO_FUGA) + '" y="' + (TOP - 10) + '" text-anchor="middle" class="ref-label">Objetivo 20%</text>';
  grupos.forEach(function (g, i) {
    var y = TOP + i * ROW, w = Math.max(x(g.tasa) - LW, 1);
    var nv = nivelFuga_(g.tasa);
    s += '<text x="' + (LW - 8) + '" y="' + (y + 12) + '" text-anchor="end" class="bar-label">' + esc_(g.label) + '</text>' +
      '<path d="' + barraH_(LW, y + 2, w, 16) + '" fill="#2a78d6" data-tip="' + esc_(g.label) + ': ' + pct_(g.tasa) + ' · ' +
      num_(g.anual) + ' kg/año sobre ' + num_(g.cap) + ' kg instalados (' + g.n + ' tiendas) · ' + esc_(nv.label) + '"/>' +
      '<text x="' + (LW + w + 6) + '" y="' + (y + 14) + '" class="bar-valor">' + pct_(g.tasa) + '</text>';
  });
  s += '</svg>';
  return '<div class="card dash-chart"><div class="dash-chart-titulo">' + titulo + '</div>' + s + '</div>';
}

function barrasKg_(titulo, grupos) {
  grupos.sort(function (a, b) { return b.cap - a.cap; });
  var max = grupos.reduce(function (m, g) { return Math.max(m, g.cap); }, 1);
  var LW = 120, BW = 300, ROW = 30, H = grupos.length * ROW + 10;
  var s = '<svg viewBox="0 0 ' + (LW + BW + 80) + ' ' + H + '" class="chart-svg" role="img" aria-label="' + esc_(titulo) + '">';
  grupos.forEach(function (g, i) {
    var y = 4 + i * ROW, w = Math.max(g.cap / max * BW, 1);
    s += '<text x="' + (LW - 8) + '" y="' + (y + 12) + '" text-anchor="end" class="bar-label">' + esc_(g.label) + '</text>' +
      '<path d="' + barraH_(LW, y + 2, w, 16) + '" fill="#2a78d6" data-tip="' + esc_(g.label) + ': ' + num_(g.cap) + ' kg (' + g.n + ' tiendas)"/>' +
      '<text x="' + (LW + w + 6) + '" y="' + (y + 14) + '" class="bar-valor">' + num_(g.cap) + ' kg</text>';
  });
  return '<div class="card dash-chart"><div class="dash-chart-titulo">' + titulo + '</div>' + s + '</svg></div>';
}

// Capacidad por tipo de equipo (el cuadro "Total Kg por equipo" del Excel).
function barrasEquipo_(porEquipo, total) {
  // Siempre los 6 tipos, en el mismo orden que el cuadro del Excel.
  var grupos = CATEGORIAS_CAPACIDAD.map(function (c) { return porEquipo[c.label] || { label: c.label, cant: 0, kg: 0, refs: {} }; });
  var max = grupos.reduce(function (m, g) { return Math.max(m, g.kg); }, 1);
  var LW = 230, BW = 520, ROW = 30, H = grupos.length * ROW + 10;
  var s = '<svg viewBox="0 0 ' + (LW + BW + 220) + ' ' + H + '" class="chart-svg" role="img" aria-label="Capacidad instalada por tipo de equipo">';
  grupos.forEach(function (g, i) {
    var y = 4 + i * ROW, w = Math.max(g.kg / max * BW, 1);
    var refs = Object.keys(g.refs).join(' / ');
    var detalle = num_(g.cant) + ' equipos · ' + refs;
    s += '<text x="' + (LW - 10) + '" y="' + (y + 14) + '" text-anchor="end" class="bar-label">' + esc_(g.label) + '</text>' +
      '<path d="' + barraH_(LW, y + 3, w, 16) + '" fill="#2a78d6" data-tip="' + esc_(g.label) + ': ' + num_(g.kg) + ' kg (' + pct_(g.kg / total) + ') · ' + detalle + '"/>' +
      '<text x="' + (LW + w + 8) + '" y="' + (y + 15) + '" class="bar-valor">' + fmtKgDash_(g.kg) + '</text>' +
      '<text x="' + (LW + w + 8 + 12 + fmtKgDash_(g.kg).length * 7) + '" y="' + (y + 15) + '" class="tick">' + detalle + '</text>';
  });
  s += '</svg>';
  return '<div class="card dash-chart"><div class="dash-chart-titulo">Capacidad instalada por tipo de equipo</div>' + s + '</div>';
}

function fmtKgDash_(v) { return (Math.round(v * 10) / 10).toLocaleString('es-AR') + ' kg'; }

// Barra horizontal: cuadrada en la base, redondeada (4px) en la punta.
function barraH_(x, y, w, h) {
  var r = Math.min(4, w, h / 2);
  return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) +
    'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + x + 'Z';
}
function barraV_(x, base, w, h) {
  var r = Math.min(4, h, w / 2), y = base - h;
  return 'M' + x + ',' + base + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) +
    'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + base + 'Z';
}

function columnasMensuales_(mensual, ultimo) {
  var meses = [];
  for (var k = ultimo - 23; k <= ultimo; k++) meses.push({ k: k, kg: mensual[k] || 0 });
  var max = meses.reduce(function (m, x) { return Math.max(m, x.kg); }, 1);
  var paso = Math.pow(10, Math.floor(Math.log10(max)));
  var tope = Math.ceil(max / paso) * paso;
  var L = 48, W = 1100, H = 230, B = 200, slot = (W - L) / meses.length, bw = Math.min(16, slot - 4);
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart-svg" role="img" aria-label="Consumo mensual de refrigerante">';
  [0, 0.5, 1].forEach(function (f) {
    var y = B - f * (B - 10);
    s += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="grid"/>' +
      '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="tick">' + num_(tope * f) + '</text>';
  });
  meses.forEach(function (m, i) {
    var x = L + i * slot + (slot - bw) / 2, h = Math.max(m.kg / tope * (B - 10), m.kg > 0 ? 1 : 0);
    var esUltimo = m.k === ultimo;
    s += '<path d="' + barraV_(x, B, bw, h) + '" fill="' + (esUltimo ? '#86b6ef' : '#2a78d6') + '" data-tip="' + mesLabel_(m.k) + ': ' + num_(m.kg) + ' kg' + (esUltimo ? ' (mes en curso, parcial)' : '') + '"/>' +
      '<rect x="' + (L + i * slot) + '" y="10" width="' + slot + '" height="' + (B - 10) + '" fill="transparent" data-tip="' + mesLabel_(m.k) + ': ' + num_(m.kg) + ' kg"/>';
    if (i % 3 === 0 || esUltimo) s += '<text x="' + (x + bw / 2) + '" y="' + (B + 16) + '" text-anchor="middle" class="tick">' + mesLabel_(m.k) + '</text>';
  });
  s += '</svg>';
  return '<div class="card dash-chart"><div class="dash-chart-titulo">Consumo mensual de refrigerante · últimos 24 meses (kg)</div>' + s + '</div>';
}

function dispersion_(filas) {
  var pts = filas.filter(function (f) { return f.cap > 0; });
  var maxX = topeRedondo_(pts.reduce(function (m, f) { return Math.max(m, f.cap); }, 1));
  // El eje Y llega al percentil 98 del consumo: los pocos valores extremos quedan pegados arriba
  // en lugar de aplastar al resto (el tooltip muestra su valor real).
  var consumos = pts.map(function (f) { return f.anual; }).sort(function (a, b) { return a - b; });
  var p98 = consumos.length ? consumos[Math.floor((consumos.length - 1) * 0.98)] : 1;
  var maxY = topeRedondo_(Math.max(p98, maxX * 0.4, 1));
  var L = 64, W = 1100, H = 420, B = 380, T = 10;
  var x = function (v) { return L + v / maxX * (W - L - 10); };
  var y = function (v) { return B - v / maxY * (B - T); };
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart-svg" role="img" aria-label="Capacidad instalada vs consumo por tienda">';
  [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
    s += '<line x1="' + L + '" x2="' + (W - 10) + '" y1="' + y(maxY * f) + '" y2="' + y(maxY * f) + '" class="grid"/>' +
      '<text x="' + (L - 6) + '" y="' + (y(maxY * f) + 4) + '" text-anchor="end" class="tick">' + num_(maxY * f) + '</text>' +
      '<text x="' + x(maxX * f) + '" y="' + (B + 16) + '" text-anchor="' + (f === 1 ? 'end' : 'middle') + '" class="tick">' + num_(maxX * f) + '</text>';
  });
  // Líneas guía: 10% y 20% de la capacidad.
  [[0.10, 'Fuga 10%'], [OBJETIVO_FUGA, 'Objetivo 20%']].forEach(function (g) {
    var x2 = Math.min(maxX, maxY / g[0]);
    s += '<line x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(x2) + '" y2="' + y(x2 * g[0]) + '" class="ref-line"/>' +
      '<text x="' + (x(x2) - 4) + '" y="' + (y(x2 * g[0]) - 6) + '" text-anchor="end" class="ref-label">' + g[1] + '</text>';
  });
  pts.sort(function (a, b) { return a.tasa - b.tasa; }).forEach(function (f) {
    var nv = nivelFuga_(f.tasa);
    var tip = f.t.numero + ' · ' + esc_(f.t.local) + ' — ' + num_(f.cap) + ' kg instalados, ' + num_(f.anual) + ' kg/año consumidos, fuga ' + pct_(f.tasa) + ' · ' + esc_(nv.label);
    s += '<circle cx="' + x(f.cap) + '" cy="' + y(Math.min(f.anual, maxY)) + '" r="4.5" fill="' + nv.color + '" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="' + x(f.cap) + '" cy="' + y(Math.min(f.anual, maxY)) + '" r="9" fill="transparent" data-tip="' + tip + '"/>';
  });
  s += '<text x="' + ((L + W) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="axis-titulo">Capacidad instalada (kg)</text>' +
    '<text x="12" y="' + (B / 2) + '" text-anchor="middle" class="axis-titulo" transform="rotate(-90 12 ' + (B / 2) + ')">Consumo anual (kg)</text></svg>';
  var leyenda = ['good', 'warning', 'serious', 'critical', 'revisar'].map(function (k) {
    var n = nivelFuga_({ good: 0.05, warning: 0.15, serious: 0.3, critical: 0.5, revisar: 2 }[k]);
    return '<span class="leyenda-inline"><span class="status-dot" style="background:' + n.color + '">' + n.icono + '</span>' + esc_(n.label) + '</span>';
  }).join('');
  return '<div class="card dash-chart"><div class="dash-chart-titulo">Capacidad instalada vs consumo, por tienda</div>' +
    '<div class="leyenda-linea">' + leyenda + '</div>' + s +
    '<p class="dash-nota">Cada punto es una tienda. Arriba de la línea del 20% consume más refrigerante del que debería para su capacidad: es donde conviene buscar fugas primero.</p></div>';
}

// Tope de eje redondo y divisible en 4 tramos limpios (ej. 1.714 -> 2.000, 520 -> 600).
function topeRedondo_(v) {
  var paso = Math.pow(10, Math.floor(Math.log10(v / 4)));
  var tramo = [1, 2, 2.5, 5, 10].map(function (m) { return m * paso; }).find(function (t) { return t * 4 >= v; });
  return tramo * 4;
}

function medidorFuga_(tasa) {
  var max = 0.5, v = Math.min(tasa || 0, max) / max * 100, obj = OBJETIVO_FUGA / max * 100;
  var nv = nivelFuga_(tasa);
  return '<div class="meter meter-grande"><div style="width:' + v + '%;background:' + nv.color + '"></div>' +
    '<span class="meter-marca" style="left:' + obj + '%"></span></div>' +
    '<div class="meter-escala"><span>0%</span><span style="left:' + obj + '%">20%</span><span>50%+</span></div>';
}

// ---------------------------------------------------------------
// Tabla de tiendas
// ---------------------------------------------------------------

var COLS_TABLA = [
  { key: 'tienda', label: 'Tienda', val: function (f) { return f.t.numero; } },
  { key: 'region', label: 'Región', val: function (f) { return regionDe_(f.t); } },
  { key: 'formato', label: 'Formato', val: function (f) { return f.t.formato || ''; } },
  { key: 'cap', label: 'Capacidad (kg)', num: true, val: function (f) { return f.cap; } },
  { key: 'anual', label: 'Consumo anual (kg)', num: true, consumo: true, val: function (f) { return f.anual; } },
  { key: 'tasa', label: 'Fuga', num: true, consumo: true, val: function (f) { return f.tasa; } },
  { key: 'exceso', label: 'Kg sobre el 20%', num: true, consumo: true, val: function (f) { return f.exceso; } },
  { key: 'objetivo', label: 'Objetivo topes (kg)', num: true, consumo: true, val: function (f) { return f.objetivo; } },
  { key: 'vsObjetivo', label: 'Consumo vs objetivo', num: true, consumo: true, val: function (f) { return f.vsObjetivo; } },
  { key: 'est', label: 'Relevamiento', val: function (f) { return f.est; } }
];

function renderTablaDashboard_(filas, hay) {
  var tb = DASH.tabla;
  var cols = COLS_TABLA.filter(function (c) { return hay || !c.consumo; });
  var q = tb.buscar.toLowerCase();
  var lista = filas.filter(function (f) {
    return !q || String(f.t.numero).indexOf(q) !== -1 || (f.t.local || '').toLowerCase().indexOf(q) !== -1 || (f.t.jefe_nombre || '').toLowerCase().indexOf(q) !== -1;
  });
  var col = COLS_TABLA.find(function (c) { return c.key === tb.orden; }) || COLS_TABLA[0];
  lista.sort(function (a, b) {
    var va = col.val(a), vb = col.val(b);
    if (va == null) return 1;
    if (vb == null) return -1;
    var r = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
    return tb.desc ? -r : r;
  });
  var html = '<table class="dash-tabla"><thead><tr>' + cols.map(function (c) {
    var flecha = c.key === tb.orden ? (tb.desc ? ' ↓' : ' ↑') : '';
    return '<th class="' + (c.num ? 'num' : '') + '" data-col="' + c.key + '">' + c.label + flecha + '</th>';
  }).join('') + '</tr></thead><tbody>';
  lista.slice(0, tb.limite).forEach(function (f) {
    var nv = nivelFuga_(f.tasa);
    var est = ESTADOS.find(function (e) { return e.key === f.est; }) || { label: 'Cerrada', color: STATUS.muted, icono: '–' };
    html += '<tr>' + cols.map(function (c) {
      switch (c.key) {
        case 'tienda': return '<td><strong>' + f.t.numero + '</strong> · ' + esc_(f.t.local) + '</td>';
        case 'tasa': return '<td class="num">' + (f.tasa == null ? '–' : '<span class="status-dot" style="background:' + nv.color + '">' + nv.icono + '</span>' + pct_(f.tasa)) + '</td>';
        case 'exceso': return '<td class="num">' + (f.exceso > 0 ? '+' + num_(f.exceso) : '–') + '</td>';
        case 'vsObjetivo': return '<td class="num">' + (f.vsObjetivo == null ? '–' : pct_(f.vsObjetivo)) + '</td>';
        case 'objetivo': return '<td class="num">' + (f.objetivo == null ? '–' : num_(f.objetivo)) + '</td>';
        case 'est': return '<td><span class="status-dot" style="background:' + est.color + '">' + est.icono + '</span>' + esc_(est.label) + '</td>';
        default: return c.num ? '<td class="num">' + num_(c.val(f)) + '</td>' : '<td>' + esc_(c.val(f)) + '</td>';
      }
    }).join('') + '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('dash-tabla').innerHTML = html;
  document.getElementById('dash-tabla-pie').innerHTML = lista.length > tb.limite
    ? '<a href="#" id="dash-ver-mas">Ver más (' + (lista.length - tb.limite) + ' restantes)</a>' : lista.length + ' tiendas';
  var vm = document.getElementById('dash-ver-mas');
  if (vm) vm.onclick = function (e) { e.preventDefault(); tb.limite += 50; renderTablaDashboard_(filas, hay); };
  document.querySelectorAll('.dash-tabla th').forEach(function (th) {
    th.onclick = function () {
      if (tb.orden === th.dataset.col) tb.desc = !tb.desc; else { tb.orden = th.dataset.col; tb.desc = true; }
      renderTablaDashboard_(filas, hay);
    };
  });
  var inp = document.getElementById('dash-buscar');
  inp.oninput = function () { tb.buscar = this.value; tb.limite = 30; renderTablaDashboard_(filas, hay); };
}

function exportarDashboardCSV() {
  var c = calcularDashboard_();
  var sep = ';';
  var lineas = [['Tienda', 'Local', 'Región', 'Formato', 'Jefe', 'Capacidad kg', 'R22 kg', 'R404 kg', 'R290 kg', 'Consumo período kg', 'Consumo anual kg', 'Fuga %', 'Objetivo topes kg', 'Estado relevamiento'].join(sep)];
  c.filas.forEach(function (f) {
    var n = function (v) { return v == null ? '' : String(Math.round(v * 100) / 100).replace('.', ','); };
    lineas.push([f.t.numero, f.t.local, regionDe_(f.t), f.t.formato, f.t.jefe_nombre, n(f.cap), n(f.capRef.R22), n(f.capRef.R404), n(f.capRef.R290),
      n(f.cons), n(f.anual), f.tasa == null ? '' : n(f.tasa * 100), n(f.objetivo), f.est]
      .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(sep));
  });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'capacidad_instalada_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

// ---------------------------------------------------------------
// Tooltip compartido
// ---------------------------------------------------------------

function activarTooltips_() {
  var tip = document.getElementById('dash-tooltip');
  var cont = document.getElementById('view-dashboard');
  cont.onpointermove = function (e) {
    var el = e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!el) { tip.style.opacity = 0; return; }
    tip.textContent = el.getAttribute('data-tip');
    tip.style.opacity = 1;
    var x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
    var y = e.clientY + 16 + tip.offsetHeight > window.innerHeight ? e.clientY - tip.offsetHeight - 10 : e.clientY + 16;
    tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  };
  cont.onpointerleave = function () { tip.style.opacity = 0; };
}

// ---------------------------------------------------------------
// Formatos
// ---------------------------------------------------------------

function num_(v) { return v == null || isNaN(v) ? '–' : Math.round(v).toLocaleString('es-AR'); }
function pct_(v) { return v == null || isNaN(v) ? '–' : (Math.round(v * 1000) / 10).toLocaleString('es-AR') + '%'; }
function compacto_(v) {
  if (v == null || isNaN(v)) return '–';
  var a = Math.abs(v);
  if (a >= 1e9) return (Math.round(v / 1e8) / 10).toLocaleString('es-AR') + ' mil M';
  if (a >= 1e6) return (Math.round(v / 1e5) / 10).toLocaleString('es-AR') + ' M';
  if (a >= 1e4) return (Math.round(v / 100) / 10).toLocaleString('es-AR') + ' mil';
  return Math.round(v).toLocaleString('es-AR');
}
