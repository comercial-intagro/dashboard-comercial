/*
 * Presupuesto 2027 — módulo autocontenido del Dashboard Comercial Intagro.
 * Se carga con una sola línea en index.html:  <script src="presupuesto2027.js"></script>
 * Al cargar inyecta su propio botón, su ventana (modal) y sus estilos, y usa
 * el DB / login / budgetData / rol que ya tiene el dashboard en memoria.
 *
 * Etapa 3: para GERENCIAL dos solapas — "Avance" (semáforo por repre) y "Por repre"
 * (la grilla). Para REPRE/COMERCIAL: su grilla + botón "Confirmar presupuesto".
 * El estado "confirmado" se guarda reusando la misma pestaña (fila con client_key
 * especial "__CONFIRMADO__"), sin tocar el Apps Script.
 */
(function(){
  "use strict";

  var P27_CSS = `#presu27Table, #p27AvanceTable { width:100%; border-collapse:separate; border-spacing:0; font-family:'Inter',system-ui,-apple-system,sans-serif; }
        #presu27Table th, #presu27Table td, #p27AvanceTable th, #p27AvanceTable td { padding:9px 10px; font-size:0.72rem; vertical-align:middle; }
        #presu27Table thead th, #p27AvanceTable thead th { background:#f8fafc; color:#475569; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; font-size:0.62rem; border-bottom:1px solid #e2e8f0; position:sticky; top:0; z-index:2; }
        #presu27Table thead tr:nth-child(2) th { top:30px; }
        #presu27Table tbody td, #p27AvanceTable tbody td { border-bottom:1px solid #f1f5f9; color:#1e293b; }
        #presu27Table tbody tr:nth-child(even), #p27AvanceTable tbody tr:nth-child(even) { background:#fafbfc; }
        #presu27Table tbody tr:hover, #p27AvanceTable tbody tr:hover { background:#f0fdf4; }
        #presu27Table td.num, #presu27Table th.num, #p27AvanceTable td.num, #p27AvanceTable th.num { text-align:right; font-variant-numeric:tabular-nums; }
        #presu27Table td.col-name, #p27AvanceTable td.col-name { text-align:left; font-weight:600; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #p27AvanceTable th.col-name { text-align:left; }
        #presu27Table .col-2027, #presu27Table td.c27 { background:#f0fdf4; }
        #presu27Table thead .col-2027 { color:var(--primary); }
        /* Bandas por ejercicio (de más viejo a más nuevo) */
        #presu27Table th.y24, #presu27Table td.y24 { background:#fafafa; }
        #presu27Table th.y25, #presu27Table td.y25 { background:#f1f3f5; }
        #presu27Table th.e26, #presu27Table td.e26 { background:#eef5ff; }
        #presu27Table th.e26grp { background:#eef5ff; color:#1d4ed8; }
        #presu27Table th.e26tot, #presu27Table td.e26tot { background:#dbe8fe; font-weight:800; color:#0f2a6b; border-left:2px solid #bfd3fb; }
        #presu27Table thead th.e26tot { color:#1d4ed8; }
        /* Columna indicador % 27 vs 26 */
        #presu27Table td.vsind, #presu27Table th.vsind { text-align:right; font-variant-numeric:tabular-nums; }
        #presu27Table tfoot td { font-weight:800; border-top:2px solid #e2e8f0; background:#f8fafc; color:#0f172a; text-align:right; font-variant-numeric:tabular-nums; position:sticky; bottom:0; }
        #presu27Table tfoot td.col-name { text-align:left; }
        #presu27Table tfoot td.c27 { background:#dcfce7; color:var(--primary); }
        #presu27Table tfoot td.e26tot { background:#cfe0fd; color:#0f2a6b; }
        .presu27-input { width:104px; text-align:right; border:1px solid #cbd5e1; border-radius:6px; padding:5px 7px; font-size:0.72rem; font-family:inherit; font-weight:700; color:#0f172a; background:#fff; }
        .presu27-input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 2px rgba(16,185,129,0.18); }
        .presu27-input:disabled { background:#f1f5f9; color:#64748b; }
        .p27-stat { display:inline-block; margin-left:6px; width:12px; font-size:0.72rem; font-weight:800; vertical-align:middle; }
        .p27-stat.saving { color:#94a3b8; } .p27-stat.ok { color:var(--primary); } .p27-stat.err { color:#dc2626; cursor:help; }
        #presu2027Modal .budget-summary-container { margin-left:0; flex:1 1 auto; }
        #presu2027Modal .budget-kpi-card { flex:1 1 0; min-width:150px; }
        /* Solapas */
        #p27Tabs { display:flex; gap:6px; margin-top:10px; }
        .p27-tab { padding:7px 16px; border:none; border-radius:8px 8px 0 0; font-size:0.74rem; font-weight:800; cursor:pointer; background:#eef1f4; color:#64748b; }
        .p27-tab.active { background:var(--primary); color:#fff; }
        /* Panes */
        #p27PaneAvance, #p27PaneRepre { flex:1; min-height:0; flex-direction:column; }
        .p27-repre-head { display:flex; align-items:stretch; gap:14px; flex-wrap:wrap; padding:0 2px 10px; }
        #presu2027Modal .history-select-wrapper { flex:0 0 auto; display:flex; align-items:center; }
        #presu2027Modal .history-select-wrapper .modal-select-modern { height:100%; }
        /* Contadores del avance */
        .p27-counters { display:flex; gap:10px; padding:4px 2px 12px; }
        .p27-counter { flex:1; background:#f8fafc; border:1px solid #eef1f4; border-radius:10px; padding:10px 14px; text-align:center; }
        .p27-counter-n { font-size:1.6rem; font-weight:900; line-height:1; }
        .p27-counter-l { font-size:0.66rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
        .p27-chip { display:inline-block; padding:3px 9px; border-radius:20px; font-size:0.66rem; font-weight:800; white-space:nowrap; }
        .p27-av-row { cursor:pointer; }
        /* Barra de confirmación (repre) */
        .p27-confirm-bar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-top:1px solid #eef1f4; background:#fafbfc; }
        .p27-confirm-bar button { border:none; border-radius:8px; padding:9px 18px; font-size:0.78rem; font-weight:800; cursor:pointer; }
        .p27-btn-confirmar { background:var(--primary); color:#fff; }
        .p27-btn-confirmar:hover { filter:brightness(1.05); }
        .p27-btn-confirmar:disabled { background:#94a3b8; cursor:default; }
        .p27-btn-reabrir { background:#fff; color:#64748b; border:1px solid #cbd5e1 !important; }`;

  var P27_MODAL = `<div id="presu2027Modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-header-top">
                    <div>
                        <h2 style="color:var(--primary);font-weight:800;font-size:1.2rem;">Presupuesto 2027</h2>
                        <div style="font-size:0.7rem;color:#64748b;font-weight:600;margin-top:2px;">Objetivo de toneladas por cliente para el ejercicio comercial 2027</div>
                    </div>
                    <div class="close-btn" onclick="toggleModal('presu2027Modal',false)"><i class="ri-close-line"></i></div>
                </div>
                <div id="p27Tabs" style="display:none;">
                    <button class="p27-tab active" data-tab="avance" onclick="p27SwitchTab('avance')">📊 Avance</button>
                    <button class="p27-tab" data-tab="repre" onclick="p27SwitchTab('repre')">👤 Por repre</button>
                </div>
            </div>

            <div id="p27PaneAvance" style="display:none;">
                <div id="p27AvanceCounters" class="p27-counters"></div>
                <div class="modal-table-container">
                    <table class="budget-table" id="p27AvanceTable">
                        <thead><tr>
                            <th class="col-name">Repre / Comercial</th>
                            <th>Estado</th>
                            <th class="num">Clientes</th>
                            <th class="num">Cobertura</th>
                            <th class="num">Presup. 2027</th>
                            <th class="num">Crec. 27/26</th>
                        </tr></thead>
                        <tbody id="p27AvanceBody"></tbody>
                    </table>
                </div>
            </div>

            <div id="p27PaneRepre">
                <div class="p27-repre-head">
                    <div class="history-select-wrapper" style="min-width:240px;">
                        <i class="ri-user-search-line"></i>
                        <select id="presu27Rep" class="modal-select-modern" onchange="renderPresu2027()"></select>
                    </div>
                    <div class="budget-summary-container">
                        <div class="budget-kpi-card" style="border-left-color:var(--primary);background:linear-gradient(180deg,#f0fdf4 0%,#ffffff 90%);">
                            <div class="budget-kpi-title" style="color:var(--primary);">🎯 Presupuesto 2027</div>
                            <div class="budget-kpi-val" id="p27Total" style="color:var(--primary);">0 Tn</div>
                            <div class="budget-kpi-sub" id="p27Count">0 clientes</div>
                        </div>
                        <div class="budget-kpi-card" style="border-left-color:#3b82f6;">
                            <div class="budget-kpi-title">📦 Ejercicio 2026</div>
                            <div class="budget-kpi-val" id="p27Real26">0 Tn</div>
                            <div class="budget-kpi-sub" id="p27Cumpl">Presup 2026: 0 (0%)</div>
                        </div>
                        <div class="budget-kpi-card" id="p27GrowthCard" style="border-left-color:#8b5cf6;">
                            <div class="budget-kpi-title">📈 Crecimiento 27 vs 26</div>
                            <div class="budget-kpi-val" id="p27Growth">—</div>
                            <div class="budget-kpi-sub" id="p27GrowthSub">Presup 2027 vs Real 2026</div>
                        </div>
                    </div>
                </div>
                <div id="p27DeadlineBar" style="display:none;padding:2px 2px 10px;font-size:0.72rem;font-weight:600;"></div>
                <div class="modal-table-container">
                    <table class="budget-table" id="presu27Table">
                        <thead>
                            <tr>
                                <th rowspan="2" class="col-name">Cliente</th>
                                <th rowspan="2" class="num y24">2024</th>
                                <th rowspan="2" class="num y25">2025</th>
                                <th colspan="5" class="e26grp" style="text-align:center;">Ejercicio 2026 (tn)</th>
                                <th rowspan="2" class="col-2027 num">Presupuesto 2027</th>
                                <th rowspan="2" class="vsind" title="Presupuesto 2027 vs Total 2026">vs 2026</th>
                            </tr>
                            <tr><th class="num e26">Soja</th><th class="num e26">Maíz</th><th class="num e26">Trigo</th><th class="num e26">Otros</th><th class="num e26tot">Total</th></tr>
                        </thead>
                        <tbody id="presu27Body"></tbody>
                        <tfoot id="presu27Foot"></tfoot>
                    </table>
                </div>
                <div id="p27ConfirmBar" class="p27-confirm-bar" style="display:none;">
                    <span id="p27ConfirmStatus"></span>
                    <button id="p27ConfirmBtn" class="p27-btn-confirmar" onclick="p27Confirmar()">Confirmar presupuesto</button>
                </div>
            </div>
        </div>
    </div>`;

  // ============================================================
  var presu27Draft = {};        // {repre: {clientKey: tn}}
  var presu27Confirmado = {};   // {repre: bool}
  var p27LockDate = '';         // fecha de cierre "YYYY-MM-DD" (la define el backend)
  var p27Locked = false;        // true si ya pasó la fecha de cierre (hora Argentina, según backend)

  function p27FmtFecha(iso){ if(!iso)return''; var p=String(iso).split('-'); return (p.length===3)?(p[2]+'/'+p[1]+'/'+p[0]):iso; }
  function p27UpdateDeadline(){
      var el=document.getElementById('p27DeadlineBar'); if(!el)return;
      if(!p27LockDate){ el.style.display='none'; return; }
      el.style.display='block';
      if(p27Locked) el.innerHTML='<span style="color:#b91c1c;font-weight:800;">🔒 Carga cerrada el '+p27FmtFecha(p27LockDate)+' — sólo lectura</span>';
      else el.innerHTML='<span style="color:#64748b;">📅 Cierre de carga: <b style="color:#0f172a;">'+p27FmtFecha(p27LockDate)+'</b> — podés editar hasta ese día inclusive.</span>';
  }
  function p27ApplyLockUI(){
      if(p27Locked && !esGerencial()){
          var ins=document.querySelectorAll('.presu27-input');
          for(var i=0;i<ins.length;i++) ins[i].disabled=true;
      }
      p27UpdateDeadline();
  }

  function esGerencial(){ return USER_ROL === 'GERENCIAL'; }
  function listaRepres(){ return budgetData.filter(function(b){return !b.reserva;}).map(function(b){return b.r;}).sort(function(a,b){return a.localeCompare(b,'es');}); }

  // --- Repres con cartera acotada: sólo computan ciertos CUIT (el resto a su nombre se ignora) ---
  var P27_CUIT_UNICOS = [
      { match:'TITTAFERRANTE', cuits:['30646328450'] }   // Andrés Tittaferrante -> sólo Syngenta Agro SA
  ];
  function p27CuitDigits(s){ return String(s||'').replace(/\D/g,''); }
  function p27CuitPermitidos(repre){
      var n = normalize(repre);
      for(var i=0;i<P27_CUIT_UNICOS.length;i++){ if(n.indexOf(P27_CUIT_UNICOS[i].match)>=0) return P27_CUIT_UNICOS[i].cuits; }
      return null; // null = sin restricción (toma todos los clientes)
  }
  function p27ClienteOK(repre,d){
      var allow=p27CuitPermitidos(repre); if(!allow) return true;
      return allow.indexOf(p27CuitDigits(d.cuitLimpio))>=0;
  }
  function p27KeyOK(repre,key){
      var allow=p27CuitPermitidos(repre); if(!allow) return true;
      var k=String(key); if(k.indexOf('CUIT_')!==0) return false;
      return allow.indexOf(p27CuitDigits(k.slice(5)))>=0;
  }

  // --- Dueño actual de cada cliente = comercial de su operación MÁS RECIENTE ---
  // Un cliente que rotó de comercial se presupuesta solo en la cartera del dueño actual;
  // en las demás carteras aparece visible pero bloqueado (no suma).
  var _p27Owner=null;
  function p27OwnerMap(){
      if(_p27Owner) return _p27Owner;
      var m={};
      DB.forEach(function(d){
          if(!(d.v||d.cuitLimpio))return;
          var key=d.cuitLimpio?'CUIT_'+d.cuitLimpio:'NAME_'+d.v;
          var ts=(d.dObj&&d.dObj.getTime)?d.dObj.getTime():0;
          var cur=m[key];
          if(!cur || ts>cur.ts){ m[key]={ts:ts, owner:normalize(d.r), ownerRaw:d.r}; }
      });
      _p27Owner=m; return m;
  }
  function p27EsDueno(repre,key){ var o=p27OwnerMap()[key]; return !o || o.owner===normalize(repre); }
  function p27DuenoNombre(key){ var o=p27OwnerMap()[key]; return o?o.ownerRaw:''; }

  function buildPresu2027Rows(repre){
      var cmap = {};
      var repN = normalize(repre);
      DB.forEach(function(d){
          if(normalize(d.r) !== repN) return;   // comparar normalizado (ej. "AVENDAÑO" vs "AVENDANO")
          if(!p27ClienteOK(repre,d)) return;
          if(!(d.v || d.cuitLimpio)) return;
          var key = d.cuitLimpio ? 'CUIT_'+d.cuitLimpio : 'NAME_'+d.v;
          if(!cmap[key]) cmap[key]={key:key,cuit:d.cuitLimpio||'',name:(d.v||key.replace(/^NAME_/,'')),y24:0,y25:0,s:0,m:0,t:0,o:0,latest:0};
          var c=cmap[key];
          if(d.v && d.dObj){var ts=d.dObj.getTime(); if(ts>c.latest){c.latest=ts;c.name=d.v;}}
          if(d.e==='2024') c.y24+=d.vol;
          else if(d.e==='2025') c.y25+=d.vol;
          else if(d.e==='2026'){ if(d.cat==='SOJA')c.s+=d.vol; else if(d.cat==='MAIZ')c.m+=d.vol; else if(d.cat==='TRIGO')c.t+=d.vol; else c.o+=d.vol; }
      });
      var rows = Object.keys(cmap).map(function(k){
          var c=cmap[k]; c.tot26=c.s+c.m+c.t+c.o;
          c.owned=p27EsDueno(repre,c.key);           // ¿este comercial es el dueño actual?
          c.ownerRaw=c.owned?'':p27DuenoNombre(c.key);
          return c;
      }).filter(function(c){return (c.y24+c.y25+c.tot26)>0;});
      // Dueños primero (por 2026 desc); los bloqueados (rotados) al final
      rows.sort(function(a,b){ if(a.owned!==b.owned) return a.owned?-1:1; return b.tot26-a.tot26; });
      return rows;
  }

  function p27fmt(n){return n>0?Math.round(n).toLocaleString('de-DE'):'-';}
  function p27sumDraft(repre){var d=presu27Draft[repre]||{};var s=0;Object.keys(d).forEach(function(k){var v=parseFloat(d[k]);if(!isNaN(v))s+=v;});return s;}

  // Entrada con punto de miles: el input es texto; el valor real se guarda limpio.
  function p27ParseInput(str){ var dg=String(str==null?'':str).replace(/\D/g,''); return dg===''?'':parseInt(dg,10); }
  function p27InputDisplay(n){ var v=parseFloat(n); return (isNaN(v)||v==='')?'':Math.round(v).toLocaleString('de-DE'); }
  function p27FmtMiles(el){
      var before=el.value.slice(0, el.selectionStart!=null?el.selectionStart:el.value.length).replace(/\D/g,'').length;
      var dg=el.value.replace(/\D/g,'').replace(/^0+(?=\d)/,'');
      var formatted=dg?parseInt(dg,10).toLocaleString('de-DE'):'';
      el.value=formatted;
      var pos=0,seen=0; while(pos<formatted.length && seen<before){ if(/\d/.test(formatted.charAt(pos)))seen++; pos++; }
      try{ el.setSelectionRange(pos,pos); }catch(e){}
  }
  // Indicador % del presupuesto 2027 vs el Total del ejercicio 2026 (por cliente).
  function p27Indicador(val,tot26){
      if(!(val>0) || !(tot26>0)) return '<span style="color:#cbd5e1;">—</span>';
      var g=(val/tot26-1)*100;
      var col=g>1?'#16a34a':(g<-1?'#dc2626':'#64748b');
      return '<span style="color:'+col+';font-weight:700;">'+(g>=0?'+':'')+g.toFixed(0)+'%</span>';
  }

  function openPresu2027(){
      _p27Owner=null;   // recalcular dueños por si el dashboard refrescó el DB
      var sel=document.getElementById('presu27Rep');
      var ger=esGerencial();
      var repres = ger ? listaRepres() : (USER_REPRESENTANTE ? [USER_REPRESENTANTE] : []);
      sel.disabled = !ger;
      sel.innerHTML = repres.map(function(r){return '<option value="'+r+'">'+r+'</option>';}).join('');
      if(!ger && USER_REPRESENTANTE) sel.value=USER_REPRESENTANTE;
      else if(ger && repres.length) sel.value=repres[0];
      document.getElementById('p27Tabs').style.display = ger ? 'flex' : 'none';
      if(ger){
          p27SwitchTab('avance');
      } else {
          document.getElementById('p27PaneAvance').style.display='none';
          document.getElementById('p27PaneRepre').style.display='flex';
          renderPresu2027();
      }
      toggleModal('presu2027Modal',true);
  }

  function p27SwitchTab(tab){
      var tabs=document.getElementById('p27Tabs').children;
      for(var i=0;i<tabs.length;i++){ tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab')===tab); }
      document.getElementById('p27PaneAvance').style.display = (tab==='avance')?'flex':'none';
      document.getElementById('p27PaneRepre').style.display = (tab==='repre')?'flex':'none';
      if(tab==='avance') renderAvance(); else renderPresu2027();
  }

  function p27OpenRepre(el){
      var rep=el.getAttribute('data-rep');
      var sel=document.getElementById('presu27Rep'); sel.value=rep;
      p27SwitchTab('repre');
  }

  function renderPresu2027(){
      var repre=document.getElementById('presu27Rep').value||'';
      var body=document.getElementById('presu27Body');
      var foot=document.getElementById('presu27Foot');
      if(!repre){ body.innerHTML='<tr><td colspan="10" style="text-align:center;padding:18px;color:#94a3b8;font-weight:600;">Sin representante asignado.</td></tr>'; foot.innerHTML=''; updatePresu27Kpis('',0); document.getElementById('p27ConfirmBar').style.display='none'; return; }
      var rows=buildPresu2027Rows(repre);
      if(!presu27Draft[repre]) presu27Draft[repre]={};
      var draft=presu27Draft[repre];
      var tot={y24:0,y25:0,s:0,m:0,t:0,o:0,tot26:0};
      var ownedCount=0;
      body.innerHTML=rows.map(function(c){
          var hist='<td class="num y24">'+p27fmt(c.y24)+'</td><td class="num y25">'+p27fmt(c.y25)+'</td>'
              +'<td class="num e26">'+p27fmt(c.s)+'</td><td class="num e26">'+p27fmt(c.m)+'</td><td class="num e26">'+p27fmt(c.t)+'</td><td class="num e26">'+p27fmt(c.o)+'</td>'
              +'<td class="num e26tot">'+p27fmt(c.tot26)+'</td>';
          if(!c.owned){
              // Cliente rotado a otro comercial: visible, con la celda de presupuesto bloqueada (no suma)
              return '<tr>'
                  +'<td class="col-name" title="'+c.name+'">'+c.name+'</td>'
                  +hist
                  +'<td class="c27"><input type="text" class="presu27-input" value="" disabled placeholder="—"><span class="p27-stat"></span></td>'
                  +'<td class="vsind"><span style="color:#cbd5e1;">—</span></td>'
                  +'</tr>';
          }
          ownedCount++;
          tot.y24+=c.y24;tot.y25+=c.y25;tot.s+=c.s;tot.m+=c.m;tot.t+=c.t;tot.o+=c.o;tot.tot26+=c.tot26;
          var num=(draft[c.key]!=null)?draft[c.key]:'';
          var val=(num==='')?'':p27InputDisplay(num);
          var dis=(esGerencial()||p27Locked)?'disabled':'';
          return '<tr>'
              +'<td class="col-name" title="'+c.name+'">'+c.name+'</td>'
              +hist
              +'<td class="c27"><input type="text" inputmode="numeric" class="presu27-input" data-key="'+c.key+'" data-cuit="'+c.cuit+'" data-nombre="'+encodeURIComponent(c.name)+'" data-tot26="'+c.tot26+'" value="'+val+'" '+dis+' oninput="onPresu27Input(this)" placeholder="—"><span class="p27-stat"></span></td>'
              +'<td class="vsind" data-ind="'+c.key+'">'+p27Indicador((num===''?0:parseFloat(num)),c.tot26)+'</td>'
              +'</tr>';
      }).join('');
      var rotados=rows.length-ownedCount;
      var footLabel='TOTAL — '+ownedCount+' clientes'+(rotados>0?' <span style="font-weight:600;color:#94a3b8;">(+'+rotados+' rotado'+(rotados>1?'s':'')+')</span>':'');
      foot.innerHTML='<tr><td class="col-name">'+footLabel+'</td>'
          +'<td class="num y24">'+p27fmt(tot.y24)+'</td><td class="num y25">'+p27fmt(tot.y25)+'</td>'
          +'<td class="num e26">'+p27fmt(tot.s)+'</td><td class="num e26">'+p27fmt(tot.m)+'</td><td class="num e26">'+p27fmt(tot.t)+'</td><td class="num e26">'+p27fmt(tot.o)+'</td>'
          +'<td class="num e26tot">'+p27fmt(tot.tot26)+'</td>'
          +'<td class="num c27" id="p27FootTotal">'+p27fmt(p27sumDraft(repre))+'</td>'
          +'<td class="vsind" id="p27FootInd">'+p27Indicador(p27sumDraft(repre),tot.tot26)+'</td></tr>';
      updatePresu27Kpis(repre,tot.tot26);
      p27UpdateConfirmUI(repre);
      p27UpdateDeadline();
      p27LoadSaved(repre);
  }

  function onPresu27Input(el){
      p27FmtMiles(el);                       // agrega el punto de miles mientras se escribe
      var repre=document.getElementById('presu27Rep').value;
      var key=el.getAttribute('data-key');
      if(!presu27Draft[repre])presu27Draft[repre]={};
      var v=p27ParseInput(el.value);         // número limpio (sin puntos) o ''
      if(v==='')delete presu27Draft[repre][key]; else presu27Draft[repre][key]=v;
      // indicador de la fila
      var tot26=parseFloat(el.getAttribute('data-tot26'))||0;
      var indTd=el.parentNode.nextElementSibling;
      if(indTd) indTd.innerHTML=p27Indicador((v===''?0:v),tot26);
      // totales (solo clientes propios; los rotados no suman)
      var rows=buildPresu2027Rows(repre);var real26=0;rows.forEach(function(c){ if(c.owned) real26+=c.tot26;});
      var ft=document.getElementById('p27FootTotal'); if(ft)ft.textContent=p27fmt(p27sumDraft(repre));
      var fi=document.getElementById('p27FootInd'); if(fi)fi.innerHTML=p27Indicador(p27sumDraft(repre),real26);
      updatePresu27Kpis(repre,real26);
      if(!esGerencial() && !p27Locked) p27QueueSave(repre, el);
  }

  // --- Persistencia (JSONP al Apps Script) ---
  var p27SaveTimers={};
  function p27Jsonp(params){
      return new Promise(function(resolve,reject){
          if(typeof __googleIdToken==='undefined' || !__googleIdToken){ reject(new Error('sin token')); return; }
          var cb='p27cb_'+Math.random().toString(36).slice(2);
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
  function p27LoadSaved(repre){
      if(!repre){ p27LoadDone=true; return; }
      p27LoadDone=false;
      presu27Confirmado[repre]=false;
      p27Jsonp({action:'presu2027_load',repre:repre}).then(function(resp){
          if(resp){ if(resp.lockDate!=null)p27LockDate=resp.lockDate; if(resp.locked!=null)p27Locked=!!resp.locked; }
          if(!resp||!resp.ok||!resp.rows){ p27ApplyLockUI(); return; }
          if(document.getElementById('presu27Rep').value!==repre) return;
          if(!presu27Draft[repre])presu27Draft[repre]={};
          resp.rows.forEach(function(r){
              if(normalize(r.repre)!==normalize(repre)) return;
              var k=String(r.key);
              if(k.indexOf('__')===0){ if(k==='__CONFIRMADO__') presu27Confirmado[repre]=true; return; }
              if(!p27KeyOK(repre,k)) return;
              if(!p27EsDueno(repre,k)) return;   // cliente rotado: no se presupuesta acá
              var tn=parseFloat(r.tn); if(isNaN(tn)) return;
              presu27Draft[repre][k]=tn;
              var inp=document.querySelector('.presu27-input[data-key="'+k.replace(/"/g,'')+'"]');
              if(inp){
                  inp.value=p27InputDisplay(tn);
                  var st=inp.parentNode.querySelector('.p27-stat'); if(st){st.textContent='✓';st.className='p27-stat ok';}
                  var indTd=inp.parentNode.nextElementSibling;
                  if(indTd) indTd.innerHTML=p27Indicador(tn, parseFloat(inp.getAttribute('data-tot26'))||0);
              }
          });
          var rows=buildPresu2027Rows(repre);var real26=0;rows.forEach(function(c){ if(c.owned) real26+=c.tot26;});
          var ft=document.getElementById('p27FootTotal'); if(ft)ft.textContent=p27fmt(p27sumDraft(repre));
          var fi=document.getElementById('p27FootInd'); if(fi)fi.innerHTML=p27Indicador(p27sumDraft(repre),real26);
          updatePresu27Kpis(repre,real26);
          p27UpdateConfirmUI(repre);
          p27ApplyLockUI();
      }).catch(function(){}).then(function(){ p27LoadDone=true; });
  }
  // Guardado serializado (cola de a uno) + gate carga-antes-de-guardar
  var p27Queue=[]; var p27Working=false; var p27LoadDone=true;
  function p27QueueSave(repre, el){
      var key=el.getAttribute('data-key');
      var st=el.parentNode.querySelector('.p27-stat'); if(st){st.textContent='…';st.className='p27-stat saving';}
      var id=repre+'|'+key;
      if(p27SaveTimers[id]) clearTimeout(p27SaveTimers[id]);
      p27SaveTimers[id]=setTimeout(function(){ p27Enqueue(repre, el); }, 500);
  }
  function p27Enqueue(repre, el){
      var key=el.getAttribute('data-key');
      p27Queue=p27Queue.filter(function(j){ return !(j.repre===repre && j.key===key); });
      p27Queue.push({repre:repre, el:el, key:key});
      p27Drain();
  }
  function p27Drain(){
      if(p27Working) return;
      if(!p27LoadDone){ setTimeout(p27Drain, 150); return; }
      var job=p27Queue.shift();
      if(!job) return;
      p27Working=true;
      p27SaveCell(job.repre, job.el).then(function(){ p27Working=false; p27Drain(); });
  }
  function p27SaveCell(repre, el){
      var st=el.parentNode.querySelector('.p27-stat');
      var tnVal=p27ParseInput(el.value);
      var params={action:'presu2027_save',key:el.getAttribute('data-key'),cuit:el.getAttribute('data-cuit')||'',
          nombre:decodeURIComponent(el.getAttribute('data-nombre')||''),repre:repre,tn:(tnVal===''?'':tnVal)};
      return p27Jsonp(params).then(function(resp){
          if(resp&&resp.ok){ if(st){st.textContent='✓';st.className='p27-stat ok';} }
          else { if(st){st.textContent='⚠';st.className='p27-stat err';st.title=(resp&&resp.error)||'No se pudo guardar';} }
      }).catch(function(){ if(st){st.textContent='⚠';st.className='p27-stat err';st.title='Sin conexión';} });
  }

  function updatePresu27Kpis(repre,real26){
      var total27=p27sumDraft(repre);
      var bd=repre?budgetData.filter(function(b){return normalize(b.r)===normalize(repre);})[0]:null;
      var presup26=bd?bd.t:0;
      var cumpl=presup26>0?(real26/presup26*100):0;
      document.getElementById('p27Total').innerText=Math.round(total27).toLocaleString('de-DE')+' Tn';
      var d=presu27Draft[repre]||{};var n=Object.keys(d).filter(function(k){return d[k]>0;}).length;
      var totalRows=repre?buildPresu2027Rows(repre).filter(function(c){return c.owned;}).length:0;
      document.getElementById('p27Count').innerText=n+' de '+totalRows+' clientes cargados';
      document.getElementById('p27Real26').innerText=Math.round(real26).toLocaleString('de-DE')+' Tn';
      document.getElementById('p27Cumpl').innerText='Presup 2026: '+Math.round(presup26).toLocaleString('de-DE')+' ('+cumpl.toFixed(1)+'%)';
      var gEl=document.getElementById('p27Growth');var card=document.getElementById('p27GrowthCard');
      if(total27>0 && real26>0){
          var g=(total27/real26-1)*100;
          gEl.innerText=(g>=0?'+':'')+g.toFixed(1)+'%';
          var col=g>1?'#16a34a':(g<-1?'#dc2626':'#64748b');
          gEl.style.color=col; card.style.borderLeftColor=col;
      } else { gEl.innerText='—'; gEl.style.color='#94a3b8'; card.style.borderLeftColor='#8b5cf6'; }
  }

  // ---------- CONFIRMACIÓN (repre) ----------
  function p27UpdateConfirmUI(repre){
      var bar=document.getElementById('p27ConfirmBar');
      if(esGerencial() || !repre){ bar.style.display='none'; return; }
      bar.style.display='flex';
      var conf=!!presu27Confirmado[repre];
      var st=document.getElementById('p27ConfirmStatus');
      var btn=document.getElementById('p27ConfirmBtn');
      if(p27Locked){
          st.innerHTML='<span style="color:#b91c1c;font-weight:800;">🔒 Carga cerrada el '+p27FmtFecha(p27LockDate)+'</span>'
              +(conf?' <span style="color:#16a34a;font-weight:700;">· confirmado ✓</span>':' <span style="color:#64748b;">· quedó sin confirmar</span>');
          btn.style.display='none';
          return;
      }
      btn.style.display='';
      btn.disabled=false;
      if(conf){
          st.innerHTML='<span style="color:#16a34a;font-weight:800;">✓ Presupuesto confirmado</span>';
          btn.textContent='Reabrir para editar'; btn.className='p27-btn-reabrir'; btn.onclick=p27Reabrir;
      } else {
          st.innerHTML='<span style="color:#64748b;">Cuando termines de cargar tus clientes, confirmá tu presupuesto.</span>';
          btn.textContent='Confirmar presupuesto'; btn.className='p27-btn-confirmar'; btn.onclick=p27Confirmar;
      }
  }
  function p27Confirmar(){
      var repre=document.getElementById('presu27Rep').value; if(!repre)return;
      var btn=document.getElementById('p27ConfirmBtn'); btn.disabled=true; btn.textContent='Confirmando…';
      p27Jsonp({action:'presu2027_save',key:'__CONFIRMADO__',cuit:'',nombre:'CONFIRMACION',repre:repre,tn:1}).then(function(resp){
          if(resp&&resp.ok){ presu27Confirmado[repre]=true; p27UpdateConfirmUI(repre); }
          else { btn.disabled=false; btn.textContent='Confirmar presupuesto'; }
      }).catch(function(){ btn.disabled=false; btn.textContent='Confirmar presupuesto'; });
  }
  function p27Reabrir(){
      var repre=document.getElementById('presu27Rep').value; if(!repre)return;
      var btn=document.getElementById('p27ConfirmBtn'); btn.disabled=true; btn.textContent='…';
      p27Jsonp({action:'presu2027_save',key:'__CONFIRMADO__',cuit:'',nombre:'CONFIRMACION',repre:repre,tn:''}).then(function(){ presu27Confirmado[repre]=false; p27UpdateConfirmUI(repre); }).catch(function(){ p27UpdateConfirmUI(repre); });
  }

  // ---------- AVANCE (gerencial) ----------
  function p27LoadAll(){
      return p27Jsonp({action:'presu2027_load',repre:'__ALL__'}).then(function(resp){
          if(resp){ if(resp.lockDate!=null)p27LockDate=resp.lockDate; if(resp.locked!=null)p27Locked=!!resp.locked; }
          return (resp&&resp.ok&&resp.rows)?resp.rows:[];
      }).catch(function(){ return []; });
  }
  function p27BuildAvance(allRows){
      var per={};
      DB.forEach(function(d){
          if(!(d.v||d.cuitLimpio))return; var rep=normalize(d.r); if(!rep)return;
          if(!p27ClienteOK(rep,d))return;
          var key=d.cuitLimpio?'CUIT_'+d.cuitLimpio:'NAME_'+d.v;
          if(!p27EsDueno(rep,key))return;   // cliente rotado: no cuenta para este comercial
          if(!per[rep])per[rep]={cl:{},vol26:0};
          if(!per[rep].cl[key])per[rep].cl[key]={hist:0,v26:0};
          if(d.e==='2024'||d.e==='2025'||d.e==='2026'){ per[rep].cl[key].hist+=d.vol; if(d.e==='2026'){per[rep].cl[key].v26+=d.vol; per[rep].vol26+=d.vol;} }
      });
      var sv={};
      allRows.forEach(function(r){
          var rep=normalize(r.repre); if(!rep)return; if(!sv[rep])sv[rep]={loaded:{},tn:0,conf:false};
          var k=String(r.key); if(k.indexOf('__')===0){ if(k==='__CONFIRMADO__')sv[rep].conf=true; return; }
          if(!p27KeyOK(rep,k))return;
          if(!p27EsDueno(rep,k))return;   // guardado de un cliente rotado: no cuenta
          var tn=parseFloat(r.tn)||0; sv[rep].loaded[k]=tn; sv[rep].tn+=tn;
      });
      return listaRepres().map(function(rep){
          var rk=normalize(rep);
          var p=per[rk]||{cl:{},vol26:0}; var s=sv[rk]||{loaded:{},tn:0,conf:false};
          var M=Object.keys(p.cl).filter(function(k){return p.cl[k].hist>0;}).length;
          var N=Object.keys(s.loaded).length;
          var cov=0; Object.keys(s.loaded).forEach(function(k){ if(p.cl[k])cov+=p.cl[k].v26; });
          var cobertura = p.vol26>0 ? (cov/p.vol26*100) : 0;
          var estado = s.conf ? 'CONFIRMADO' : (N>0?'PROGRESO':'VACIO');
          var crec = p.vol26>0 ? (s.tn/p.vol26-1)*100 : null;
          return {rep:rep,estado:estado,N:N,M:M,cobertura:cobertura,tn:s.tn,crec:crec};
      });
  }
  function estadoChip(e){
      if(e==='CONFIRMADO') return '<span class="p27-chip" style="background:#dcfce7;color:#166534;">🟢 Confirmado</span>';
      if(e==='PROGRESO') return '<span class="p27-chip" style="background:#fef9c3;color:#854d0e;">🟡 En progreso</span>';
      return '<span class="p27-chip" style="background:#fee2e2;color:#991b1b;">🔴 Sin empezar</span>';
  }
  function coberturaBar(pct){
      pct=Math.max(0,Math.min(100,pct||0));
      var col = pct>=90?'#16a34a':(pct>=40?'#d97706':'#dc2626');
      return '<div style="display:flex;align-items:center;gap:6px;justify-content:flex-end;">'
          +'<div style="width:46px;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:'+pct.toFixed(0)+'%;height:100%;background:'+col+';"></div></div>'
          +'<span style="min-width:30px;">'+pct.toFixed(0)+'%</span></div>';
  }
  function crecChip(c){
      if(c==null) return '<span style="color:#cbd5e1;">—</span>';
      var col=c>1?'#16a34a':(c<-1?'#dc2626':'#64748b');
      return '<span style="color:'+col+';font-weight:700;">'+(c>=0?'+':'')+c.toFixed(0)+'%</span>';
  }
  function counterChip(icon,label,n,col){
      return '<div class="p27-counter"><div class="p27-counter-n" style="color:'+col+';">'+n+'</div><div class="p27-counter-l">'+icon+' '+label+'</div></div>';
  }
  function renderAvance(){
      var body=document.getElementById('p27AvanceBody');
      body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:16px;color:#94a3b8;">Cargando avance…</td></tr>';
      p27LoadAll().then(function(rows){
          var data=p27BuildAvance(rows||[]);
          var c={CONFIRMADO:0,PROGRESO:0,VACIO:0};
          data.forEach(function(d){c[d.estado]++;});
          document.getElementById('p27AvanceCounters').innerHTML =
              counterChip('🟢','Confirmados',c.CONFIRMADO,'#16a34a')
              +counterChip('🟡','En progreso',c.PROGRESO,'#d97706')
              +counterChip('🔴','Sin empezar',c.VACIO,'#dc2626');
          var order={VACIO:0,PROGRESO:1,CONFIRMADO:2};
          data.sort(function(a,b){ return (order[a.estado]-order[b.estado]) || a.rep.localeCompare(b.rep); });
          body.innerHTML=data.map(function(d){
              return '<tr class="p27-av-row" data-rep="'+d.rep+'" onclick="p27OpenRepre(this)">'
                  +'<td class="col-name">'+d.rep+'</td>'
                  +'<td>'+estadoChip(d.estado)+'</td>'
                  +'<td class="num">'+d.N+' / '+d.M+'</td>'
                  +'<td class="num">'+coberturaBar(d.cobertura)+'</td>'
                  +'<td class="num">'+p27fmt(d.tn)+'</td>'
                  +'<td class="num">'+crecChip(d.crec)+'</td>'
                  +'</tr>';
          }).join('');
      });
  }

  // Exponer al scope global las funciones usadas por handlers inline
  window.openPresu2027 = openPresu2027;
  window.renderPresu2027 = renderPresu2027;
  window.onPresu27Input = onPresu27Input;
  window.p27SwitchTab = p27SwitchTab;
  window.p27OpenRepre = p27OpenRepre;
  window.p27Confirmar = p27Confirmar;
  window.p27Reabrir = p27Reabrir;

  function p27Init(){
      if(document.getElementById('presu2027Modal')) return;
      var st=document.createElement('style'); st.textContent=P27_CSS; document.head.appendChild(st);
      var tmp=document.createElement('div'); tmp.innerHTML=P27_MODAL.trim();
      if(tmp.firstElementChild) document.body.appendChild(tmp.firstElementChild);
      if(!document.getElementById('presu27Section')){
          var sec=document.createElement('div'); sec.className='tools-section'; sec.id='presu27Section';
          sec.style.marginTop='18px'; sec.style.paddingTop='16px';
          sec.innerHTML='<label class="filter-label">PRESUPUESTO</label>'
              +'<button class="btn-sec" style="background:var(--primary);color:#fff;border-color:var(--primary);font-weight:700;" onclick="openPresu2027()">'
              +'<i class="ri-flag-2-fill"></i> Presupuesto 2027</button>';
          var tools=document.getElementById('toolsSection');
          if(tools && tools.parentNode){ tools.parentNode.insertBefore(sec, tools); }
          else { var f=document.querySelector('.filters')||document.querySelector('.sidebar')||document.body; f.appendChild(sec); }
      }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', p27Init);
  else p27Init();
})();
