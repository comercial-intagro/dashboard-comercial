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
        #presu27Table tfoot td { font-weight:800; border-top:2px solid #e2e8f0; background:#f8fafc; color:#0f172a; text-align:right; font-variant-numeric:tabular-nums; position:sticky; bottom:0; }
        #presu27Table tfoot td.col-name { text-align:left; }
        #presu27Table tfoot td.c27 { background:#dcfce7; color:var(--primary); }
        .presu27-input { width:94px; text-align:right; border:1px solid #cbd5e1; border-radius:6px; padding:5px 7px; font-size:0.72rem; font-family:inherit; font-weight:700; color:#0f172a; background:#fff; }
        .presu27-input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 2px rgba(16,185,129,0.18); }
        .presu27-input:disabled { background:#f1f5f9; color:#64748b; }
        .p27-stat { display:inline-block; margin-left:6px; width:12px; font-size:0.72rem; font-weight:800; vertical-align:middle; }
        .p27-stat.saving { color:#94a3b8; } .p27-stat.ok { color:var(--primary); } .p27-stat.err { color:#dc2626; cursor:help; }
        #presu27Modal .budget-summary-container { margin-left:0; }
        /* Solapas */
        #p27Tabs { display:flex; gap:6px; margin-top:10px; }
        .p27-tab { padding:7px 16px; border:none; border-radius:8px 8px 0 0; font-size:0.74rem; font-weight:800; cursor:pointer; background:#eef1f4; color:#64748b; }
        .p27-tab.active { background:var(--primary); color:#fff; }
        /* Panes */
        #p27PaneAvance, #p27PaneRepre { flex:1; min-height:0; flex-direction:column; }
        .p27-repre-head { display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; padding:0 2px 10px; }
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
                <div class="modal-table-container">
                    <table class="budget-table" id="presu27Table">
                        <thead>
                            <tr>
                                <th rowspan="2" class="col-name">Cliente</th>
                                <th rowspan="2" class="num">2024</th>
                                <th rowspan="2" class="num">2025</th>
                                <th colspan="5" style="text-align:center;">Ejercicio 2026 (tn)</th>
                                <th rowspan="2" class="col-2027 num">Presupuesto 2027</th>
                            </tr>
                            <tr><th class="num">Soja</th><th class="num">Maíz</th><th class="num">Trigo</th><th class="num">Otros</th><th class="num">Total</th></tr>
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

  function esGerencial(){ return USER_ROL === 'GERENCIAL'; }
  function listaRepres(){ return budgetData.filter(function(b){return !b.reserva;}).map(function(b){return b.r;}).sort(function(a,b){return a.localeCompare(b,'es');}); }

  function buildPresu2027Rows(repre){
      var cmap = {};
      DB.forEach(function(d){
          if(d.r !== repre) return;
          if(!(d.v || d.cuitLimpio)) return;
          var key = d.cuitLimpio ? 'CUIT_'+d.cuitLimpio : 'NAME_'+d.v;
          if(!cmap[key]) cmap[key]={key:key,cuit:d.cuitLimpio||'',name:(d.v||key.replace(/^NAME_/,'')),y24:0,y25:0,s:0,m:0,t:0,o:0,latest:0};
          var c=cmap[key];
          if(d.v && d.dObj){var ts=d.dObj.getTime(); if(ts>c.latest){c.latest=ts;c.name=d.v;}}
          if(d.e==='2024') c.y24+=d.vol;
          else if(d.e==='2025') c.y25+=d.vol;
          else if(d.e==='2026'){ if(d.cat==='SOJA')c.s+=d.vol; else if(d.cat==='MAIZ')c.m+=d.vol; else if(d.cat==='TRIGO')c.t+=d.vol; else c.o+=d.vol; }
      });
      var rows = Object.keys(cmap).map(function(k){var c=cmap[k]; c.tot26=c.s+c.m+c.t+c.o; return c;}).filter(function(c){return (c.y24+c.y25+c.tot26)>0;});
      rows.sort(function(a,b){return b.tot26-a.tot26;});
      return rows;
  }

  function p27fmt(n){return n>0?Math.round(n).toLocaleString('de-DE'):'-';}
  function p27sumDraft(repre){var d=presu27Draft[repre]||{};var s=0;Object.keys(d).forEach(function(k){var v=parseFloat(d[k]);if(!isNaN(v))s+=v;});return s;}

  function openPresu2027(){
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
      if(!repre){ body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:18px;color:#94a3b8;font-weight:600;">Sin representante asignado.</td></tr>'; foot.innerHTML=''; updatePresu27Kpis('',0); document.getElementById('p27ConfirmBar').style.display='none'; return; }
      var rows=buildPresu2027Rows(repre);
      if(!presu27Draft[repre]) presu27Draft[repre]={};
      var draft=presu27Draft[repre];
      var tot={y24:0,y25:0,s:0,m:0,t:0,o:0,tot26:0};
      body.innerHTML=rows.map(function(c){
          tot.y24+=c.y24;tot.y25+=c.y25;tot.s+=c.s;tot.m+=c.m;tot.t+=c.t;tot.o+=c.o;tot.tot26+=c.tot26;
          var val=(draft[c.key]!=null)?draft[c.key]:'';
          var dis=esGerencial()?'disabled':'';
          return '<tr>'
              +'<td class="col-name" title="'+c.name+'">'+c.name+'</td>'
              +'<td class="num">'+p27fmt(c.y24)+'</td><td class="num">'+p27fmt(c.y25)+'</td>'
              +'<td class="num">'+p27fmt(c.s)+'</td><td class="num">'+p27fmt(c.m)+'</td><td class="num">'+p27fmt(c.t)+'</td><td class="num">'+p27fmt(c.o)+'</td>'
              +'<td class="num" style="font-weight:700;">'+p27fmt(c.tot26)+'</td>'
              +'<td class="c27"><input type="number" min="0" step="100" class="presu27-input" data-key="'+c.key+'" data-cuit="'+c.cuit+'" data-nombre="'+encodeURIComponent(c.name)+'" value="'+val+'" '+dis+' oninput="onPresu27Input(this)" placeholder="—"><span class="p27-stat"></span></td>'
              +'</tr>';
      }).join('');
      foot.innerHTML='<tr><td class="col-name">TOTAL — '+rows.length+' clientes</td>'
          +'<td class="num">'+p27fmt(tot.y24)+'</td><td class="num">'+p27fmt(tot.y25)+'</td>'
          +'<td class="num">'+p27fmt(tot.s)+'</td><td class="num">'+p27fmt(tot.m)+'</td><td class="num">'+p27fmt(tot.t)+'</td><td class="num">'+p27fmt(tot.o)+'</td>'
          +'<td class="num">'+p27fmt(tot.tot26)+'</td>'
          +'<td class="num c27" id="p27FootTotal">'+p27fmt(p27sumDraft(repre))+'</td></tr>';
      updatePresu27Kpis(repre,tot.tot26);
      p27UpdateConfirmUI(repre);
      p27LoadSaved(repre);
  }

  function onPresu27Input(el){
      var repre=document.getElementById('presu27Rep').value;
      var key=el.getAttribute('data-key');
      if(!presu27Draft[repre])presu27Draft[repre]={};
      var v=el.value.trim();
      if(v==='')delete presu27Draft[repre][key]; else presu27Draft[repre][key]=parseFloat(v)||0;
      var rows=buildPresu2027Rows(repre);var real26=0;rows.forEach(function(c){real26+=c.tot26;});
      var ft=document.getElementById('p27FootTotal'); if(ft)ft.textContent=p27fmt(p27sumDraft(repre));
      updatePresu27Kpis(repre,real26);
      if(!esGerencial()) p27QueueSave(repre, el);
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
          if(!resp||!resp.ok||!resp.rows) return;
          if(document.getElementById('presu27Rep').value!==repre) return;
          if(!presu27Draft[repre])presu27Draft[repre]={};
          resp.rows.forEach(function(r){
              if(normalize(r.repre)!==normalize(repre)) return;
              var k=String(r.key);
              if(k.indexOf('__')===0){ if(k==='__CONFIRMADO__') presu27Confirmado[repre]=true; return; }
              var tn=parseFloat(r.tn); if(isNaN(tn)) return;
              presu27Draft[repre][k]=tn;
              var inp=document.querySelector('.presu27-input[data-key="'+k.replace(/"/g,'')+'"]');
              if(inp){ inp.value=tn; var st=inp.parentNode.querySelector('.p27-stat'); if(st){st.textContent='✓';st.className='p27-stat ok';} }
          });
          var rows=buildPresu2027Rows(repre);var real26=0;rows.forEach(function(c){real26+=c.tot26;});
          var ft=document.getElementById('p27FootTotal'); if(ft)ft.textContent=p27fmt(p27sumDraft(repre));
          updatePresu27Kpis(repre,real26);
          p27UpdateConfirmUI(repre);
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
      var tnRaw=el.value.trim();
      var params={action:'presu2027_save',key:el.getAttribute('data-key'),cuit:el.getAttribute('data-cuit')||'',
          nombre:decodeURIComponent(el.getAttribute('data-nombre')||''),repre:repre,tn:(tnRaw===''?'':(parseFloat(tnRaw)||0))};
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
      var totalRows=repre?buildPresu2027Rows(repre).length:0;
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
      return p27Jsonp({action:'presu2027_load',repre:'__ALL__'}).then(function(resp){ return (resp&&resp.ok&&resp.rows)?resp.rows:[]; }).catch(function(){ return []; });
  }
  function p27BuildAvance(allRows){
      var per={};
      DB.forEach(function(d){
          if(!(d.v||d.cuitLimpio))return; var rep=d.r; if(!rep)return;
          if(!per[rep])per[rep]={cl:{},vol26:0};
          var key=d.cuitLimpio?'CUIT_'+d.cuitLimpio:'NAME_'+d.v;
          if(!per[rep].cl[key])per[rep].cl[key]={hist:0,v26:0};
          if(d.e==='2024'||d.e==='2025'||d.e==='2026'){ per[rep].cl[key].hist+=d.vol; if(d.e==='2026'){per[rep].cl[key].v26+=d.vol; per[rep].vol26+=d.vol;} }
      });
      var sv={};
      allRows.forEach(function(r){
          var rep=r.repre; if(!rep)return; if(!sv[rep])sv[rep]={loaded:{},tn:0,conf:false};
          var k=String(r.key); if(k.indexOf('__')===0){ if(k==='__CONFIRMADO__')sv[rep].conf=true; return; }
          var tn=parseFloat(r.tn)||0; sv[rep].loaded[k]=tn; sv[rep].tn+=tn;
      });
      return listaRepres().map(function(rep){
          var p=per[rep]||{cl:{},vol26:0}; var s=sv[rep]||{loaded:{},tn:0,conf:false};
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
