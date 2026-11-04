(function () {
  'use strict';

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  var USUARIOS = [];
  var TIENDAS  = [];

  var $ = function (id) { return document.getElementById(id); };

  function show(id) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    $(id).classList.add('active');
  }

  function toast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.hidden = false;
    setTimeout(function () { el.hidden = true; }, 3000);
  }

  function fmtFecha(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ─── Login ─── */
  $('f-login').addEventListener('submit', async function (e) {
    e.preventDefault();
    var email = $('login-email').value.trim().toLowerCase();
    var pw    = $('login-password').value;
    if (!email || !pw) return;

    $('login-error').hidden = true;
    $('btn-login').disabled = true;
    $('btn-login').textContent = 'Verificando…';

    var res = await sb.auth.signInWithPassword({ email: email, password: pw });
    if (res.error) {
      $('login-error').textContent = 'Email o contraseña incorrectos.';
      $('login-error').hidden = false;
      $('btn-login').disabled = false;
      $('btn-login').textContent = 'Entrar';
      return;
    }

    var admin = await sb.rpc('es_admin');
    if (!admin.data) {
      $('login-error').textContent = 'Tu usuario no tiene permisos de administrador.';
      $('login-error').hidden = false;
      await sb.auth.signOut();
      $('btn-login').disabled = false;
      $('btn-login').textContent = 'Entrar';
      return;
    }

    $('admin-email').textContent = email;
    await cargarPanel();
  });

  /* ─── Sesión existente ─── */
  async function iniciar() {
    var ses = await sb.auth.getSession();
    if (ses.data.session) {
      var admin = await sb.rpc('es_admin');
      if (admin.data) {
        $('admin-email').textContent = ses.data.session.user.email;
        await cargarPanel();
        return;
      }
    }
    show('view-login');
  }

  /* ─── Cargar panel ─── */
  async function cargarPanel() {
    show('view-loading');
    await Promise.all([cargarUsuarios(), cargarTiendas(), cargarAccesos()]);
    show('view-panel');
  }

  /* ─── Accesos por módulo (SQL 031) ─── */
  var ACCESOS = [];
  var MODULOS_ACCESO = ['porteria', 'reclamos', 'frio', 'admin'];

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  async function cargarAccesos() {
    var res = await sb.rpc('admin_listar_accesos');
    if (res.error) {
      ACCESOS = [];
      $('accesos-error').textContent = 'No se pudieron cargar los accesos. ¿Está aplicado el SQL 031? (' + res.error.message + ')';
      $('accesos-error').hidden = false;
    } else {
      ACCESOS = res.data || [];
      $('accesos-error').hidden = true;
    }
    renderAccesos();
  }

  function renderAccesos() {
    var q = $('buscar-acceso').value.trim().toLowerCase();
    var lista = ACCESOS.filter(function (u) {
      return !q || (u.email + ' ' + (u.nombre || '')).toLowerCase().indexOf(q) !== -1;
    });
    var html = lista.map(function (u) {
      var mods = u.modulos || [];
      var celdas = MODULOS_ACCESO.map(function (m) {
        var nombre = (window.Acceso && Acceso.NOMBRES[m]) || m;
        return '<td class="chk-acceso-cel" style="text-align:center"><label><input type="checkbox" class="chk-acceso"' +
          ' data-email="' + esc(u.email) + '" data-modulo="' + m + '"' +
          ' aria-label="' + esc(nombre + ' para ' + u.email) + '"' +
          (mods.indexOf(m) !== -1 ? ' checked' : '') + '><span class="chk-txt">' + esc(nombre) + '</span></label></td>';
      }).join('');
      return '<tr><td>' + esc(u.email) + (u.nombre ? '<div class="muted" style="font-size:12px">' + esc(u.nombre) + '</div>' : '') + '</td>' +
        celdas +
        '<td>' + (u.ultimo_ingreso ? fmtFecha(u.ultimo_ingreso) : '<span class="badge badge-red">Nunca</span>') + '</td></tr>';
    }).join('');
    $('tabla-accesos').innerHTML = html || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Sin resultados</td></tr>';
    $('tabla-accesos-info').textContent = 'Mostrando ' + lista.length + ' de ' + ACCESOS.length + ' usuarios';
  }

  $('buscar-acceso').addEventListener('input', renderAccesos);

  $('tabla-accesos').addEventListener('change', async function (e) {
    var chk = e.target;
    if (!chk.classList || !chk.classList.contains('chk-acceso')) return;
    var email = chk.dataset.email, modulo = chk.dataset.modulo, habilitado = chk.checked;
    chk.disabled = true;
    var res = await sb.rpc('admin_set_acceso', { p_email: email, p_modulo: modulo, p_habilitado: habilitado });
    chk.disabled = false;
    var nombre = (window.Acceso && Acceso.NOMBRES[modulo]) || modulo;
    if (res.error) {
      chk.checked = !habilitado;
      toast('No se pudo guardar: ' + res.error.message);
      return;
    }
    var u = ACCESOS.find(function (x) { return x.email === email; });
    if (u) {
      u.modulos = (u.modulos || []).filter(function (m) { return m !== modulo; });
      if (habilitado) u.modulos.push(modulo);
    }
    toast((habilitado ? 'Habilitado ' : 'Quitado ') + nombre + ' para ' + email);
  });

  /* ─── Usuarios ─── */
  async function cargarUsuarios() {
    var res = await sb.rpc('admin_listar_usuarios');
    if (res.error) {
      console.error('admin_listar_usuarios error:', res.error);
      USUARIOS = [];
    } else {
      USUARIOS = res.data || [];
    }
    renderUsuarios();
  }

  function renderUsuarios() {
    var q     = $('buscar-usuario').value.trim().toLowerCase();
    var fPw   = $('filtro-pw').value;
    var fLog  = $('filtro-login').value;
    var fMod  = $('filtro-modulo').value;

    var lista = USUARIOS.filter(function (u) {
      if (q && u.email.indexOf(q) === -1) return false;
      if (fPw === 'generica' && !u.tiene_password_generica) return false;
      if (fPw === 'propia'   && u.tiene_password_generica)  return false;
      if (fLog === 'si' && !u.last_sign_in_at) return false;
      if (fLog === 'no' && u.last_sign_in_at)  return false;
      if (fMod && !(u.modulos || []).some(function (m) { return m === fMod; })) return false;
      return true;
    });

    var totalGen  = USUARIOS.filter(function (u) { return u.tiene_password_generica; }).length;
    var totalProp = USUARIOS.filter(function (u) { return !u.tiene_password_generica; }).length;
    var totalLog  = USUARIOS.filter(function (u) { return u.last_sign_in_at; }).length;

    $('kpis').innerHTML =
      '<div class="kpi"><div class="kpi-label">Total usuarios</div><div class="kpi-value">' + USUARIOS.length + '</div></div>' +
      '<div class="kpi"><div class="kpi-label">Contraseña genérica</div><div class="kpi-value" style="color:var(--warn)">' + totalGen + '</div><div class="kpi-sub">No la cambiaron</div></div>' +
      '<div class="kpi"><div class="kpi-label">Contraseña propia</div><div class="kpi-value" style="color:var(--ok)">' + totalProp + '</div><div class="kpi-sub">Ya la cambiaron</div></div>' +
      '<div class="kpi"><div class="kpi-label">Ingresaron alguna vez</div><div class="kpi-value">' + totalLog + '</div></div>';

    var html = '';
    lista.forEach(function (u) {
      var pw = u.password_visible || null;
      var badgeCls = u.tiene_password_generica ? 'badge-amber' : 'badge-green';
      var badgeTxt = u.tiene_password_generica ? 'Genérica' : 'Propia';
      var pwCell;
      if (pw) {
        pwCell = '<span class="pw-valor" data-pw="' + pw.replace(/"/g, '&quot;') + '"><span class="pw-text">•••••••</span> <button class="btn-ojo" title="Ver contraseña">👁</button></span> <span class="badge ' + badgeCls + '">' + badgeTxt + '</span>';
      } else {
        pwCell = '<span class="pw-hidden">•••••••</span> <span class="badge badge-red">Desconocida</span>';
      }
      var lastLogin = u.last_sign_in_at ? fmtFecha(u.last_sign_in_at) : '<span class="badge badge-red">Nunca</span>';

      var mods = (u.modulos || []).map(function (m) {
        var cls = m === 'Frío Alimentario' ? 'badge-green' : m === 'Eficiencia Energética' ? 'badge-amber' : 'badge-red';
        return '<span class="badge ' + cls + '">' + m + '</span>';
      }).join(' ') || '<span style="color:var(--muted)">—</span>';

      html += '<tr data-uid="' + u.id + '">' +
        '<td>' + u.email + '</td>' +
        '<td>' + mods + '</td>' +
        '<td>' + pwCell + '</td>' +
        '<td>' + lastLogin + '</td>' +
        '<td>' + fmtFecha(u.created_at) + '</td>' +
        '<td class="acciones-cell">' +
          '<button class="btn-sm btn-cambiar-pw" data-uid="' + u.id + '" data-email="' + u.email + '">Cambiar</button>' +
          '<button class="btn-sm danger btn-reset" data-uid="' + u.id + '" data-email="' + u.email + '">Resetear</button>' +
        '</td>' +
        '</tr>';
    });

    $('tabla-usuarios').innerHTML = html || '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">Sin resultados</td></tr>';
    $('tabla-info').textContent = 'Mostrando ' + lista.length + ' de ' + USUARIOS.length + ' usuarios';

    document.querySelectorAll('.btn-reset').forEach(function (btn) {
      btn.addEventListener('click', function () {
        confirmarReset(btn.dataset.uid, btn.dataset.email);
      });
    });

    document.querySelectorAll('.btn-cambiar-pw').forEach(function (btn) {
      btn.addEventListener('click', function () {
        abrirCambiarPassword(btn.dataset.uid, btn.dataset.email);
      });
    });

    document.querySelectorAll('.btn-ojo').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.pw-valor');
        var txt = wrap.querySelector('.pw-text');
        var pw = wrap.dataset.pw;
        if (txt.textContent === pw) {
          txt.textContent = '•••••••';
          txt.classList.remove('pw-visible');
          btn.textContent = '👁';
        } else {
          txt.textContent = pw;
          txt.classList.add('pw-visible');
          btn.textContent = '👁‍🗨';
        }
      });
    });
  }

  $('buscar-usuario').addEventListener('input', renderUsuarios);

  $('btn-copiar-tabla').addEventListener('click', function () {
    if (!USUARIOS.length) { toast('No hay usuarios para copiar'); return; }
    var tab = '\t';
    var lines = ['Email\tContraseña\tTipo\tMódulos\tÚltimo ingreso\tCreado'];
    USUARIOS.forEach(function (u) {
      var pw = u.password_visible || 'Desconocida';
      var tipo = u.tiene_password_generica ? 'Genérica' : 'Propia';
      var mods = (u.modulos || []).join(' | ') || '—';
      var login = u.last_sign_in_at ? fmtFecha(u.last_sign_in_at) : 'Nunca';
      var creado = fmtFecha(u.created_at);
      lines.push([u.email, pw, tipo, mods, login, creado].join(tab));
    });
    navigator.clipboard.writeText(lines.join('\n')).then(function () {
      toast('Tabla copiada — pegá en Sheets con Ctrl+V');
    });
  });

  $('btn-exportar-csv').addEventListener('click', function () {
    if (!USUARIOS.length) { toast('No hay usuarios para exportar'); return; }
    var sep = ',';
    var lines = ['Email,Contraseña,Tipo,Módulos,Último ingreso,Creado'];
    USUARIOS.forEach(function (u) {
      var pw = u.password_visible || 'Desconocida';
      var tipo = u.tiene_password_generica ? 'Genérica' : 'Propia';
      var mods = (u.modulos || []).join(' | ') || '—';
      var login = u.last_sign_in_at ? fmtFecha(u.last_sign_in_at) : 'Nunca';
      var creado = fmtFecha(u.created_at);
      lines.push([u.email, pw, tipo, mods, login, creado].map(function (v) {
        return '"' + String(v).replace(/"/g, '""') + '"';
      }).join(sep));
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'usuarios_admin_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV descargado');
  });
  $('filtro-pw').addEventListener('change', renderUsuarios);
  $('filtro-login').addEventListener('change', renderUsuarios);
  $('filtro-modulo').addEventListener('change', renderUsuarios);

  /* ─── Confirmación de reset ─── */
  var pendingReset = null;

  function confirmarReset(uid, email) {
    pendingReset = uid;
    $('modal-titulo').textContent = 'Resetear contraseña';
    $('modal-msg').textContent = '¿Resetear la contraseña de ' + email + ' a la genérica (Universo2026.)? El usuario va a tener que cambiarla después.';
    $('modal-pw-input').hidden = true;
    $('modal-pw-field').value = '';
    $('modal-confirmar').textContent = 'Confirmar';
    $('modal').hidden = false;
  }

  $('modal-cancelar').addEventListener('click', function () {
    $('modal').hidden = true;
    pendingReset = null;
    pendingCambio = null;
  });

  $('modal-confirmar').addEventListener('click', async function () {
    $('modal-confirmar').disabled = true;

    if (pendingReset) {
      $('modal-confirmar').textContent = 'Reseteando…';
      var res = await sb.rpc('admin_resetear_password', { p_user_id: pendingReset });
      $('modal').hidden = true;
      $('modal-confirmar').disabled = false;
      $('modal-confirmar').textContent = 'Confirmar';
      pendingReset = null;

      if (res.error) {
        toast('Error: ' + res.error.message);
      } else {
        toast('Contraseña reseteada a la genérica');
        await cargarUsuarios();
      }
    } else if (pendingCambio) {
      var newPw = $('modal-pw-field').value;
      if (!newPw || newPw.length < 6) {
        $('modal-confirmar').disabled = false;
        toast('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      $('modal-confirmar').textContent = 'Guardando…';
      var res = await sb.rpc('admin_cambiar_password', { p_user_id: pendingCambio, p_new_password: newPw });
      $('modal').hidden = true;
      $('modal-confirmar').disabled = false;
      $('modal-confirmar').textContent = 'Guardar';
      pendingCambio = null;

      if (res.error) {
        toast('Error: ' + res.error.message);
      } else {
        toast('Contraseña cambiada correctamente');
        await cargarUsuarios();
      }
    }
  });

  /* ─── Cambiar contraseña ─── */
  var pendingCambio = null;

  function abrirCambiarPassword(uid, email) {
    pendingCambio = uid;
    pendingReset = null;
    $('modal-titulo').textContent = 'Cambiar contraseña';
    $('modal-msg').textContent = 'Nueva contraseña para ' + email + ':';
    $('modal-pw-input').hidden = false;
    $('modal-pw-field').value = '';
    $('modal-confirmar').textContent = 'Guardar';
    $('modal').hidden = false;
    setTimeout(function () { $('modal-pw-field').focus(); }, 100);
  }

  /* ─── Tiendas ─── */
  async function cargarTiendas() {
    var res = await sb.from('tiendas').select('numero, local, nombre, formato, region, jefe:jefe_nombre, jefe_mail, domicilio, m2').order('local');
    TIENDAS = res.data || [];
    poblarFiltrosTiendas();
    renderTiendas();
  }

  function poblarFiltrosTiendas() {
    var formatos = {}, regiones = {};
    TIENDAS.forEach(function (t) {
      if (t.formato) formatos[t.formato] = true;
      if (t.region) regiones[t.region] = true;
    });
    $('filtro-formato').innerHTML = '<option value="">Formato: todos</option>' +
      Object.keys(formatos).sort().map(function (f) { return '<option>' + f + '</option>'; }).join('');
    $('filtro-region').innerHTML = '<option value="">Región: todas</option>' +
      Object.keys(regiones).sort().map(function (r) { return '<option>' + r + '</option>'; }).join('');
  }

  function renderTiendas() {
    var q = $('buscar-tienda').value.trim().toLowerCase();
    var fFmt = $('filtro-formato').value;
    var fReg = $('filtro-region').value;
    var lista = TIENDAS.filter(function (t) {
      if (q) {
        var txt = [t.numero, t.local, t.nombre, t.formato, t.region, t.jefe, t.jefe_mail].join(' ').toLowerCase();
        if (txt.indexOf(q) === -1) return false;
      }
      if (fFmt && t.formato !== fFmt) return false;
      if (fReg && t.region !== fReg) return false;
      return true;
    });

    var formatos = {};
    TIENDAS.forEach(function (t) { formatos[t.formato] = (formatos[t.formato] || 0) + 1; });
    $('kpis-tiendas').innerHTML =
      '<div class="kpi"><div class="kpi-label">Total tiendas</div><div class="kpi-value">' + TIENDAS.length + '</div></div>' +
      Object.keys(formatos).sort().map(function (f) {
        return '<div class="kpi"><div class="kpi-label">' + f + '</div><div class="kpi-value">' + formatos[f] + '</div></div>';
      }).join('');

    var html = '';
    lista.forEach(function (t) {
      html += '<tr data-numero="' + t.numero + '">' +
        '<td>' + (t.numero || '') + '</td>' +
        '<td>' + (t.local || '') + '</td>' +
        '<td><span class="chip">' + (t.formato || '') + '</span></td>' +
        '<td>' + (t.region || '') + '</td>' +
        '<td>' + (t.jefe || '') + '</td>' +
        '<td>' + (t.jefe_mail || '') + '</td>' +
        '<td><button class="btn-sm btn-editar-tienda" data-numero="' + t.numero + '">Editar</button></td>' +
        '</tr>';
    });

    $('tabla-tiendas').innerHTML = html || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">Sin resultados</td></tr>';
    $('tabla-tiendas-info').textContent = 'Mostrando ' + lista.length + ' de ' + TIENDAS.length + ' tiendas';

    document.querySelectorAll('.btn-editar-tienda').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var t = TIENDAS.find(function (x) { return String(x.numero) === btn.dataset.numero; });
        if (t) abrirEditarTienda(t);
      });
    });
  }

  $('buscar-tienda').addEventListener('input', renderTiendas);
  $('filtro-formato').addEventListener('change', renderTiendas);
  $('filtro-region').addEventListener('change', renderTiendas);

  /* ─── Modal editar/crear tienda ─── */
  var editandoTienda = null;

  function abrirEditarTienda(t) {
    editandoTienda = t.numero;
    $('modal-tienda-titulo').textContent = 'Editar tienda ' + t.numero;
    $('t-numero').value = t.numero;
    $('t-numero').disabled = true;
    $('t-local').value = t.local || '';
    $('t-nombre').value = t.nombre || '';
    $('t-formato').value = t.formato || 'HIPERMERCADO';
    $('t-region').value = t.region || '';
    $('t-jefe').value = t.jefe || '';
    $('t-jefe-mail').value = t.jefe_mail || '';
    $('t-domicilio').value = t.domicilio || '';
    $('t-m2').value = t.m2 || '';
    $('modal-tienda-eliminar').hidden = false;
    $('modal-tienda-guardar').textContent = 'Guardar';
    $('modal-tienda').hidden = false;
  }

  function abrirNuevaTienda() {
    editandoTienda = null;
    $('modal-tienda-titulo').textContent = 'Nueva tienda';
    $('t-numero').value = '';
    $('t-numero').disabled = false;
    $('t-local').value = '';
    $('t-nombre').value = '';
    $('t-formato').value = 'HIPERMERCADO';
    $('t-region').value = '';
    $('t-jefe').value = '';
    $('t-jefe-mail').value = '';
    $('t-domicilio').value = '';
    $('t-m2').value = '';
    $('modal-tienda-eliminar').hidden = true;
    $('modal-tienda-guardar').textContent = 'Crear';
    $('modal-tienda').hidden = false;
    $('t-numero').focus();
  }

  $('btn-nueva-tienda').addEventListener('click', abrirNuevaTienda);

  $('modal-tienda-cancelar').addEventListener('click', function () {
    $('modal-tienda').hidden = true;
  });

  $('modal-tienda-guardar').addEventListener('click', async function () {
    var num = Number($('t-numero').value);
    if (!num) { toast('El número es obligatorio'); return; }
    var local = $('t-local').value.trim();
    if (!local) { toast('El local es obligatorio'); return; }

    var btn = $('modal-tienda-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    var params = {
      p_numero: num,
      p_local: local,
      p_nombre: $('t-nombre').value.trim(),
      p_formato: $('t-formato').value,
      p_region: $('t-region').value.trim(),
      p_jefe: $('t-jefe').value.trim(),
      p_jefe_mail: $('t-jefe-mail').value.trim().toLowerCase(),
      p_domicilio: $('t-domicilio').value.trim(),
      p_m2: Number($('t-m2').value) || null
    };

    var res;
    if (editandoTienda) {
      res = await sb.rpc('admin_actualizar_tienda', params);
    } else {
      res = await sb.rpc('admin_crear_tienda', params);
    }

    btn.disabled = false;
    btn.textContent = editandoTienda ? 'Guardar' : 'Crear';

    if (res.error) {
      toast('Error: ' + res.error.message);
      return;
    }

    $('modal-tienda').hidden = true;
    toast(editandoTienda ? 'Tienda actualizada' : 'Tienda creada');
    await cargarTiendas();
  });

  $('modal-tienda-eliminar').addEventListener('click', async function () {
    if (!editandoTienda) return;
    if (!confirm('¿Eliminar la tienda ' + editandoTienda + '? Esto puede afectar relevamientos y reclamos asociados.')) return;

    var btn = $('modal-tienda-eliminar');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    var res = await sb.rpc('admin_eliminar_tienda', { p_numero: editandoTienda });
    btn.disabled = false;
    btn.textContent = 'Eliminar';

    if (res.error) {
      toast('Error: ' + res.error.message);
      return;
    }

    $('modal-tienda').hidden = true;
    toast('Tienda eliminada');
    await cargarTiendas();
  });

  /* ─── Tabs ─── */
  document.querySelectorAll('.tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var tab = btn.dataset.tab;
      $('t-usuarios').hidden = tab !== 'usuarios';
      $('t-tiendas').hidden  = tab !== 'tiendas';
      $('t-accesos').hidden  = tab !== 'accesos';
    });
  });

  /* ─── Tema claro/oscuro ─── */
  function temaActual() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  function aplicarTema(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('admin_tema', t); } catch (e) {}
  }
  aplicarTema(temaActual());
  function toggleTema() { aplicarTema(temaActual() === 'dark' ? 'light' : 'dark'); }
  $('btn-tema').addEventListener('click', toggleTema);
  if ($('btn-tema-login')) $('btn-tema-login').addEventListener('click', toggleTema);

  /* ─── Salir ─── */
  $('btn-salir').addEventListener('click', async function () {
    await sb.auth.signOut();
    show('view-login');
  });

  /* ─── Init ─── */
  iniciar();
})();
