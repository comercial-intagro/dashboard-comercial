/*
 * Presupuesto 2027 — acceso al desarrollo externo de objetivos comerciales.
 * ---------------------------------------------------------------------------
 * Reemplaza al editor interno anterior (modal + carga/guardado al sheet).
 * Ahora el botón de la barra izquierda linkea a la app externa de Sistemas:
 *     http://objetivoscomerciales.intagro.com/representante=<HASH>
 * El <HASH> es el de la columna D ("HASH PRESUPUESTO 2027") de la hoja USUARIOS,
 * que el backend resuelve según el usuario logueado y el frontend guarda en USER_HASH.
 * Se abre en una pestaña nueva. El dashboard sigue consumiendo la hoja
 * presupuesto_2027 como antes (eso no se toca); acá solo cambia el acceso.
 */
(function () {
  var BASE_URL = 'http://objetivoscomerciales.intagro.com/representante=';

  function abrirPresu2027() {
    var hash = (typeof USER_HASH !== 'undefined' && USER_HASH) ? String(USER_HASH).trim() : '';
    if (!hash) {
      alert('No encontramos tu acceso al Presupuesto 2027.\n\nVerificá con el administrador que tu usuario tenga cargado el hash en la hoja USUARIOS (columna "HASH PRESUPUESTO 2027").');
      return;
    }
    window.open(BASE_URL + hash, '_blank', 'noopener');
  }
  window.abrirPresu2027 = abrirPresu2027;

  function p27Init() {
    if (document.getElementById('presu27Section')) return;
    var sec = document.createElement('div');
    sec.className = 'tools-section';
    sec.id = 'presu27Section';
    sec.style.marginTop = '18px';
    sec.style.paddingTop = '16px';
    sec.innerHTML =
      '<label class="filter-label">PRESUPUESTO</label>' +
      '<button class="btn-sec" style="background:var(--primary);color:#fff;border-color:var(--primary);font-weight:700;" onclick="abrirPresu2027()">' +
      '<i class="ri-flag-2-fill"></i> Presupuesto 2027</button>';
    var tools = document.getElementById('toolsSection');
    if (tools && tools.parentNode) {
      tools.parentNode.insertBefore(sec, tools);
    } else {
      var f = document.querySelector('.filters') || document.querySelector('.sidebar') || document.body;
      f.appendChild(sec);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', p27Init);
  else p27Init();
})();
