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

var DASH = { datos: null, filtros: { region: '', formato: '', periodo: '12m', sel: null }, tabla: { orden: 'sobrePrev', desc: true, limite: 30, buscar: '' } };

async function abrirDashboard() {
  irA('loading');
  try {
    if (!DASH.datos) DASH.datos = await cargarDatosDashboard_();
    armarFiltrosDashboard_();
    renderDashboard_();
    irA('dashboard');
    sincronizarScrollTabla_();
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
    traerOpcional_('consumos_mensuales', 'tienda_numero,anio,mes,refrigerante,tipo,kg,importe'),
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

// Filtros cruzados: al hacer clic en una tarjeta o en un anillo se filtran las tiendas que cumplen
// la condición, y todo el dashboard se recalcula sólo con ellas.
var SELECCIONES = {
  masQuePrev: { label: function (c) { return 'Consumieron más que en ' + c.anioPrev; }, ok: function (f) { return f.cAct > f.cPrev && (f.cAct > 0 || f.cPrev > 0); } },
  sobreCap: { label: function (c) { return 'Consumieron más que su capacidad en ' + c.anioAct; }, ok: function (f) { return f.cap > 0 && f.faAct > f.cap; } },
  pendientes: { label: function () { return 'Pendientes de relevar (sin confirmar)'; }, ok: function (f) { return f.est !== 'ok' && f.est !== 'cerrada'; } }
};

function seleccionDe_(clave) {
  if (SELECCIONES[clave]) return SELECCIONES[clave];
  var p = clave.split(':'), tipo = p[0], valor = p.slice(1).join(':');
  if (tipo === 'capRef') return { label: function () { return 'Capacidad con ' + valor; }, ok: function (f) { return (f.capRef[valor] || 0) > 0; } };
  if (tipo === 'consRef') return { label: function () { return 'Consumieron ' + valor + ' en el período'; }, ok: function (f) { return (f.consRef[valor] || 0) > 0; } };
  if (tipo === 'estado') {
    var e = ESTADOS.find(function (x) { return x.key === valor; });
    return { label: function () { return 'Relevamiento: ' + (e ? e.label : valor); }, ok: function (f) { return f.est === valor; } };
  }
  return null;
}

function calcularDashboard_() {
  var d = DASH.datos, f = DASH.filtros;
  var per = periodos_().find(function (p) { return p.key === f.periodo; }) || periodos_()[0];
  // Comparación anual (igual que el Indicador de imputaciones): acumulado del año en curso
  // contra el total del año anterior, frío alimentario + aire acondicionado.
  var anioAct = Math.floor((d.ultimoMes - 1) / 12), anioPrev = anioAct - 1;
  var mesesAct = ((d.ultimoMes - 1) % 12) + 1;

  var consumoPorTienda = {};
  d.consumos.forEach(function (c) {
    var k = c.anio * 12 + c.mes;
    (consumoPorTienda[c.tienda_numero] = consumoPorTienda[c.tienda_numero] || []).push({ k: k, anio: c.anio, tipo: c.tipo, ref: c.refrigerante, kg: Number(c.kg) || 0, importe: Number(c.importe) || 0 });
  });

  // 1) Datos de cada tienda
  var todas = [];
  d.tiendas.forEach(function (t) {
    if (f.region && regionDe_(t) !== f.region) return;
    if (f.formato && t.formato !== f.formato) return;
    var rel = d.rel[t.numero];
    var cap = { porRef: {}, total: 0, detalle: [] };
    if (rel) {
      var form = {};
      EQUIPOS.forEach(function (eq) { form[eq.key] = rel[eq.col] || 0; });
      cap = calcularCapacidad_(t, form, STATE.params);
    }
    // cons = sólo FA (para la tasa de fuga, contra la capacidad de FA); consTot = FA + AA (como el indicador).
    var cons = 0, consTot = 0, imp = 0, co2 = 0, cAct = 0, cPrev = 0, faAct = 0, consRef = {}, mensual = {};
    (consumoPorTienda[t.numero] || []).forEach(function (c) {
      if (c.anio === anioAct) cAct += c.kg;
      if (c.anio === anioAct && c.tipo === 'FA') faAct += c.kg;
      if (c.anio === anioPrev) cPrev += c.kg;
      if (c.anio === anioAct || c.anio === anioPrev) mensual[c.k] = (mensual[c.k] || 0) + c.kg;
      if (c.k >= per.desde && c.k <= per.hasta) {
        consTot += c.kg; imp += c.importe; co2 += c.kg * (GWP[c.ref] || 0) / 1000;
        consRef[c.ref] = (consRef[c.ref] || 0) + c.kg;
        if (c.tipo === 'FA') cons += c.kg;
      }
    });
    var anual = cons * (per ? per.factor : 1);
    var comp = {};
    cap.detalle.forEach(function (x) { comp[x.label] = x.cant; });
    todas.push({
      t: t, est: categoriaEstado_(rel), cap: cap.total, capRef: cap.porRef, detalle: cap.detalle, comp: comp,
      cons: cons, consTot: consTot, consRef: consRef, imp: imp, co2: co2, mensual: mensual, anual: anual,
      tasa: cap.total > 0 ? anual / cap.total : null,
      cAct: cAct, cPrev: cPrev, sobrePrev: cAct - cPrev, faAct: faAct,
      vsPrev: cPrev > 0 ? cAct / cPrev - 1 : null
    });
  });

  // 2) Filtro cruzado activo
  var sel = f.sel ? seleccionDe_(f.sel) : null;
  var filas = sel ? todas.filter(sel.ok) : todas;

  // 3) Totales
  var tot = { cap: {}, capTotal: 0, porEquipo: {}, cons: {}, consFA: 0, consTotal: 0, consAnual: 0, importe: 0, co2: 0, estados: {}, tiendas: 0, cAct: 0, cPrev: 0 };
  var mensual = {};
  filas.forEach(function (x) {
    tot.estados[x.est] = (tot.estados[x.est] || 0) + 1;
    if (x.est !== 'cerrada') tot.tiendas++;
    Object.keys(x.capRef).forEach(function (ref) { tot.cap[ref] = (tot.cap[ref] || 0) + x.capRef[ref]; });
    x.detalle.forEach(function (dd) {
      var e = tot.porEquipo[dd.label] = tot.porEquipo[dd.label] || { label: dd.label, cant: 0, kg: 0, refs: {} };
      e.cant += dd.cant; e.kg += dd.kg;
      dd.partes.forEach(function (p) { e.refs[p.refrigerante] = true; });
    });
    tot.capTotal += x.cap;
    Object.keys(x.consRef).forEach(function (ref) { tot.cons[ref] = (tot.cons[ref] || 0) + x.consRef[ref]; });
    Object.keys(x.mensual).forEach(function (k) { mensual[k] = (mensual[k] || 0) + x.mensual[k]; });
    tot.consFA += x.cons; tot.consTotal += x.consTot; tot.consAnual += x.anual; tot.importe += x.imp; tot.co2 += x.co2;
    tot.cAct += x.cAct; tot.cPrev += x.cPrev;
  });
  tot.tasa = tot.capTotal > 0 ? tot.consAnual / tot.capTotal : null;
  tot.vsPrev = tot.cPrev > 0 ? tot.cAct / tot.cPrev - 1 : null;
  return { per: per, filas: filas, todas: todas, sel: sel, tot: tot, mensual: mensual, anioAct: anioAct, anioPrev: anioPrev, mesesAct: mesesAct };
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
  DASH.mesesAct = c.mesesAct;
  var hay = DASH.datos.hayConsumos;

  var chip = document.getElementById('dash-seleccion');
  if (c.sel) {
    chip.innerHTML = '<span class="sel-chip">Filtrando: <strong>' + esc_(c.sel.label(c)) + '</strong> · ' + c.filas.length + ' tiendas' +
      '<button type="button" data-sel-quitar title="Quitar filtro">×</button></span>';
    chip.style.display = 'block';
  } else {
    chip.innerHTML = ''; chip.style.display = 'none';
  }

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

  var masQuePrev = c.filas.filter(function (f) { return f.cAct > f.cPrev && (f.cAct > 0 || f.cPrev > 0); }).length;
  var arribaRitmo = c.filas.filter(function (f) { return f.cPrev > 0 && f.cAct <= f.cPrev && f.cAct / f.cPrev > c.mesesAct / 12; }).length;
  var conConsumo = c.filas.filter(function (f) { return f.cAct > 0 || f.cPrev > 0; }).length;
  var ok = tot.estados.ok || 0;
  var tiles = [
    { label: 'Capacidad instalada de frío alimentario', valor: num_(tot.capTotal) + ' kg', sub: tot.tiendas + ' tiendas activas' + (tot.estados.cerrada ? ' + ' + tot.estados.cerrada + ' cerradas' : '') }
  ];
  if (hay) {
    tiles.push({ label: 'Consumo de refrigerante (FA + AA)', valor: num_(tot.consTotal) + ' kg',
      sub: esc_(c.per.label) + ' · FA ' + num_(tot.consFA) + ' kg · AA ' + num_(tot.consTotal - tot.consFA) + ' kg' });
    tiles.push({ label: 'Consumo ' + c.anioAct + ' vs ' + c.anioPrev + ' (FA + AA)', valor: variacion_(tot.vsPrev),
      sub: num_(tot.cAct) + ' kg acumulados de ' + num_(tot.cPrev) + ' kg en ' + c.anioPrev + ' · ' + c.mesesAct + ' de 12 meses' });
    tiles.push({ sel: 'masQuePrev', label: 'Tiendas que consumieron más que en ' + c.anioPrev, valor: masQuePrev + ' de ' + conConsumo,
      sub: 'acumulado ' + c.anioAct + ' mayor al total ' + c.anioPrev + ' · ' + arribaRitmo + ' más van por encima del ritmo' });
    var sobreCap = c.filas.filter(function (f) { return f.cap > 0 && f.faAct > f.cap; });
    var conCapYConsumo = c.filas.filter(function (f) { return f.cap > 0 && f.faAct > 0; }).length;
    tiles.push({ sel: 'sobreCap', label: 'Tiendas que consumieron más que su capacidad instalada en ' + c.anioAct, valor: sobreCap.length + ' de ' + conCapYConsumo,
      sub: 'consumo FA ' + c.anioAct + ' mayor a su capacidad instalada de FA · ' + num_(sobreCap.reduce(function (s, f) { return s + f.faAct - f.cap; }, 0)) + ' kg por encima' });
    tiles.push({ label: 'Emisiones de CO₂ equivalente', valor: num_(tot.co2) + ' t', sub: 'kg recargados × poder de calentamiento (GWP) de cada gas' });
    tiles.push({ label: 'Costo del refrigerante', valor: '$ ' + compacto_(tot.importe), sub: 'importe SAP del período' });
  }
  tiles.push({ sel: 'pendientes', label: 'Avance del relevamiento', valor: pct_(tot.tiendas ? ok / tot.tiendas : 0), sub: ok + ' de ' + tot.tiendas + ' confirmadas', meter: tot.tiendas ? ok / tot.tiendas : 0 });
  document.getElementById('dash-tiles').innerHTML = tiles.map(function (t) {
    var activa = t.sel && DASH.filtros.sel === t.sel;
    return '<div class="card dash-tile' + (t.sel ? ' clicable' : '') + (activa ? ' activa' : '') + '"' +
      (t.sel ? ' data-sel="' + t.sel + '" role="button" tabindex="0" title="' + (activa ? 'Quitar filtro' : 'Filtrar el dashboard por estas tiendas') + '"' : '') + '>' +
      '<div class="dash-label">' + t.label + '</div><div class="dash-tile-valor">' + t.valor + '</div>' +
      (t.meter != null ? '<div class="meter"><div style="width:' + Math.round(t.meter * 100) + '%"></div></div>' : '') +
      '<div class="dash-sub">' + t.sub + (t.sel === 'pendientes' ? ' · clic: ver las pendientes' : '') + '</div></div>';
  }).join('');

  // Anillos
  var anillos = [donut_('Capacidad instalada por refrigerante', segmentosRef_(tot.cap, 'capRef'), 'kg instalados')];
  if (hay) anillos.push(donut_('Consumo por refrigerante (FA + AA)', segmentosRef_(tot.cons, 'consRef'), 'kg consumidos'));
  anillos.push(donut_('Estado del relevamiento', ESTADOS.map(function (e) {
    return { label: e.icono + ' ' + e.label, valor: tot.estados[e.key] || 0, color: e.color, sel: 'estado:' + e.key };
  }), 'tiendas', true));
  document.getElementById('dash-anillos').innerHTML = anillos.join('');

  document.getElementById('dash-equipos').innerHTML = barrasEquipo_(tot.porEquipo, tot.capTotal);

  // Barras por región / formato
  document.getElementById('dash-barras').innerHTML = hay
    ? barrasVsPrev_('Consumo por región · ' + c.anioAct + ' vs ' + c.anioPrev, agrupar_(c.filas, function (f) { return regionDe_(f.t); }), c, 'region') +
      barrasVsPrev_('Consumo por formato · ' + c.anioAct + ' vs ' + c.anioPrev, agrupar_(c.filas, function (f) { return f.t.formato || 'Sin formato'; }), c, 'formato')
    : barrasKg_('Capacidad instalada por región', agrupar_(c.filas, function (f) { return regionDe_(f.t); }));

  document.getElementById('dash-tendencia').innerHTML = hay ? mensualComparado_(c.mensual, c) : '';
  document.getElementById('dash-dispersion').innerHTML = hay ? dispersionVsPrev_(c.filas, c) : '';
  renderTablaDashboard_(c.filas, hay);
  activarTooltips_();
  activarClicsDashboard_();
}

function agrupar_(filas, clave) {
  var g = {};
  filas.forEach(function (f) {
    var k = clave(f);
    g[k] = g[k] || { label: k, cap: 0, anual: 0, n: 0, cAct: 0, cPrev: 0 };
    g[k].cap += f.cap; g[k].anual += f.anual; g[k].n++; g[k].cAct += f.cAct; g[k].cPrev += f.cPrev;
  });
  return Object.keys(g).map(function (k) { var x = g[k]; x.tasa = x.cap > 0 ? x.anual / x.cap : null; return x; });
}

function segmentosRef_(porRef, prefijo) {
  var orden = ['R22', 'R404', 'R290', 'R410A', 'R134a'];
  var claves = Object.keys(porRef).filter(function (k) { return porRef[k] > 0; });
  claves.sort(function (a, b) {
    var ia = orden.indexOf(a), ib = orden.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return claves.map(function (k) { return { label: k, valor: porRef[k], color: COLOR_REF[k] || COLOR_OTRO, sel: prefijo ? prefijo + ':' + k : null }; });
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
      ' transform="rotate(-90 80 80)" data-tip="' + tip + '"' + (s.sel ? ' data-sel="' + esc_(s.sel) + '" class="seg' + (DASH.filtros.sel === s.sel ? ' activo' : '') + '"' : '') + '></circle>';
    off += len;
  });
  if (!total) arcs = '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="#e1e0d9" stroke-width="' + W + '"></circle>';
  var leyenda = segs.map(function (s) {
    var activa = s.sel && DASH.filtros.sel === s.sel;
    return '<div class="leyenda-fila' + (s.sel ? ' clicable' : '') + (activa ? ' activa' : '') + '"' + (s.sel ? ' data-sel="' + esc_(s.sel) + '" role="button" tabindex="0"' : '') + '>' +
      '<span class="swatch" style="background:' + s.color + '"></span>' +
      '<span class="leyenda-label">' + esc_(s.label) + '</span>' +
      '<span class="leyenda-valor">' + (enteros ? s.valor : num_(s.valor)) + '</span>' +
      '<span class="leyenda-pct">' + (total ? pct_(s.valor / total) : '–') + '</span></div>';
  }).join('');
  return '<div class="card dash-chart"><div class="dash-chart-titulo">' + titulo + (segs.some(function (x) { return x.sel; }) ? ' <span class="dash-pista">clic para filtrar</span>' : '') + '</div>' +
    '<div class="donut-wrap"><svg viewBox="0 0 160 160" class="donut" role="img" aria-label="' + esc_(titulo) + '">' + arcs +
    '<text x="80" y="78" text-anchor="middle" class="donut-total">' + (enteros ? total : compacto_(total)) + '</text>' +
    '<text x="80" y="96" text-anchor="middle" class="donut-unidad">' + unidad + '</text></svg>' +
    '<div class="leyenda">' + leyenda + '</div></div></div>';
}

// Colores de la comparación anual: año anterior en celeste claro, año en curso en azul.
var COLOR_PREV = '#9ec5f4', COLOR_ACT = '#2a78d6';

function leyendaAnios_(c) {
  return '<div class="leyenda-linea"><span class="leyenda-inline"><span class="swatch" style="background:' + COLOR_PREV + ';margin-right:6px;"></span>' + c.anioPrev + ' (total)</span>' +
    '<span class="leyenda-inline"><span class="swatch" style="background:' + COLOR_ACT + ';margin-right:6px;"></span>' + c.anioAct + ' (acumulado a ' + MESES_CORTOS[c.mesesAct - 1] + ')</span></div>';
}

// Dos barras por grupo: total del año anterior y acumulado del año en curso, con la variación.
function barrasVsPrev_(titulo, grupos, c, campo) {
  grupos = grupos.filter(function (g) { return g.cAct > 0 || g.cPrev > 0; }).sort(function (a, b) { return b.cPrev - a.cPrev; });
  var max = topeRedondo_(grupos.reduce(function (m, g) { return Math.max(m, g.cAct, g.cPrev); }, 1));
  var LW = 120, BW = 300, ROW = 44, BH = 13, H = grupos.length * ROW + 26;
  var x = function (v) { return LW + v / max * BW; };
  var s = '<svg viewBox="0 0 ' + (LW + BW + 110) + ' ' + H + '" class="chart-svg" role="img" aria-label="' + esc_(titulo) + '">';
  [0, 0.25, 0.5, 0.75, 1].forEach(function (t) {
    s += '<line x1="' + x(max * t) + '" x2="' + x(max * t) + '" y1="0" y2="' + (H - 22) + '" class="grid"/>' +
      '<text x="' + x(max * t) + '" y="' + (H - 8) + '" text-anchor="middle" class="tick">' + num_(max * t) + '</text>';
  });
  grupos.forEach(function (g, i) {
    var y = 4 + i * ROW;
    var v = g.cPrev > 0 ? g.cAct / g.cPrev - 1 : null;
    var wp = Math.max(x(g.cPrev) - LW, g.cPrev > 0 ? 1 : 0), wa = Math.max(x(g.cAct) - LW, g.cAct > 0 ? 1 : 0);
    s += '<rect x="0" y="' + (y - 4) + '" width="' + (LW + BW + 110) + '" height="' + (ROW - 4) + '" fill="transparent" class="fila-clic" data-filtro="' + campo + '" data-valor="' + esc_(g.label) + '"/>' +
      '<text x="' + (LW - 8) + '" y="' + (y + 18) + '" text-anchor="end" class="bar-label">' + esc_(g.label) + '</text>' +
      '<path d="' + barraH_(LW, y, wp, BH) + '" fill="' + COLOR_PREV + '" data-tip="' + esc_(g.label) + ' · ' + c.anioPrev + ': ' + num_(g.cPrev) + ' kg"/>' +
      '<text x="' + (LW + wp + 6) + '" y="' + (y + 11) + '" class="tick">' + num_(g.cPrev) + '</text>' +
      '<path d="' + barraH_(LW, y + BH + 2, wa, BH) + '" fill="' + COLOR_ACT + '" data-tip="' + esc_(g.label) + ' · ' + c.anioAct + ': ' + num_(g.cAct) + ' kg (' + variacion_(v) + ' vs ' + c.anioPrev + ')"/>' +
      '<text x="' + (LW + wa + 6) + '" y="' + (y + BH + 13) + '" class="bar-valor">' + num_(g.cAct) + ' · ' + variacion_(v) + '</text>';
  });
  s += '</svg>';
  return '<div class="card dash-chart"><div class="dash-chart-titulo">' + titulo + ' (kg, FA + AA) <span class="dash-pista">clic en una fila para filtrar</span></div>' + leyendaAnios_(c) + s + '</div>';
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

// Consumo mes a mes: año anterior y año en curso lado a lado (FA + AA).
function mensualComparado_(mensual, c) {
  var meses = [];
  for (var m = 1; m <= 12; m++) {
    meses.push({ m: m, prev: mensual[c.anioPrev * 12 + m] || 0, act: m <= c.mesesAct ? (mensual[c.anioAct * 12 + m] || 0) : null });
  }
  var tope = topeRedondo_(meses.reduce(function (mx, x) { return Math.max(mx, x.prev, x.act || 0); }, 1));
  var L = 56, W = 1100, H = 262, B = 205, slot = (W - L) / 12, bw = Math.min(22, (slot - 14) / 2);
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart-svg" role="img" aria-label="Consumo mensual ' + c.anioPrev + ' vs ' + c.anioAct + '">';
  [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
    var y = B - f * (B - 10);
    s += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="grid"/>' +
      '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="tick">' + num_(tope * f) + '</text>';
  });
  meses.forEach(function (d, i) {
    var x0 = L + i * slot + (slot - (bw * 2 + 2)) / 2;
    var hp = d.prev / tope * (B - 10), ha = (d.act || 0) / tope * (B - 10);
    var v = d.act != null && d.prev > 0 ? d.act / d.prev - 1 : null;
    var tip = MESES_CORTOS[d.m - 1] + ': ' + c.anioPrev + ' ' + num_(d.prev) + ' kg · ' + c.anioAct + ' ' + (d.act == null ? 'sin datos aún' : num_(d.act) + ' kg (' + variacion_(v) + ')');
    s += '<path d="' + barraV_(x0, B, bw, Math.max(hp, d.prev > 0 ? 1 : 0)) + '" fill="' + COLOR_PREV + '"/>';
    if (d.act != null) s += '<path d="' + barraV_(x0 + bw + 2, B, bw, Math.max(ha, d.act > 0 ? 1 : 0)) + '" fill="' + COLOR_ACT + '"/>';
    s += '<rect x="' + (L + i * slot) + '" y="10" width="' + slot + '" height="' + (B - 10) + '" fill="transparent" data-tip="' + tip + '"/>' +
      '<text x="' + (L + i * slot + slot / 2) + '" y="' + (B + 18) + '" text-anchor="middle" class="tick">' + MESES_CORTOS[d.m - 1] + '</text>';
    if (v != null) {
      // ▼ ahorro (consumió menos que el mismo mes del año anterior) · ▲ desvío (consumió más)
      var ahorro = v < 0;
      s += '<text x="' + (L + i * slot + slot / 2) + '" y="' + (B + 40) + '" text-anchor="middle" class="var-mes">' +
        '<tspan fill="' + (ahorro ? STATUS.good : STATUS.critical) + '">' + (ahorro ? '▼' : '▲') + '</tspan> ' +
        (Math.round(Math.abs(v) * 1000) / 10).toLocaleString('es-AR') + '%</text>';
    }
  });
  s += '</svg>';
  var leyendaVar = '<div class="leyenda-linea" style="margin-top:6px;"><span class="leyenda-inline"><span style="color:' + STATUS.good + ';margin-right:4px;">▼</span>ahorro vs mismo mes ' + c.anioPrev + '</span>' +
    '<span class="leyenda-inline"><span style="color:' + STATUS.critical + ';margin-right:4px;">▲</span>desvío (consumió más)</span></div>';
  return '<div class="card dash-chart"><div class="dash-chart-titulo">Consumo mensual de refrigerante · ' + c.anioAct + ' vs ' + c.anioPrev + ' (kg, FA + AA)</div>' + leyendaAnios_(c) + s + leyendaVar + '</div>';
}

// Estado de una tienda frente al año anterior (acumulado del año vs total del año anterior).
function nivelVsPrev_(cAct, cPrev) {
  if (!(cPrev > 0)) return cAct > 0 ? { color: STATUS.critical, icono: '!', label: 'Sin consumo el año anterior' } : { color: STATUS.muted, icono: '–', label: 'Sin consumo' };
  var uso = cAct / cPrev, ritmo = DASH.mesesAct / 12;
  if (uso > 1) return { color: STATUS.critical, icono: '!', label: 'Consumió más que todo el año anterior' };
  if (uso > ritmo) return { color: STATUS.serious, icono: '▲', label: 'Va por encima del ritmo del año anterior' };
  return { color: STATUS.good, icono: '✓', label: 'Por debajo del año anterior' };
}

// Cada tienda: consumo del año anterior (X) contra acumulado del año en curso (Y).
function dispersionVsPrev_(filas, c) {
  var pts = filas.filter(function (f) { return f.cAct > 0 || f.cPrev > 0; });
  var vals = pts.map(function (f) { return Math.max(f.cAct, f.cPrev); }).sort(function (a, b) { return a - b; });
  var p98 = vals.length ? vals[Math.floor((vals.length - 1) * 0.98)] : 1;
  var maxV = topeRedondo_(Math.max(p98, 1));
  var L = 64, W = 1100, H = 420, B = 380, T = 10, R = W - 10;
  var x = function (v) { return L + Math.min(v, maxV) / maxV * (R - L); };
  var y = function (v) { return B - Math.min(v, maxV) / maxV * (B - T); };
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart-svg" role="img" aria-label="Consumo por tienda ' + c.anioAct + ' vs ' + c.anioPrev + '">';
  [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
    s += '<line x1="' + L + '" x2="' + R + '" y1="' + y(maxV * f) + '" y2="' + y(maxV * f) + '" class="grid"/>' +
      '<text x="' + (L - 6) + '" y="' + (y(maxV * f) + 4) + '" text-anchor="end" class="tick">' + num_(maxV * f) + '</text>' +
      '<text x="' + x(maxV * f) + '" y="' + (B + 16) + '" text-anchor="' + (f === 1 ? 'end' : 'middle') + '" class="tick">' + num_(maxV * f) + '</text>';
  });
  var ritmo = c.mesesAct / 12;
  s += '<line x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(maxV) + '" y2="' + y(maxV) + '" class="ref-line"/>' +
    '<text x="' + (x(maxV) - 4) + '" y="' + (y(maxV) + 14) + '" text-anchor="end" class="ref-label">Igual al total ' + c.anioPrev + '</text>' +
    '<line x1="' + x(0) + '" y1="' + y(0) + '" x2="' + x(maxV) + '" y2="' + y(maxV * ritmo) + '" class="ref-line" style="stroke-dasharray:0;opacity:.45"/>' +
    '<text x="' + (x(maxV) - 4) + '" y="' + (y(maxV * ritmo) - 6) + '" text-anchor="end" class="ref-label">Ritmo ' + c.anioPrev + ' a ' + MESES_CORTOS[c.mesesAct - 1] + ' (' + Math.round(ritmo * 100) + '%)</text>';
  pts.forEach(function (f) {
    var nv = nivelVsPrev_(f.cAct, f.cPrev);
    var tip = f.t.numero + ' · ' + esc_(f.t.local) + ' — ' + c.anioPrev + ': ' + num_(f.cPrev) + ' kg · ' + c.anioAct + ': ' + num_(f.cAct) + ' kg (' + variacion_(f.vsPrev) + ') · ' + nv.label;
    s += '<circle cx="' + x(f.cPrev) + '" cy="' + y(f.cAct) + '" r="4.5" fill="' + nv.color + '" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="' + x(f.cPrev) + '" cy="' + y(f.cAct) + '" r="9" fill="transparent" data-tip="' + tip + '"/>';
  });
  s += '<text x="' + ((L + W) / 2) + '" y="' + (H - 4) + '" text-anchor="middle" class="axis-titulo">Consumo total ' + c.anioPrev + ' (kg)</text>' +
    '<text x="12" y="' + (B / 2) + '" text-anchor="middle" class="axis-titulo" transform="rotate(-90 12 ' + (B / 2) + ')">Consumo acumulado ' + c.anioAct + ' (kg)</text></svg>';
  var leyenda = [nivelVsPrev_(1, 10), nivelVsPrev_(9, 10), nivelVsPrev_(11, 10)].map(function (n) {
    return '<span class="leyenda-inline"><span class="status-dot" style="background:' + n.color + '">' + n.icono + '</span>' + esc_(n.label) + '</span>';
  }).join('');
  return '<div class="card dash-chart"><div class="dash-chart-titulo">Consumo por tienda · ' + c.anioAct + ' vs ' + c.anioPrev + ' (kg, FA + AA)</div>' +
    '<div class="leyenda-linea">' + leyenda + '</div>' + s +
    '<p class="dash-nota">Cada punto es una tienda. Arriba de la línea "Igual al total ' + c.anioPrev + '" ya consumió en ' + c.anioAct + ' más que en todo ' + c.anioPrev + '; entre las dos líneas va por encima del ritmo del año anterior.</p></div>';
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
  { key: 'jefe', label: 'Jefe', val: function (f) { return f.t.jefe_nombre || ''; } },
  { key: 'formato', label: 'Formato', val: function (f) { return f.t.formato || ''; } },
  { key: 'cap', label: 'Capacidad (kg)', num: true, val: function (f) { return f.cap; } },
  { key: 'cAct', label: 'Consumo año en curso (kg)', num: true, consumo: true, val: function (f) { return f.cAct; } },
  { key: 'cPrev', label: 'Consumo año anterior (kg)', num: true, consumo: true, val: function (f) { return f.cPrev; } },
  { key: 'sobrePrev', label: 'Kg sobre año anterior', num: true, consumo: true, val: function (f) { return f.sobrePrev; } },
  { key: 'vsPrev', label: '% desvío', num: true, consumo: true, val: function (f) { return f.vsPrev; } },
  { key: 'est', label: 'Relevamiento', val: function (f) { return f.est; } }
].concat(CATEGORIAS_CAPACIDAD.map(function (cat) {
  return { key: 'comp:' + cat.label, label: cat.label.replace('autocontenidas', 'autocont.'), num: true, comp: true, val: function (f) { return f.comp[cat.label] || 0; } };
}));

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
  var anioAct = Math.floor((DASH.datos.ultimoMes - 1) / 12);
  var etiqueta = function (c) {
    return c.label.replace('año en curso', String(anioAct)).replace('año anterior', String(anioAct - 1));
  };
  var html = '<table class="dash-tabla"><thead><tr>' + cols.map(function (c) {
    var flecha = c.key === tb.orden ? (tb.desc ? ' ↓' : ' ↑') : '';
    return '<th class="' + (c.num ? 'num' : '') + (c.comp ? ' th-comp' : '') + '" data-col="' + c.key + '">' + etiqueta(c) + flecha + '</th>';
  }).join('') + '</tr></thead><tbody>';
  lista.slice(0, tb.limite).forEach(function (f) {
    var est = ESTADOS.find(function (e) { return e.key === f.est; }) || { label: 'Cerrada', color: STATUS.muted, icono: '–' };
    html += '<tr>' + cols.map(function (c) {
      switch (c.key) {
        case 'tienda': return '<td><strong>' + f.t.numero + '</strong> · ' + esc_(f.t.local) + '</td>';
        case 'sobrePrev': return '<td class="num">' + (f.sobrePrev > 0 ? '+' + num_(f.sobrePrev) : num_(f.sobrePrev)) + '</td>';
        case 'vsPrev': return '<td class="num">' + celdaVsPrev_(f) + '</td>';
        case 'est': return '<td><span class="status-dot" style="background:' + est.color + '">' + est.icono + '</span>' + esc_(est.label) + '</td>';
        default: return c.num ? '<td class="num">' + num_(c.val(f)) + '</td>' : '<td>' + esc_(c.val(f)) + '</td>';
      }
    }).join('') + '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('dash-tabla').innerHTML = html;
  sincronizarScrollTabla_();
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

// Barra de desplazamiento horizontal también arriba de la tabla, sincronizada con la de abajo.
window.addEventListener('resize', function () {
  if (document.getElementById('view-dashboard').classList.contains('active')) sincronizarScrollTabla_();
});

function sincronizarScrollTabla_() {
  var abajo = document.getElementById('dash-tabla');
  var arriba = document.getElementById('dash-tabla-scroll-top');
  var hayScroll = abajo.scrollWidth > abajo.clientWidth;
  arriba.style.display = hayScroll ? 'block' : 'none';
  if (!hayScroll) return;
  // Mismo recorrido en las dos barras: (ancho interno - ancho visible) igual arriba y abajo.
  arriba.firstElementChild.style.width = (abajo.scrollWidth - abajo.clientWidth + arriba.clientWidth) + 'px';
  arriba.scrollLeft = abajo.scrollLeft;
  // Manda la barra que se está moviendo; la otra sólo la sigue y no devuelve la posición
  // (si las dos se copian entre sí, los redondeos de píxeles generan tirones).
  var lider = null, soltar = null;
  var seguir = function (origen, destino, nombre) {
    return function () {
      if (lider && lider !== nombre) return;
      lider = nombre;
      destino.scrollLeft = origen.scrollLeft;
      clearTimeout(soltar);
      soltar = setTimeout(function () { lider = null; }, 120);
    };
  };
  arriba.onscroll = seguir(arriba, abajo, 'arriba');
  abajo.onscroll = seguir(abajo, arriba, 'abajo');
}

function exportarDashboardCSV() {
  var c = calcularDashboard_();
  var sep = ';';
  var lineas = [['Tienda', 'Local', 'Región', 'Jefe', 'Formato', 'Capacidad FA kg', 'R22 kg', 'R404 kg', 'R290 kg',
    'Consumo ' + c.anioAct + ' FA+AA kg', 'Consumo ' + c.anioPrev + ' FA+AA kg', 'Kg sobre ' + c.anioPrev, '% desvío', 'Estado relevamiento']
    .concat(CATEGORIAS_CAPACIDAD.map(function (cat) { return cat.label + ' (cant.)'; })).join(sep)];
  c.filas.forEach(function (f) {
    var n = function (v) { return v == null ? '' : String(Math.round(v * 100) / 100).replace('.', ','); };
    lineas.push([f.t.numero, f.t.local, regionDe_(f.t), f.t.jefe_nombre, f.t.formato, n(f.cap), n(f.capRef.R22), n(f.capRef.R404), n(f.capRef.R290),
      n(f.cAct), n(f.cPrev), n(f.sobrePrev), f.vsPrev == null ? '' : n(f.vsPrev * 100), f.est]
      .concat(CATEGORIAS_CAPACIDAD.map(function (cat) { return f.comp[cat.label] || 0; }))
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

function activarClicsDashboard_() {
  var cont = document.getElementById('view-dashboard');
  if (cont.dataset.clics) return;
  cont.dataset.clics = '1';
  var accion = function (e) {
    var quitar = e.target.closest('[data-sel-quitar]');
    var el = e.target.closest('[data-sel]');
    var fil = e.target.closest('[data-filtro]');
    if (quitar) { DASH.filtros.sel = null; }
    else if (el) { DASH.filtros.sel = DASH.filtros.sel === el.dataset.sel ? null : el.dataset.sel; }
    else if (fil) {
      var campo = fil.getAttribute('data-filtro'), valor = fil.getAttribute('data-valor');
      DASH.filtros[campo] = DASH.filtros[campo] === valor ? '' : valor;
      document.getElementById('dash-f-' + campo).value = DASH.filtros[campo];
    } else return;
    DASH.tabla.limite = 30;
    renderDashboard_();
    sincronizarScrollTabla_();
  };
  cont.addEventListener('click', accion);
  cont.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('[data-sel]')) { e.preventDefault(); accion(e); } } });
}

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

function variacion_(v) {
  if (v == null || isNaN(v)) return '–';
  return (v > 0 ? '+' : v < 0 ? '−' : '') + (Math.round(Math.abs(v) * 1000) / 10).toLocaleString('es-AR') + '%';
}

// Acumulado del año vs total del año anterior: ya lo superó (crítico), va por encima del ritmo
// del año (meses transcurridos / 12) o va por debajo.
function celdaVsPrev_(f) {
  var nv = nivelVsPrev_(f.cAct, f.cPrev);
  if (f.vsPrev == null) return f.cAct > 0 ? '<span class="status-dot" style="background:' + nv.color + '" title="' + nv.label + '">' + nv.icono + '</span>Sin consumo previo' : '–';
  return '<span class="status-dot" style="background:' + nv.color + '" title="' + nv.label + '">' + nv.icono + '</span>' + variacion_(f.vsPrev);
}

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
