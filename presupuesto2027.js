/*
 * Presupuesto 2027 — módulo autocontenido del Dashboard Comercial Intagro.
 * Se carga con una sola línea en index.html:  <script src="presupuesto2027.js"></script>
 * Al cargar inyecta su propio botón, su ventana (modal) y sus estilos, y usa
 * el DB / login / budgetData / rol que ya tiene el dashboard en memoria.
 */
(function(){
  "use strict";

  var P27_CSS = `#presu27Table { width:100%; border-collapse:separate; border-spacing:0; font-family:'Inter',system-ui,-apple-system,sans-serif; }
        #presu27Table th, #presu27Table td { padding:9px 10px; font-size:0.72rem; vertical-align:middle; }
        #presu27Table thead th { background:#f8fafc; color:#475569; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; font-size:0.62rem; border-bottom:1px solid #e2e8f0; position:sticky; top:0; z-index:2; }
        #presu27Table thead tr:nth-child(2) th { top:30px; }
        #presu27Table tbody td { border-bottom:1px solid #f1f5f9; color:#1e293b; }
        #presu27Table tbody tr:nth-child(even) { background:#fafbfc; }
        #presu27Table tbody tr:hover { background:#f0fdf4; }
        #presu27Table td.num, #presu27Table th.num { text-align:right; font-variant-numeric:tabular-nums; }
        #presu27Table td.col-name { text-align:left; font-weight:600; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        #presu27Table .col-2027, #presu27Table td.c27 { background:#f0fdf4; }
        #presu27Table thead .col-2027 { color:var(--primary); }
        #presu27Table tfoot td { font-weight:800; border-top:2px solid #e2e8f0; background:#f8fafc; color:#0f172a; text-align:right; font-variant-numeric:tabular-nums; position:sticky; bottom:0; }
        #presu27Table tfoot td.col-name { text-align:left; }
        #presu27Table tfoot td.c27 { background:#dcfce7; color:var(--primary); }
        .presu27-input { width:94px; text-align:right; border:1px solid #cbd5e1; border-radius:6px; padding:5px 7px; font-size:0.72rem; font-family:inherit; font-weight:700; color:#0f172a; background:#fff; }
        .presu27-input:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 2px rgba(16,185,129,0.18); }
        .presu27-input:disabled { background:#f1f5f9; color:#64748b; }
        .p27-stat { display:inline-block; margin-left:6px; width:12px; font-size:0.72rem; font-weight:800; vertical-align:middle; }
        .p27-stat.saving { color:#94a3b8; }
        .p27-stat.ok { color:var(--primary); }
        .p27-stat.err { color:#dc2626; cursor:help; }
        #presu27Modal .budget-summary-container { margin-left:0; }`;

  var P27_MODAL = `<div id="presu2027Modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-header-top">
                    <div>
                        <h2 style="color:var(--primary);font-weight:800;font-size:1.2rem;">Presupuesto 2027 — por cliente</h2>
                        <div style="font-size:0.7rem;color:#64748b;font-weight:600;margin-top:2px;">Objetivo de toneladas por cliente para el ejercicio comercial 2027</div>
                    </div>
                    <div class="close-btn" onclick="toggleModal('presu2027Modal',false)"><i class="ri-close-line"></i></div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:14px;flex-wrap:wrap;">
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
                        <tr>
                            <th class="num">Soja</th><th class="num">Maíz</th><th class="num">Trigo</th><th class="num">Otros</th><th class="num">Total</th>
                        </tr>
                    </thead>
                    <tbody id="presu27Body"></tbody>
                    <tfoot id="presu27Foot"></tfoot>
                </table>
            </div>
        </div>
    </div>`;

        // ============================================================
        // PRESUPUESTO 2027 por cliente (Etapa 1 - lectura + cálculo en vivo, sin persistir aún)
        // ============================================================
        let presu27Draft = {}; // {repre: {clientKey: tn}} -- borrador en sesión (etapa 2: guardar en Sheet)

        function buildPresu2027Rows(repre){
            const cmap = {};
            DB.forEach(d=>{
                if(d.r !== repre) return;
                if(!(d.v || d.cuitLimpio)) return;
                const key = d.cuitLimpio ? 'CUIT_'+d.cuitLimpio : 'NAME_'+d.v;
                if(!cmap[key]) cmap[key]={key:key,cuit:d.cuitLimpio||'',name:(d.v||key.replace(/^NAME_/,'')),y24:0,y25:0,s:0,m:0,t:0,o:0,latest:0};
                const c=cmap[key];
                if(d.v && d.dObj){const ts=d.dObj.getTime(); if(ts>c.latest){c.latest=ts;c.name=d.v;}}
                if(d.e==='2024') c.y24+=d.vol;
                else if(d.e==='2025') c.y25+=d.vol;
                else if(d.e==='2026'){
                    if(d.cat==='SOJA')c.s+=d.vol; else if(d.cat==='MAIZ')c.m+=d.vol; else if(d.cat==='TRIGO')c.t+=d.vol; else c.o+=d.vol;
                }
            });
            const rows = Object.values(cmap).map(c=>{c.tot26=c.s+c.m+c.t+c.o; return c;}).filter(c=>(c.y24+c.y25+c.tot26)>0);
            rows.sort((a,b)=>b.tot26-a.tot26);
            return rows;
        }

        function p27fmt(n){return n>0?Math.round(n).toLocaleString('de-DE'):'-';}
        function p27sumDraft(repre){const d=presu27Draft[repre]||{};let s=0;Object.keys(d).forEach(k=>{const v=parseFloat(d[k]);if(!isNaN(v))s+=v;});return s;}

        function openPresu2027(){
            const sel=document.getElementById('presu27Rep');
            const esGer=(USER_ROL==='GERENCIAL');
            let repres=[];
            if(esGer){
                const set={}; DB.forEach(d=>{if(d.r) set[d.r]=true;});
                repres=Object.keys(set).sort((a,b)=>a.localeCompare(b,'es'));
                sel.disabled=false;
            } else {
                repres = USER_REPRESENTANTE ? [USER_REPRESENTANTE] : [];
                sel.disabled=true;
            }
            sel.innerHTML=repres.map(r=>`<option value="${r}">${r}</option>`).join('');
            if(!esGer && USER_REPRESENTANTE) sel.value=USER_REPRESENTANTE;
            renderPresu2027();
            toggleModal('presu2027Modal',true);
        }

        function renderPresu2027(){
            const repre=document.getElementById('presu27Rep').value||'';
            const body=document.getElementById('presu27Body');
            const foot=document.getElementById('presu27Foot');
            if(!repre){ body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:18px;color:#94a3b8;font-weight:600;">Sin representante asignado.</td></tr>'; foot.innerHTML=''; updatePresu27Kpis('',0); return; }
            const rows=buildPresu2027Rows(repre);
            if(!presu27Draft[repre]) presu27Draft[repre]={};
            const draft=presu27Draft[repre];
            let tot={y24:0,y25:0,s:0,m:0,t:0,o:0,tot26:0};
            body.innerHTML=rows.map(c=>{
                tot.y24+=c.y24;tot.y25+=c.y25;tot.s+=c.s;tot.m+=c.m;tot.t+=c.t;tot.o+=c.o;tot.tot26+=c.tot26;
                const val=(draft[c.key]!=null)?draft[c.key]:'';
                const dis=(USER_ROL==='GERENCIAL')?'disabled':'';
                return `<tr>
                    <td class="col-name" title="${c.name}">${c.name}</td>
                    <td class="num">${p27fmt(c.y24)}</td>
                    <td class="num">${p27fmt(c.y25)}</td>
                    <td class="num">${p27fmt(c.s)}</td>
                    <td class="num">${p27fmt(c.m)}</td>
                    <td class="num">${p27fmt(c.t)}</td>
                    <td class="num">${p27fmt(c.o)}</td>
                    <td class="num" style="font-weight:700;">${p27fmt(c.tot26)}</td>
                    <td class="c27"><input type="number" min="0" step="100" class="presu27-input" data-key="${c.key}" data-cuit="${c.cuit}" data-nombre="${encodeURIComponent(c.name)}" value="${val}" ${dis} oninput="onPresu27Input(this)" placeholder="—"><span class="p27-stat"></span></td>
                </tr>`;
            }).join('');
            foot.innerHTML=`<tr>
                <td class="col-name">TOTAL — ${rows.length} clientes</td>
                <td class="num">${p27fmt(tot.y24)}</td><td class="num">${p27fmt(tot.y25)}</td>
                <td class="num">${p27fmt(tot.s)}</td><td class="num">${p27fmt(tot.m)}</td><td class="num">${p27fmt(tot.t)}</td><td class="num">${p27fmt(tot.o)}</td>
                <td class="num">${p27fmt(tot.tot26)}</td>
                <td class="num c27" id="p27FootTotal">${p27fmt(p27sumDraft(repre))}</td>
            </tr>`;
            updatePresu27Kpis(repre,tot.tot26);
            p27LoadSaved(repre);
        }

        function onPresu27Input(el){
            const repre=document.getElementById('presu27Rep').value;
            const key=el.getAttribute('data-key');
            if(!presu27Draft[repre])presu27Draft[repre]={};
            const v=el.value.trim();
            if(v==='')delete presu27Draft[repre][key]; else presu27Draft[repre][key]=parseFloat(v)||0;
            const rows=buildPresu2027Rows(repre);let real26=0;rows.forEach(c=>real26+=c.tot26);
            const ft=document.getElementById('p27FootTotal'); if(ft)ft.textContent=p27fmt(p27sumDraft(repre));
            updatePresu27Kpis(repre,real26);
            if(USER_ROL!=='GERENCIAL') p27QueueSave(repre, el);
        }

        // --- Persistencia (JSONP al Apps Script, mismo transporte que la carga de datos) ---
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
            if(!repre) return;
            p27Jsonp({action:'presu2027_load',repre:repre}).then(function(resp){
                if(!resp||!resp.ok||!resp.rows) return;
                if(document.getElementById('presu27Rep').value!==repre) return; // cambió de repre mientras cargaba
                if(!presu27Draft[repre])presu27Draft[repre]={};
                resp.rows.forEach(function(r){
                    if(normalize(r.repre)!==normalize(repre)) return;
                    var tn=parseFloat(r.tn); if(isNaN(tn)) return;
                    presu27Draft[repre][r.key]=tn;
                    var inp=document.querySelector('.presu27-input[data-key="'+String(r.key).replace(/"/g,'')+'"]');
                    if(inp){ inp.value=tn; var st=inp.parentNode.querySelector('.p27-stat'); if(st){st.textContent='✓';st.className='p27-stat ok';} }
                });
                var rows=buildPresu2027Rows(repre);var real26=0;rows.forEach(function(c){real26+=c.tot26;});
                var ft=document.getElementById('p27FootTotal'); if(ft)ft.textContent=p27fmt(p27sumDraft(repre));
                updatePresu27Kpis(repre,real26);
            }).catch(function(){});
        }
        // Guardado serializado: una cola que manda de a UN request por vez.
        // Evita la condición de carrera (título en fila 2) y los ⚠ por saturar el backend.
        var p27Queue=[]; var p27Working=false;
        function p27QueueSave(repre, el){
            var key=el.getAttribute('data-key');
            var st=el.parentNode.querySelector('.p27-stat'); if(st){st.textContent='…';st.className='p27-stat saving';}
            var id=repre+'|'+key;
            if(p27SaveTimers[id]) clearTimeout(p27SaveTimers[id]);
            p27SaveTimers[id]=setTimeout(function(){ p27Enqueue(repre, el); }, 500);
        }
        function p27Enqueue(repre, el){
            var key=el.getAttribute('data-key');
            // si ya había un trabajo pendiente para la misma celda, queda el último valor
            p27Queue=p27Queue.filter(function(j){ return !(j.repre===repre && j.key===key); });
            p27Queue.push({repre:repre, el:el, key:key});
            p27Drain();
        }
        function p27Drain(){
            if(p27Working) return;
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
            const total27=p27sumDraft(repre);
            const bd=repre?budgetData.find(b=>normalize(b.r)===normalize(repre)):null;
            const presup26=bd?bd.t:0;
            const cumpl=presup26>0?(real26/presup26*100):0;
            document.getElementById('p27Total').innerText=Math.round(total27).toLocaleString('de-DE')+' Tn';
            const d=presu27Draft[repre]||{};const n=Object.keys(d).filter(k=>d[k]>0).length;
            const totalRows=repre?buildPresu2027Rows(repre).length:0;
            document.getElementById('p27Count').innerText=n+' de '+totalRows+' clientes cargados';
            document.getElementById('p27Real26').innerText=Math.round(real26).toLocaleString('de-DE')+' Tn';
            document.getElementById('p27Cumpl').innerText='Presup 2026: '+Math.round(presup26).toLocaleString('de-DE')+' ('+cumpl.toFixed(1)+'%)';
            const gEl=document.getElementById('p27Growth');const card=document.getElementById('p27GrowthCard');
            if(total27>0 && real26>0){
                const g=(total27/real26-1)*100;
                gEl.innerText=(g>=0?'+':'')+g.toFixed(1)+'%';
                const col=g>1?'#16a34a':(g<-1?'#dc2626':'#64748b');
                gEl.style.color=col; card.style.borderLeftColor=col;
            } else { gEl.innerText='—'; gEl.style.color='#94a3b8'; card.style.borderLeftColor='#8b5cf6'; }
        }

  // Exponer al scope global las funciones que usan los handlers inline (onclick/oninput/onchange)
  window.openPresu2027 = openPresu2027;
  window.renderPresu2027 = renderPresu2027;
  window.onPresu27Input = onPresu27Input;

  function p27Init(){
    if(document.getElementById('presu2027Modal')) return; // ya inyectado
    // estilos
    var st=document.createElement('style'); st.textContent=P27_CSS; document.head.appendChild(st);
    // modal
    var tmp=document.createElement('div'); tmp.innerHTML=P27_MODAL.trim();
    if(tmp.firstElementChild) document.body.appendChild(tmp.firstElementChild);
    // botón (sección propia, visible para todos los roles)
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
