/*
 * Inteligencia Comercial — módulo autocontenido del Dashboard Comercial Intagro.
 * Se carga con una sola línea en index.html:  <script src="inteligencia_comercial.js"></script>
 * Vista GERENCIAL, solo lectura. Lista los clientes "HABILITADO TARNET" (prospectos del
 * departamento de inteligencia comercial, tomados del maestro), con su volumen por ejercicio
 * 2022..2027, el presupuesto 2027 (lo que cargó el repre dueño, solo lectura) y el % de
 * cumplimiento del ejercicio 2027.
 *
 * Reusa globals del dashboard: DB, MAESTRO_BY_CUIT, USER_ROL, BACKEND_URL, __googleIdToken,
 * toggleModal, normalize.
 */
(function(){
  "use strict";

  var IC_CSS = `#icTable { width:100%; border-collapse:separate; border-spacing:0; font-family:'Inter',system-ui,-apple-system,sans-serif; }
        #icTable th, #icTable td { padding:8px 10px; font-size:0.72rem; vertical-align:middle; }
        #icTable thead th { background:#f8fafc; color:#475569; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; font-size:0.61rem; border-bottom:1px solid #e2e8f0; position:sticky; top:0; z-index:2; cursor:pointer; user-select:none; }
        #icTable thead th:hover { background:#eef2f6; color:#0f172a; }
        .ic-sort { font-size:0.72rem; color:var(--primary); margin-left:2px; }
        #icTable tbody td { border-bottom:1px solid #f1f5f9; color:#1e293b; }
        #icTable tbody tr:nth-child(even) { background:#fafbfc; }
        #icTable tbody tr:hover { background:#f0fdf4; }
        #icTable td.num, #icTable th.num { text-align:right; font-variant-numeric:tabular-nums; }
        #icTable td.col-name, #icTable th.col-name { text-align:left; font-weight:600; max-width:230px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #icTable td.col-com, #icTable th.col-com { text-align:left; color:#475569; font-weight:600; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #icTable th.e27, #icTable td.e27 { background:#f0fdf4; }
        #icTable thead th.e27 { color:var(--primary); }
        #icTable th.presu, #icTable td.presu { background:#eef5ff; }
        #icTable thead th.presu { color:#1d4ed8; }
        #icTable tfoot td { font-weight:800; border-top:2px solid #e2e8f0; background:#f8fafc; color:#0f172a; text-align:right; font-variant-numeric:tabular-nums; position:sticky; bottom:0; }
        #icTable tfoot td.col-name { text-align:left; }
        #icTable tfoot td.e27 { background:#dcfce7; color:var(--primary); }
        #icTable tfoot td.presu { background:#dbe8fe; color:#0f2a6b; }
        .ic-cumpl { display:inline-block; min-width:44px; text-align:right; font-weight:800; }
        #inteligenciaModal .ic-head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 2px 10px; flex-wrap:wrap; }
        #inteligenciaModal .ic-counters { display:flex; gap:10px; }
        .ic-counter { background:#f8fafc; border:1px solid #eef1f4; border-radius:10px; padding:8px 14px; text-align:center; min-width:120px; }
        .ic-counter-n { font-size:1.4rem; font-weight:900; line-height:1; color:var(--primary); }
        .ic-counter-l { font-size:0.62rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
        .ic-counter-click { cursor:pointer; transition:border-color 0.15s, background 0.15s; }
        .ic-counter-click:hover { border-color:var(--primary); }
        .ic-counter-active { background:var(--primary); border-color:var(--primary); }
        .ic-counter-active .ic-counter-n, .ic-counter-active .ic-counter-l { color:#fff; }
        .ic-search-wrap { position:relative; }
        .ic-search-wrap i { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem; }
        #icSearch { padding:7px 12px 7px 28px; border:1px solid #cbd5e1; border-radius:50px; font-size:0.74rem; font-family:inherit; min-width:220px; }
        #icSearch:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 2px rgba(16,185,129,0.18); }`;

  var IC_MODAL = `<div id="inteligenciaModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-header-top">
                    <div>
                        <h2 style="color:var(--primary);font-weight:800;font-size:1.2rem;">Inteligencia Comercial</h2>
                        <div style="font-size:0.7rem;color:#64748b;font-weight:600;margin-top:2px;">Clientes prospecto (Habilitado Tarnet) — volumen por ejercicio, presupuesto 2027 y cumplimiento</div>
                    </div>
                    <div class="close-btn" onclick="toggleModal('inteligenciaModal',false)"><i class="ri-close-line"></i></div>
                </div>
            </div>
            <div class="ic-head">
                <div class="ic-counters" id="icCounters"></div>
                <div class="ic-search-wrap">
                    <i class="ri-search-line"></i>
                    <input type="text" id="icSearch" placeholder="Buscar cliente o comercial..." oninput="icFilter()">
                </div>
            </div>
            <div class="modal-table-container">
                <table class="budget-table" id="icTable">
                    <thead><tr>
                        <th class="col-name" onclick="icSortBy('nombre')">Cliente prospecto <span class="ic-sort" data-c="nombre"></span></th>
                        <th class="col-com" onclick="icSortBy('comercial')">Comercial <span class="ic-sort" data-c="comercial"></span></th>
                        <th class="num" onclick="icSortBy('v22')">2022 <span class="ic-sort" data-c="v22"></span></th>
                        <th class="num" onclick="icSortBy('v23')">2023 <span class="ic-sort" data-c="v23"></span></th>
                        <th class="num" onclick="icSortBy('v24')">2024 <span class="ic-sort" data-c="v24"></span></th>
                        <th class="num" onclick="icSortBy('v25')">2025 <span class="ic-sort" data-c="v25"></span></th>
                        <th class="num" onclick="icSortBy('v26')">2026 <span class="ic-sort" data-c="v26"></span></th>
                        <th class="num e27" onclick="icSortBy('v27')">Ej. 2027 <span class="ic-sort" data-c="v27"></span></th>
                        <th class="num presu" onclick="icSortBy('presup')">Presup. 2027 <span class="ic-sort" data-c="presup"></span></th>
                        <th class="num" onclick="icSortBy('cumpl')">% Cumpl. <span class="ic-sort" data-c="cumpl"></span></th>
                    </tr></thead>
                    <tbody id="icBody"></tbody>
                    <tfoot id="icFoot"></tfoot>
                </table>
            </div>
        </div>
    </div>`;

  function icEsGerencial(){ return typeof USER_ROL!=='undefined' && USER_ROL==='GERENCIAL'; }
  function icFmt(n){ return n>0?Math.round(n).toLocaleString('de-DE'):'-'; }

  // --- JSONP al Apps Script (mismo patrón que el presupuesto) ---
  function icJsonp(params){
      return new Promise(function(resolve,reject){
          if(typeof __googleIdToken==='undefined' || !__googleIdToken){ reject(new Error('sin token')); return; }
          var cb='iccb_'+Math.random().toString(36).slice(2);
          var s=document.createElement('script');
          var tmr=setTimeout(function(){cleanup();reject(new Error('timeout'));},15000);
          function cleanup(){clearTimeout(tmr);try{delete window[cb];}catch(e){}if(s&&s.parentNode)s.parentNode.removeChild(s);}
          window[cb]=function(resp){cleanup();resolve(resp);};
          var url=BACKEND_URL+'?callback='+cb+'&id_token='+encodeURIComponent(__googleIdToken)+'&t='+Date.now();
          Object.keys(params).forEach(function(k){url+='&'+k+'='+encodeURIComponent(params[k]);});
          s.src=url; s.onerror=function(){cleanup();reject(new Error('red'));};
          document.body.appendChild(s);
      });
  }

  // Presupuesto 2027 de TODOS los repres -> mapa cuit -> tn objetivo.
  function icLoadPresupuestos(){
      return icJsonp({action:'presu2027_load', repre:'__ALL__'}).then(function(resp){
          var m={};
          if(resp && resp.ok && resp.rows){
              resp.rows.forEach(function(r){
                  var k=String(r.key||''); if(k.indexOf('CUIT_')!==0) return;
                  var cuit=k.slice(5).replace(/\D/g,''); if(!cuit) return;
                  var tn=parseFloat(r.tn); if(isNaN(tn)) return;
                  m[cuit]=(m[cuit]||0)+tn;   // por si el mismo CUIT tuviera más de una fila
              });
          }
          return m;
      }).catch(function(){ return {}; });
  }

  // Volumen por ejercicio TOTAL del cliente (todos los comerciales), desde las operaciones.
  function icVolMap(){
      var m={};
      DB.forEach(function(d){
          var cuit=String(d.cuitLimpio||'').replace(/\D/g,''); if(!cuit) return;
          if(!m[cuit]) m[cuit]={'2022':0,'2023':0,'2024':0,'2025':0,'2026':0,'2027':0};
          if(m[cuit][d.e]!==undefined) m[cuit][d.e]+=d.vol;
      });
      return m;
  }

  function icBuildRows(presupMap){
      var vol=icVolMap();
      var rows=[];
      if(typeof MAESTRO_BY_CUIT==='undefined') return rows;
      Object.keys(MAESTRO_BY_CUIT).forEach(function(cuit){
          var ent=MAESTRO_BY_CUIT[cuit];
          if(!ent || !ent.esProsp) return;                 // solo HABILITADO TARNET
          var v=vol[cuit]||{'2022':0,'2023':0,'2024':0,'2025':0,'2026':0,'2027':0};
          var presup=presupMap[cuit]||0;
          var real27=v['2027']||0;
          var cumpl=(presup>0)?(real27/presup*100):null;
          rows.push({cuit:cuit, nombre:ent.nombre||cuit, comercial:ent.comercial||'',
              v22:v['2022'],v23:v['2023'],v24:v['2024'],v25:v['2025'],v26:v['2026'],
              v27:real27, presup:presup, cumpl:cumpl});
      });
      rows.sort(function(a,b){ return (b.v26-a.v26) || (b.v25-a.v25); });
      return rows;
  }

  function icCumplHtml(c){
      if(c==null) return '<span class="ic-cumpl" style="color:#cbd5e1;">—</span>';
      var col = c>=100?'#16a34a':(c>=60?'#d97706':'#dc2626');
      return '<span class="ic-cumpl" style="color:'+col+';">'+c.toFixed(0)+'%</span>';
  }

  var _icRows=[];            // cache de filas (para filtro y orden)
  var icSortCol='v26';       // columna de orden actual
  var icSortAsc=false;       // dirección (false = desc)
  var icGroupFilter=null;    // null | 'clientes' (con volumen) | 'prospectos' (sin volumen)

  function icRowHtml(r){
      return '<tr data-f="'+(r.nombre+' '+r.comercial).toUpperCase().replace(/"/g,'')+'" data-g="'+(r.tieneVol?'cli':'pro')+'">'
          +'<td class="col-name" title="'+r.nombre+'">'+r.nombre+'</td>'
          +'<td class="col-com" title="'+r.comercial+'">'+r.comercial+'</td>'
          +'<td class="num">'+icFmt(r.v22)+'</td>'
          +'<td class="num">'+icFmt(r.v23)+'</td>'
          +'<td class="num">'+icFmt(r.v24)+'</td>'
          +'<td class="num">'+icFmt(r.v25)+'</td>'
          +'<td class="num">'+icFmt(r.v26)+'</td>'
          +'<td class="num e27">'+icFmt(r.v27)+'</td>'
          +'<td class="num presu">'+icFmt(r.presup)+'</td>'
          +'<td class="num">'+icCumplHtml(r.cumpl)+'</td>'
          +'</tr>';
  }

  function icPaintBody(){
      var body=document.getElementById('icBody'); if(!body) return;
      if(_icRows.length===0){ body.innerHTML='<tr><td colspan="10" style="text-align:center;padding:18px;color:#94a3b8;font-weight:600;">No hay clientes Habilitado Tarnet.</td></tr>'; return; }
      var col=icSortCol, asc=icSortAsc;
      var esTexto=(col==='nombre'||col==='comercial');
      var rows=_icRows.slice().sort(function(a,b){
          var va=a[col], vb=b[col];
          if(esTexto){ va=(va||'').toUpperCase(); vb=(vb||'').toUpperCase(); if(va<vb)return asc?-1:1; if(va>vb)return asc?1:-1; return 0; }
          va=(va==null?-1:va); vb=(vb==null?-1:vb);   // % Cumpl. null -> al fondo
          return asc?(va-vb):(vb-va);
      });
      body.innerHTML=rows.map(icRowHtml).join('');
      // indicador de orden en el encabezado
      var spans=document.querySelectorAll('#icTable thead .ic-sort');
      for(var i=0;i<spans.length;i++){ var c=spans[i].getAttribute('data-c'); spans[i].innerHTML=(c===col)?(asc?'▲':'▼'):''; }
      icFilter();
  }

  function icSortBy(col){
      if(icSortCol===col){ icSortAsc=!icSortAsc; }
      else { icSortCol=col; icSortAsc=(col==='nombre'||col==='comercial'); }  // texto asc, números desc
      icPaintBody();
  }

  function icRender(){
      var body=document.getElementById('icBody');
      var foot=document.getElementById('icFoot');
      body.innerHTML='<tr><td colspan="10" style="text-align:center;padding:18px;color:#94a3b8;font-weight:600;">Cargando…</td></tr>';
      foot.innerHTML='';
      icGroupFilter=null;   // cada apertura arranca sin filtro de grupo
      icLoadPresupuestos().then(function(presupMap){
          _icRows=icBuildRows(presupMap);
          var tot={v22:0,v23:0,v24:0,v25:0,v26:0,v27:0,presup:0};
          var nCli=0, nPro=0;
          _icRows.forEach(function(r){
              tot.v22+=r.v22;tot.v23+=r.v23;tot.v24+=r.v24;tot.v25+=r.v25;tot.v26+=r.v26;tot.v27+=r.v27;tot.presup+=r.presup;
              // "cliente" = cuenta operativa (hizo volumen alguna vez); "prospecto" = sin volumen aún
              r.tieneVol = (r.v22+r.v23+r.v24+r.v25+r.v26+r.v27) > 0;
              if(r.tieneVol) nCli++; else nPro++;
          });
          var cumplTot=(tot.presup>0)?(tot.v27/tot.presup*100):null;
          foot.innerHTML='<tr><td class="col-name">TOTAL — '+_icRows.length+' clientes</td><td class="col-com"></td>'
              +'<td class="num">'+icFmt(tot.v22)+'</td><td class="num">'+icFmt(tot.v23)+'</td><td class="num">'+icFmt(tot.v24)+'</td>'
              +'<td class="num">'+icFmt(tot.v25)+'</td><td class="num">'+icFmt(tot.v26)+'</td>'
              +'<td class="num e27">'+icFmt(tot.v27)+'</td><td class="num presu">'+icFmt(tot.presup)+'</td>'
              +'<td class="num">'+icCumplHtml(cumplTot)+'</td></tr>';
          var cnt=document.getElementById('icCounters');
          if(cnt) cnt.innerHTML=
                '<div class="ic-counter ic-counter-click" id="icBoxCli" onclick="icSetGroup(\'clientes\')" title="Cuentas operativas (hicieron volumen). Clic para filtrar.">'
                  +'<div class="ic-counter-n">'+nCli+'</div><div class="ic-counter-l">Clientes (con volumen)</div></div>'
              +'<div class="ic-counter ic-counter-click" id="icBoxPro" onclick="icSetGroup(\'prospectos\')" title="Prospectos sin volumen aún. Clic para filtrar.">'
                  +'<div class="ic-counter-n">'+nPro+'</div><div class="ic-counter-l">Prospectos (sin volumen)</div></div>'
              +'<div class="ic-counter"><div class="ic-counter-n">'+icFmt(tot.presup)+'</div><div class="ic-counter-l">Presupuesto 2027 (tn)</div></div>';
          icPaintBody();
      });
  }

  function icFilter(){
      var q=(document.getElementById('icSearch').value||'').toUpperCase().trim();
      var trs=document.querySelectorAll('#icBody tr[data-f]');
      for(var i=0;i<trs.length;i++){
          var f=trs[i].getAttribute('data-f')||'';
          var g=trs[i].getAttribute('data-g')||'';
          var okQ = (!q || f.indexOf(q)>=0);
          var okG = (!icGroupFilter) || (icGroupFilter==='clientes' && g==='cli') || (icGroupFilter==='prospectos' && g==='pro');
          trs[i].style.display = (okQ && okG) ? '' : 'none';
      }
  }

  // Filtro por grupo desde los recuadros. Vuelve a clickear el activo = limpia el filtro.
  function icSetGroup(g){
      icGroupFilter = (icGroupFilter===g) ? null : g;
      var cli=document.getElementById('icBoxCli'), pro=document.getElementById('icBoxPro');
      if(cli) cli.classList.toggle('ic-counter-active', icGroupFilter==='clientes');
      if(pro) pro.classList.toggle('ic-counter-active', icGroupFilter==='prospectos');
      icFilter();
  }

  function openInteligencia(){
      if(!icEsGerencial()) return;   // seguridad: solo gerencial
      toggleModal('inteligenciaModal',true);
      icRender();
  }

  window.openInteligencia = openInteligencia;
  window.icFilter = icFilter;
  window.icSortBy = icSortBy;
  window.icSetGroup = icSetGroup;

  function icInit(){
      if(document.getElementById('inteligenciaModal')) return;
      var st=document.createElement('style'); st.textContent=IC_CSS; document.head.appendChild(st);
      var tmp=document.createElement('div'); tmp.innerHTML=IC_MODAL.trim();
      if(tmp.firstElementChild) document.body.appendChild(tmp.firstElementChild);
      // Botón dentro de HERRAMIENTAS (toolsSection): esa sección se oculta sola para los
      // repres (applyRolePermissions), así que el botón queda solo para gerencia.
      var tools=document.getElementById('toolsSection');
      if(tools && !document.getElementById('icBtn')){
          var b=document.createElement('button'); b.className='btn-sec'; b.id='icBtn';
          b.innerHTML='<i class="ri-search-eye-line"></i> Inteligencia Comercial';
          b.onclick=openInteligencia;
          tools.appendChild(b);
      }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', icInit);
  else icInit();
})();
