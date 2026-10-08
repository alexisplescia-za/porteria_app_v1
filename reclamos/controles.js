// Controles estilo Andes UI (desplegable y calendario) para Reclamos.
// El <select> / <input type="date"> original queda oculto y sigue siendo la fuente del valor:
// el resto de la app lo lee y escucha sus eventos 'input'/'change' como siempre.
//   Andes.mejorar(raiz)  → reemplaza visualmente los controles nuevos dentro de `raiz`.
//   Andes.refrescar()    → actualiza los textos si el valor cambió por código (reset, armado de opciones).

var Andes = (function () {
  var panel = null, abierto = null;
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];
  var CHEVRON = '<svg class="andes-chev" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CALENDARIO = '<svg class="andes-cal" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 6.5h13M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var CHECK = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function avisar(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ---------- panel flotante compartido ----------
  function cerrar() {
    if (panel) { panel.remove(); panel = null; }
    if (abierto) { abierto.btn.setAttribute('aria-expanded', 'false'); abierto.btn.classList.remove('abierto'); abierto = null; }
  }
  function abrirPanel(btn, html, clase) {
    cerrar();
    panel = document.createElement('div');
    panel.className = 'andes-panel ' + clase;
    panel.innerHTML = html;
    document.body.appendChild(panel);
    ubicar(btn);
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('abierto');
    return panel;
  }
  function ubicar(btn) {
    if (!panel) return;
    var r = btn.getBoundingClientRect();
    var ancho = Math.max(r.width, panel.classList.contains('andes-fecha') ? 300 : 0);
    var izq = Math.min(r.left, window.innerWidth - ancho - 8);
    var abajo = window.innerHeight - r.bottom;
    panel.style.minWidth = r.width + 'px';
    panel.style.left = Math.max(8, izq) + 'px';
    var alto = panel.offsetHeight;
    if (abajo < alto + 12 && r.top > alto + 12) panel.style.top = (r.top - alto - 4) + 'px';
    else panel.style.top = (r.bottom + 4) + 'px';
  }
  document.addEventListener('mousedown', function (e) {
    if (panel && !panel.contains(e.target) && !(abierto && abierto.btn.contains(e.target))) cerrar();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel) { var b = abierto && abierto.btn; cerrar(); if (b) b.focus(); } });
  window.addEventListener('resize', cerrar);
  window.addEventListener('scroll', function (e) {
    if (panel && !panel.contains(e.target) && abierto) ubicar(abierto.btn);
  }, true);

  // ---------- desplegable ----------
  function mejorarSelect(sel) {
    sel.dataset.andes = '1';
    sel.classList.add('andes-oculto');
    sel.tabIndex = -1;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'andes-select';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    if (sel.getAttribute('aria-label')) btn.setAttribute('aria-label', sel.getAttribute('aria-label'));
    sel.insertAdjacentElement('afterend', btn);
    sel._andesBtn = btn;
    btn.onclick = function () { if (abierto && abierto.btn === btn) cerrar(); else abrirSelect(sel, btn); };
    btn.onkeydown = function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrirSelect(sel, btn); }
    };
    pintarSelect(sel);
  }
  function pintarSelect(sel) {
    var btn = sel._andesBtn; if (!btn) return;
    var op = sel.options[sel.selectedIndex];
    var vacio = !op || op.value === '';
    btn.innerHTML = '<span class="andes-texto' + (vacio ? ' placeholder' : '') + '">' + esc(op ? op.text : 'Seleccionar…') + '</span>' + CHEVRON;
    btn.disabled = sel.disabled;
  }
  function abrirSelect(sel, btn) {
    var ops = Array.prototype.map.call(sel.options, function (o, i) { return { i: i, v: o.value, t: o.text }; });
    var html = '<div role="listbox">' + ops.map(function (o) {
      var elegido = o.i === sel.selectedIndex;
      return '<div class="andes-op' + (elegido ? ' elegida' : '') + '" role="option" aria-selected="' + elegido + '" data-i="' + o.i + '">' +
        '<span>' + esc(o.t) + '</span>' + (elegido ? CHECK : '') + '</div>';
    }).join('') + '</div>';
    var p = abrirPanel(btn, html, 'andes-lista');
    abierto = { btn: btn, sel: sel };
    var activa = p.querySelector('.elegida') || p.querySelector('.andes-op');
    marcar(activa);
    p.onmousedown = function (e) { e.preventDefault(); };
    p.onclick = function (e) {
      var op = e.target.closest('.andes-op'); if (!op) return;
      elegir(sel, Number(op.dataset.i));
    };
    p.onmousemove = function (e) { var op = e.target.closest('.andes-op'); if (op) marcar(op); };
    btn.onkeydown = function (e) {
      if (!panel) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); abrirSelect(sel, btn); } return; }
      var lista = Array.prototype.slice.call(panel.querySelectorAll('.andes-op'));
      var actual = panel.querySelector('.activa'), i = lista.indexOf(actual);
      if (e.key === 'ArrowDown') { e.preventDefault(); marcar(lista[Math.min(i + 1, lista.length - 1)]); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(lista[Math.max(i - 1, 0)]); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (actual) elegir(sel, Number(actual.dataset.i)); }
      else if (e.key === 'Tab') cerrar();
      else if (e.key.length === 1) {
        var letra = e.key.toLowerCase();
        var hallada = lista.find(function (op) { return op.textContent.trim().toLowerCase().indexOf(letra) === 0; });
        if (hallada) marcar(hallada);
      }
    };
  }
  function marcar(op) {
    if (!panel || !op) return;
    var prev = panel.querySelector('.activa'); if (prev) prev.classList.remove('activa');
    op.classList.add('activa');
    op.scrollIntoView({ block: 'nearest' });
  }
  function elegir(sel, i) {
    var btn = sel._andesBtn;
    var cambio = sel.selectedIndex !== i;
    sel.selectedIndex = i;
    cerrar();
    pintarSelect(sel);
    if (btn) btn.focus();
    if (cambio) avisar(sel);
  }

  // ---------- calendario ----------
  function aISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function deISO(s) { if (!s) return null; var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function mejorarFecha(inp) {
    inp.dataset.andes = '1';
    inp.classList.add('andes-oculto');
    inp.tabIndex = -1;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'andes-select andes-boton-fecha';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-label', inp.title || inp.getAttribute('aria-label') || 'Elegir fecha');
    inp.insertAdjacentElement('afterend', btn);
    inp._andesBtn = btn;
    btn.onclick = function () {
      if (abierto && abierto.btn === btn) { cerrar(); return; }
      var base = deISO(inp.value) || new Date();
      abrirFecha(inp, btn, base.getFullYear(), base.getMonth());
    };
    pintarFecha(inp);
  }
  function pintarFecha(inp) {
    var btn = inp._andesBtn; if (!btn) return;
    var d = deISO(inp.value);
    btn.innerHTML = '<span class="andes-texto' + (d ? '' : ' placeholder') + '">' +
      (d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() : (inp.placeholder || 'dd/mm/aaaa')) +
      '</span>' + CALENDARIO;
    btn.disabled = inp.disabled;
  }
  function abrirFecha(inp, btn, anio, mes) {
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var elegida = deISO(inp.value);
    var primero = new Date(anio, mes, 1);
    var desplaz = (primero.getDay() + 6) % 7;            // la semana arranca el lunes
    var diasMes = new Date(anio, mes + 1, 0).getDate();
    var celdas = '';
    for (var i = 0; i < desplaz; i++) celdas += '<span></span>';
    for (var d = 1; d <= diasMes; d++) {
      var f = new Date(anio, mes, d);
      var cls = 'andes-dia' + (+f === +hoy ? ' hoy' : '') + (elegida && +f === +elegida ? ' elegida' : '');
      celdas += '<button type="button" class="' + cls + '" data-d="' + d + '">' + d + '</button>';
    }
    var html = '<div class="andes-cal-cab"><button type="button" class="andes-nav" data-nav="-1" aria-label="Mes anterior">‹</button>' +
      '<b>' + MESES[mes] + ' ' + anio + '</b>' +
      '<button type="button" class="andes-nav" data-nav="1" aria-label="Mes siguiente">›</button></div>' +
      '<div class="andes-grilla">' + DIAS.map(function (x) { return '<span class="andes-dsem">' + x + '</span>'; }).join('') + celdas + '</div>' +
      '<div class="andes-cal-pie"><button type="button" class="andes-link" data-accion="hoy">Hoy</button>' +
      '<button type="button" class="andes-link" data-accion="borrar">Borrar</button></div>';
    var p = abrirPanel(btn, html, 'andes-fecha');
    abierto = { btn: btn, inp: inp };
    p.onmousedown = function (e) { e.preventDefault(); };
    p.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.nav) { var m = mes + Number(b.dataset.nav); abrirFecha(inp, btn, anio + Math.floor(m / 12), (m % 12 + 12) % 12); return; }
      if (b.dataset.d) return fijar(inp, aISO(new Date(anio, mes, Number(b.dataset.d))));
      if (b.dataset.accion === 'hoy') return fijar(inp, aISO(hoy));
      if (b.dataset.accion === 'borrar') return fijar(inp, '');
    };
  }
  function fijar(inp, valor) {
    var cambio = inp.value !== valor;
    inp.value = valor;
    cerrar();
    pintarFecha(inp);
    if (inp._andesBtn) inp._andesBtn.focus();
    if (cambio) avisar(inp);
  }

  // ---------- API ----------
  function mejorar(raiz) {
    (raiz || document).querySelectorAll('select:not([data-andes])').forEach(mejorarSelect);
    (raiz || document).querySelectorAll('input[type="date"]:not([data-andes])').forEach(mejorarFecha);
  }
  function refrescar() {
    document.querySelectorAll('select[data-andes]').forEach(pintarSelect);
    document.querySelectorAll('input[type="date"][data-andes]').forEach(pintarFecha);
  }
  return { mejorar: mejorar, refrescar: refrescar, cerrar: cerrar };
})();
