
// ===============================================================
// LogiTrack SAC — Três Dashboards Independentes com Filtros (Supabase)
// ===============================================================

var CHART_PALETTE = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316'];

function getChartTheme(){
  var dk=document.documentElement.getAttribute('data-theme')==='dark';
  return { text:dk?'#94a3b8':'#64748b', grid:dk?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.06)', border:dk?'#1e293b':'#fff' };
}

function destroyChart(ref){ if(ref&&typeof ref.destroy==='function') try{ref.destroy();}catch(e){} }

function makeBarChart(id,labels,datasets,stacked){
  var el=document.getElementById(id); if(!el) return null;
  if(typeof Chart==='undefined'){ emptyChartMsg(id,'Gráfico indisponível (Chart.js não carregado)'); return null; }
  var c=getChartTheme();
  return new Chart(el.getContext('2d'),{type:'bar',
    data:{labels:labels,datasets:datasets.map(function(d){return Object.assign({borderRadius:4},d);})},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{color:c.text,font:{size:11}}}},
      scales:{
        x:{stacked:!!stacked,grid:{color:c.grid},ticks:{color:c.text,font:{size:10}}},
        y:{stacked:!!stacked,grid:{color:c.grid},ticks:{color:c.text,font:{size:10},precision:0}}
      }}});
}

function makePieChart(id,labels,data){
  var el=document.getElementById(id); if(!el) return null;
  if(!data.length) return null;
  if(typeof Chart==='undefined'){ emptyChartMsg(id,'Gráfico indisponível'); return null; }
  var c=getChartTheme();
  return new Chart(el.getContext('2d'),{type:'doughnut',
    data:{labels:labels,datasets:[{data:data,backgroundColor:CHART_PALETTE.slice(0,data.length),borderWidth:2,borderColor:c.border}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',
      plugins:{legend:{position:'bottom',labels:{color:c.text,font:{size:10},padding:8,boxWidth:10}}}}});
}

function last30days(arr,dateField){
  var out={labels:[],counts:[]};
  for(var i=29;i>=0;i--){
    var d=new Date(); d.setDate(d.getDate()-i);
    out.labels.push(d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
    var k=d.toISOString().split('T')[0];
    out.counts.push(arr.filter(function(r){return ((r[dateField]||r.createdAt)||'').startsWith(k);}).length);
  }
  return out;
}

function emptyChartMsg(canvasId,msg){
  var el=document.getElementById(canvasId); if(!el) return;
  var p=el.parentElement;
  if(p){
    var m=p.querySelector('.chart-empty-msg');
    if(!m){ m=document.createElement('div'); m.className='chart-empty-msg'; m.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;text-align:center;'; p.style.position='relative'; p.appendChild(m); }
    m.textContent=msg||'Sem dados cadastrados';
  }
}
function clearEmptyMsg(canvasId){
  var el=document.getElementById(canvasId); if(!el) return;
  var m=(el.parentElement||{}).querySelector&&el.parentElement.querySelector('.chart-empty-msg');
  if(m) m.remove();
}

function setKpi(id,val){ var e=document.getElementById(id); if(e) e.textContent=(val===undefined?'0':val); }

function emptyState(msg){
  return '<div style="padding:48px 20px;text-align:center;color:var(--text-muted)">'
    +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" style="margin-bottom:12px;opacity:.3"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>'
    +'<p style="font-size:13px;font-weight:500">'+( msg||'Nenhum registro cadastrado')+'</p>'
    +'<p style="font-size:12px;margin-top:4px">Os indicadores serão atualizados automaticamente conforme os cadastros forem realizados.</p></div>';
}

function groupBy(arr,fn){
  var map={};
  arr.forEach(function(r){ var k=fn(r)||'Não informado'; map[k]=(map[k]||0)+1; });
  return Object.entries(map).sort(function(a,b){return b[1]-a[1];});
}

function rankingHtml(entries,topN){
  topN=topN||8;
  var medals=['gold','silver','bronze'];
  if(!entries.length) return emptyState('Sem dados para o ranking');
  return entries.slice(0,topN).map(function(e,i){
    return '<div class="stat-row"><div class="stat-rank '+(medals[i]||'')+'">'+(i+1)+'</div>'
      +'<div class="stat-name">'+e[0]+'</div>'
      +'<div class="stat-value">'+e[1]+'</div></div>';
  }).join('');
}

// ── Filtros helpers ───────────────────────────────────────────
async function buildFiltrosHtml(prefix,opts){
  opts=opts||{};
  var users=(await DB.getAll(DB.KEYS.USERS)).filter(function(u){return u.ativo;});
  var html=
    '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 0 4px">'
    +'<input type="date" class="input" id="'+prefix+'-ini" style="height:32px;font-size:12px;width:auto" title="Data inicial">'
    +'<input type="date" class="input" id="'+prefix+'-fim" style="height:32px;font-size:12px;width:auto" title="Data final">'
    +'<input class="input" id="'+prefix+'-cliente" placeholder="Cliente" style="height:32px;font-size:12px;width:120px">'
    +'<input class="input" id="'+prefix+'-motorista" placeholder="Motorista" style="height:32px;font-size:12px;width:120px">';
  if(opts.mot2) html+='<input class="input" id="'+prefix+'-mot2" placeholder="Mot. Secundário" style="height:32px;font-size:12px;width:130px">';
  if(opts.conferente) html+='<input class="input" id="'+prefix+'-conferente" placeholder="Conferente" style="height:32px;font-size:12px;width:120px">';
  html+='<select class="select" id="'+prefix+'-responsavel" style="height:32px;font-size:12px;width:auto">'
    +'<option value="">Responsável</option>'
    +users.map(function(u){return '<option value="'+u.id+'">'+u.nome+'</option>';}).join('')
  +'</select>';
  if(opts.status) html+='<select class="select" id="'+prefix+'-status" style="height:32px;font-size:12px;width:auto">'
    +'<option value="">Status</option><option value="ABERTA">Aberta</option><option value="EM_ANDAMENTO">Em Andamento</option>'
    +'<option value="RESOLVIDA">Resolvida</option><option value="CANCELADA">Cancelada</option>'
    +'</select>';
  if(opts.tipo) html+='<input class="input" id="'+prefix+'-tipo" placeholder="Tipo" style="height:32px;font-size:12px;width:100px">';
  if(opts.nf) html+='<input class="input" id="'+prefix+'-nf" placeholder="Nota Fiscal" style="height:32px;font-size:12px;width:110px">';
  html+='<button class="btn btn-primary btn-sm" onclick="'+opts.applyFn+'()">Aplicar</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="'+opts.clearFn+'()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>'
    +'</div>';
  return html;
}

function readFiltros(prefix,extras){
  var g=function(id){return (document.getElementById(id)||{}).value||'';};
  var f={
    dataIni:g(prefix+'-ini'), dataFim:g(prefix+'-fim'),
    cliente:g(prefix+'-cliente').toLowerCase(),
    motorista:g(prefix+'-motorista').toLowerCase(),
    responsavel:g(prefix+'-responsavel'),
  };
  (extras||[]).forEach(function(k){ f[k]=g(prefix+'-'+k).toLowerCase(); });
  return f;
}

function clearFiltros(prefix,extras){
  var ids=[prefix+'-ini',prefix+'-fim',prefix+'-cliente',prefix+'-motorista',prefix+'-responsavel'];
  (extras||[]).forEach(function(k){ids.push(prefix+'-'+k);});
  ids.forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
}

function applyFiltrosBase(arr,f,dateField){
  return arr.filter(function(r){
    var d=r[dateField]||r.createdAt||'';
    if(f.dataIni && d<f.dataIni) return false;
    if(f.dataFim && d>(f.dataFim+'T23:59:59')) return false;
    if(f.cliente && !(r.cliente||'').toLowerCase().includes(f.cliente)) return false;
    if(f.motorista){
      var mot=(r.motorista||r.motoristaPrincipal||'').toLowerCase();
      if(!mot.includes(f.motorista)) return false;
    }
    if(f.responsavel && r.responsavelId!==f.responsavel) return false;
    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL (visão geral)
// ═══════════════════════════════════════════════════════════════
var DashboardPage = {
  _c:{}, _f:{},

  async load(){
    await this._buildFilters();
    this._f = {};
    await this._render();
  },

  async _buildFilters(){
    var el = document.getElementById('dash-sac-filters'); if(!el) return;
    var users = (await DB.getAll(DB.KEYS.USERS)).filter(function(u){return u.ativo;});
    el.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px 20px;border-bottom:1px solid var(--border)">'
        + '<input type="date" class="input" id="dsac-ini" style="height:32px;font-size:12px;width:auto" title="Data inicial">'
        + '<input type="date" class="input" id="dsac-fim" style="height:32px;font-size:12px;width:auto" title="Data final">'
        + '<input class="input" id="dsac-cliente" placeholder="Cliente" style="height:32px;font-size:12px;width:110px">'
        + '<input class="input" id="dsac-motorista" placeholder="Motorista" style="height:32px;font-size:12px;width:110px">'
        + '<select class="select" id="dsac-responsavel" style="height:32px;font-size:12px;width:auto">'
          + '<option value="">Responsável</option>'
          + users.map(function(u){return '<option value="'+u.id+'">'+u.nome+'</option>';}).join('')
        + '</select>'
        + '<select class="select" id="dsac-status" style="height:32px;font-size:12px;width:auto">'
          + '<option value="">Status</option>'
          + ['ABERTA','EM_ANDAMENTO','AGUARDANDO','RESOLVIDA','CANCELADA'].map(function(s){return '<option value="'+s+'">'+s.replace('_',' ')+'</option>';}).join('')
        + '</select>'
        + '<select class="select" id="dsac-modulo" style="height:32px;font-size:12px;width:auto">'
          + '<option value="">Todos os módulos</option>'
          + '<option value="devolucoes">Devoluções</option>'
          + '<option value="reentregas">Reentregas</option>'
          + '<option value="sobras">Sobras/Faltas</option>'
        + '</select>'
        + '<button class="btn btn-primary btn-sm" onclick="DashboardPage._aplicar()">Aplicar</button>'
        + '<button class="btn btn-ghost btn-sm" onclick="DashboardPage._limpar()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>'
      + '</div>';
  },

  async _aplicar(){
    var g = function(id){ return (document.getElementById(id)||{}).value||''; };
    this._f = {
      dataIni:    g('dsac-ini'),
      dataFim:    g('dsac-fim'),
      cliente:    g('dsac-cliente').toLowerCase(),
      motorista:  g('dsac-motorista').toLowerCase(),
      responsavel:g('dsac-responsavel'),
      status:     g('dsac-status'),
      modulo:     g('dsac-modulo'),
    };
    await this._render();
  },

  _limpar(){
    this._f = {};
    ['dsac-ini','dsac-fim','dsac-cliente','dsac-motorista','dsac-responsavel','dsac-status','dsac-modulo'].forEach(function(id){
      var e = document.getElementById(id); if(e) e.value='';
    });
    this._render();
  },

  _filterArr(arr, dateField){
    var f = this._f||{};
    return arr.filter(function(r){
      var d = r[dateField]||r.createdAt||'';
      if(f.dataIni && d < f.dataIni) return false;
      if(f.dataFim && d > (f.dataFim+'T23:59:59')) return false;
      if(f.cliente && !(r.cliente||'').toLowerCase().includes(f.cliente)) return false;
      if(f.motorista){
        var m = (r.motorista||r.motoristaPrincipal||'').toLowerCase();
        if(!m.includes(f.motorista)) return false;
      }
      if(f.responsavel && r.responsavelId!==f.responsavel) return false;
      if(f.status && r.status!==f.status) return false;
      return true;
    });
  },

  async _render(){
    var f = this._f||{};
    var modulo = f.modulo||'';

    // Busca os dados dos três módulos + atendimentos
    var allOcs  = await DB.getActive(DB.KEYS.OCORRENCIAS);
    var allReet = await DB.getActive(DB.KEYS.REENTREGAS);
    var allSF   = await DB.getActive(DB.KEYS.SOBRAS_FALTAS);
    var allAt   = await DB.getActive(DB.KEYS.ATENDIMENTOS);

    var ocs  = modulo===''||modulo==='devolucoes' ? this._filterArr(allOcs, 'createdAt') : [];
    var reet = modulo===''||modulo==='reentregas' ? this._filterArr(allReet,'createdAt') : [];
    var sf   = modulo===''||modulo==='sobras'     ? this._filterArr(allSF,  'createdAt') : [];
    var ats  = this._filterArrAt(allAt, f);

    var total = ocs.length + reet.length + sf.length;

    // KPIs consolidados
    setKpi('dsac-total',     total);
    setKpi('dsac-devolucoes',ocs.length);
    setKpi('dsac-reentregas',reet.length);
    setKpi('dsac-sobras',    sf.length);

    var allAbertos = ocs.filter(function(o){return ['ABERTA','EM_ANDAMENTO','AGUARDANDO'].includes(o.status);}).length
                   + reet.filter(function(r){return ['ABERTA','EM_ANDAMENTO'].includes(r.status);}).length
                   + sf.filter(function(s){return ['ABERTA','EM_ANDAMENTO'].includes(s.status);}).length;
    var allResolvidos = ocs.filter(function(o){return o.status==='RESOLVIDA';}).length
                      + reet.filter(function(r){return r.status==='RESOLVIDA';}).length
                      + sf.filter(function(s){return s.status==='RESOLVIDA';}).length;
    var taxaTotal = total > 0 ? Math.round(allResolvidos/total*100)+'%' : '0%';

    setKpi('dsac-abertos',   allAbertos);
    setKpi('dsac-resolvidos',allResolvidos);
    setKpi('dsac-taxa',      taxaTotal);

    // ── KPIs Financeiros ──────────────────────────────────────
    var sumIndenizcao = 0, sumReembolso = 0, sumPago = 0, sumPendente = 0;
    var qtdPendentes = 0, qtdPagos = 0;
    ats.forEach(function(a) {
      sumIndenizcao += parseFloat(a.valorIndenizacao)||0;
      sumReembolso  += parseFloat(a.valorReembolso)||0;
      var vt = parseFloat(a.valorTotal)||0;
      if (a.statusFinanceiro === 'Pago') { sumPago += vt; qtdPagos++; }
      else if (a.statusFinanceiro !== 'Cancelado') { sumPendente += vt; qtdPendentes++; }
    });
    setKpi('dsac-fin-indenizacao', fmtMoney(sumIndenizcao));
    setKpi('dsac-fin-reembolso',   fmtMoney(sumReembolso));
    setKpi('dsac-fin-pago',        fmtMoney(sumPago));
    setKpi('dsac-fin-pendente',    fmtMoney(sumPendente));
    setKpi('dsac-fin-qtd-pendente',qtdPendentes);
    setKpi('dsac-fin-qtd-pago',    qtdPagos);

    this._renderEvolDiaria(ocs, reet, sf);
    this._renderPorModulo(ocs, reet, sf);
    this._renderPorStatus(ocs, reet, sf);
    this._renderRankClientes(ocs, reet, sf);
    this._renderRankMotoristas(ocs, reet);
    this._renderRecentes(ocs, reet, sf);
    this._renderAlertasWidget(allOcs, allReet);
    this._renderFinanceiroPorMes(ats);
    this._renderFinanceiroPorStatus(ats);
    this._renderFinanceiroPorForma(ats);
  },

  // Filtro de atendimentos respeitando os filtros globais (cliente, responsável, datas)
  _filterArrAt(arr, f) {
    if (!f) return arr;
    return arr.filter(function(a) {
      var d = a.createdAt||'';
      if (f.dataIni && d < f.dataIni) return false;
      if (f.dataFim && d > (f.dataFim+'T23:59:59')) return false;
      if (f.responsavel && a.responsavelId !== f.responsavel) return false;
      return true;
    });
  },

  _renderEvolDiaria(ocs, reet, sf){
    destroyChart(this._c.evol);
    var rO = last30days(ocs,'createdAt');
    var rR = last30days(reet,'createdAt');
    var rS = last30days(sf,'createdAt');
    var id = 'dsac-chart-evol';
    if(!(ocs.length||reet.length||sf.length)){emptyChartMsg(id,'Sem registros');return;}
    clearEmptyMsg(id);
    this._c.evol = makeBarChart(id, rO.labels, [
      {label:'Devoluções',   data:rO.counts, backgroundColor:'rgba(59,130,246,0.8)'},
      {label:'Reentregas',   data:rR.counts, backgroundColor:'rgba(139,92,246,0.8)'},
      {label:'Sobras/Faltas',data:rS.counts, backgroundColor:'rgba(16,185,129,0.8)'},
    ], true);
  },

  _renderPorModulo(ocs, reet, sf){
    destroyChart(this._c.modulo);
    var total = ocs.length + reet.length + sf.length;
    if(!total){emptyChartMsg('dsac-chart-modulo','Sem dados');return;}
    clearEmptyMsg('dsac-chart-modulo');
    this._c.modulo = makePieChart('dsac-chart-modulo',
      ['Devoluções','Reentregas','Sobras/Faltas'],
      [ocs.length, reet.length, sf.length]
    );
  },

  _renderPorStatus(ocs, reet, sf){
    destroyChart(this._c.status);
    var all = ocs.concat(reet).concat(sf);
    var e = groupBy(all, function(r){return r.status;});
    if(!e.length){emptyChartMsg('dsac-chart-status','Sem dados');return;}
    clearEmptyMsg('dsac-chart-status');
    this._c.status = makePieChart('dsac-chart-status',
      e.map(function(x){return x[0];}),
      e.map(function(x){return x[1];})
    );
  },

  _renderRankClientes(ocs, reet, sf){
    var all = ocs.concat(reet).concat(sf);
    var el = document.getElementById('dsac-rank-clientes'); if(!el) return;
    el.innerHTML = rankingHtml(groupBy(all, function(r){return r.cliente||'N/A';}));
  },

  _renderRankMotoristas(ocs, reet){
    var all = ocs.concat(reet);
    var el = document.getElementById('dsac-rank-motoristas'); if(!el) return;
    el.innerHTML = rankingHtml(groupBy(all, function(r){return r.motorista||r.motoristaPrincipal||'N/A';}));
  },

  _renderRecentes(ocs, reet, sf){
    var tbody = document.getElementById('dash-recentes'); if(!tbody) return;
    var all = [].concat(
      ocs.map(function(o){  return {tipo_modulo:'Devolução',  codigo:o.codigo,  descricao:o.tipo,   status:o.status, cliente:o.cliente||'—', createdAt:o.createdAt};}),
      reet.map(function(r){ return {tipo_modulo:'Reentrega',  codigo:r.codigo,  descricao:r.motivo, status:r.status, cliente:r.cliente||'—', createdAt:r.createdAt};}),
      sf.map(function(s){   return {tipo_modulo:'Sobra/Falta',codigo:s.codigo,  descricao:s.tipo,   status:s.status, cliente:s.cliente||'—', createdAt:s.createdAt};})
    ).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,10);

    if(!all.length){
      tbody.innerHTML='<tr><td colspan="5">'+emptyState('Nenhum registro cadastrado')+'</td></tr>';
      return;
    }
    tbody.innerHTML = all.map(function(r){
      var modBadge = {
        'Devolução': '<span class="badge badge-critica" style="font-size:10px">DEV</span>',
        'Reentrega': '<span class="badge badge-andamento" style="font-size:10px">REET</span>',
        'Sobra/Falta':'<span class="badge badge-aberta" style="font-size:10px">S/F</span>',
      }[r.tipo_modulo]||r.tipo_modulo;
      return '<tr>'
        +'<td>'+modBadge+'</td>'
        +'<td><span class="td-code">'+r.codigo+'</span></td>'
        +'<td style="font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+r.descricao+'</td>'
        +'<td>'+badgeStatus(r.status)+'</td>'
        +'<td>'+r.cliente+'</td>'
        +'<td>'+fmtDate(r.createdAt)+'</td>'
        +'</tr>';
    }).join('');
  },

  _renderAlertasWidget(ocs, reet){
    var el = document.getElementById('dash-alertas'); if(!el) return;
    var semMot2 = reet.filter(function(r){return !r.motoristaSecundario&&!['RESOLVIDA','CANCELADA'].includes(r.status);});
    var abertas = ocs.filter(function(o){return o.status==='ABERTA';}).slice(0,4);
    var items = semMot2.slice(0,3).concat(abertas);
    if(!items.length){
      el.innerHTML='<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">'+Icons.svg('check',24)+'<p style="margin-top:8px">Nenhum alerta ativo</p></div>';
      return;
    }
    el.innerHTML = items.map(function(item){
      var isReet = !!item.motivo;
      var tipo = isReet ? 'warning' : 'critical';
      var titulo = isReet ? item.codigo+' — Sem Motorista Sec.' : item.codigo+' — '+(item.tipo||'');
      return '<div class="alert-item '+tipo+'" style="cursor:pointer" onclick="App.navigate(\''+(isReet?'reentregas':'ocorrencias')+'\')">'
        +'<div class="alert-icon '+tipo+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>'
        +'<div class="alert-content"><div class="alert-title">'+titulo+'</div><div class="alert-msg">'+(item.cliente||'')+'</div></div>'
        +'<span class="alert-time">'+fmtRelative(item.createdAt)+'</span>'
        +'</div>';
    }).join('');
  },

  // ── Gráficos Financeiros ──────────────────────────────────────
  _renderFinanceiroPorMes(ats) {
    destroyChart(this._c.finMes);
    var id = 'dsac-chart-fin-mes';
    if (!ats.length) { emptyChartMsg(id,'Sem dados financeiros'); return; }
    clearEmptyMsg(id);
    // Agrupa por mês (últimos 6 meses)
    var meses = [], labels = [];
    for (var i=5; i>=0; i--) {
      var d = new Date(); d.setMonth(d.getMonth()-i); d.setDate(1);
      var key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      labels.push(d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
      meses.push(key);
    }
    var dataPago    = meses.map(function(m){ return ats.filter(function(a){ return a.statusFinanceiro==='Pago' && (a.dataPagamento||'').startsWith(m); }).reduce(function(s,a){ return s+(parseFloat(a.valorTotal)||0); },0); });
    var dataPendente= meses.map(function(m){ return ats.filter(function(a){ return a.statusFinanceiro!=='Pago'&&a.statusFinanceiro!=='Cancelado'&&(a.createdAt||'').startsWith(m); }).reduce(function(s,a){ return s+(parseFloat(a.valorTotal)||0); },0); });
    this._c.finMes = makeBarChart(id, labels, [
      {label:'Pago',     data:dataPago,     backgroundColor:'rgba(16,185,129,0.8)'},
      {label:'Pendente', data:dataPendente, backgroundColor:'rgba(245,158,11,0.8)'},
    ]);
  },

  _renderFinanceiroPorStatus(ats) {
    destroyChart(this._c.finStatus);
    var id = 'dsac-chart-fin-status';
    var map = {};
    ats.forEach(function(a){ var s=a.statusFinanceiro||'Pendente'; map[s]=(map[s]||0)+(parseFloat(a.valorTotal)||0); });
    var entries = Object.entries(map).filter(function(e){ return e[1]>0; });
    if (!entries.length) { emptyChartMsg(id,'Sem dados'); return; } clearEmptyMsg(id);
    this._c.finStatus = makePieChart(id, entries.map(function(e){ return e[0]; }), entries.map(function(e){ return e[1]; }));
  },

  _renderFinanceiroPorForma(ats) {
    destroyChart(this._c.finForma);
    var id = 'dsac-chart-fin-forma';
    var pagos = ats.filter(function(a){ return a.statusFinanceiro==='Pago' && a.formaPagamento; });
    var map = {};
    pagos.forEach(function(a){ var f=a.formaPagamento; map[f]=(map[f]||0)+(parseFloat(a.valorTotal)||0); });
    var entries = Object.entries(map).filter(function(e){ return e[1]>0; });
    if (!entries.length) { emptyChartMsg(id,'Sem pagamentos realizados'); return; } clearEmptyMsg(id);
    this._c.finForma = makePieChart(id, entries.map(function(e){ return e[0]; }), entries.map(function(e){ return e[1]; }));
  },
};

var DashboardExecPage={ load:function(){ return DashDevolucoes.load(); } };

// ═══════════════════════════════════════════════════════════════
// DASHBOARD DEVOLUÇÕES
// ═══════════════════════════════════════════════════════════════
var DashDevolucoes = {
  _c:{}, _f:{},
  async load(){
    var el=document.getElementById('dd-filters-area');
    if(el) el.innerHTML=await buildFiltrosHtml('dd',{status:true,tipo:true,nf:true,applyFn:'DashDevolucoes._apply',clearFn:'DashDevolucoes._clear'});
    this._f={};
    await this._render();
  },
  async _apply(){ this._f=readFiltros('dd',['status','tipo','nf']); await this._render(); },
  async _clear(){ clearFiltros('dd',['status','tipo','nf']); this._f={}; await this._render(); },
  async _getData(){
    var all=await DB.getActive(DB.KEYS.OCORRENCIAS);
    var f=this._f||{};
    all=applyFiltrosBase(all,f,'createdAt');
    if(f.status) all=all.filter(function(o){return o.status===f.status;});
    if(f.tipo)   all=all.filter(function(o){return (o.tipo||'').toLowerCase().includes(f.tipo);});
    if(f.nf)     all=all.filter(function(o){return (o.notaFiscal||'').toLowerCase().includes(f.nf);});
    return all;
  },
  async _render(){
    var all=await this._getData();
    var total=all.length;
    var emTratativa=all.filter(function(o){return o.resolucaoDevolucao==='Em tratativa'||(!o.resolucaoDevolucao&&!['RESOLVIDA','CANCELADA'].includes(o.status));}).length;
    var resolvidas=all.filter(function(o){return o.resolucaoDevolucao==='Devolucao realizada';}).length;
    var comReet=all.filter(function(o){return o.resolucaoDevolucao==='Resolvida com reentrega';}).length;
    var emRota=all.filter(function(o){return o.resolucaoDevolucao==='Entrega em Rota';}).length;
    var evitadas=(await DB.getActive(DB.KEYS.REENTREGAS)).filter(function(r){return r.devolucaoEvitada;}).length;
    var pendentes=all.filter(function(o){return ['ABERTA','EM_ANDAMENTO','AGUARDANDO'].includes(o.status)&&!o.resolucaoDevolucao;}).length;

    // A2: Reentrega — "Resolvida com reentrega" também alimenta Dashboard Reentregas via devolucaoEvitada.
    // As ocorrências com resolucao='Resolvida com reentrega' já são contadas no dd-com-reet (Dashboard Devoluções).
    // No Dashboard Reentregas, elas aparecem via DB.getActive(REENTREGAS) quando devolucaoEvitada=true.
    // A contagem correta é: comReet = ocorrências resolvidas via reentrega (origem: ocorrências).
    // evitadas = reentregas que evitaram a devolução (origem: tabela reentregas).

    // A4: Entrega em Rota — KPIs
    var totalResolvidas = resolvidas + comReet + emRota;
    var emRotaPct = totalResolvidas > 0 ? Math.round(emRota / totalResolvidas * 100) + '%' : '0%';
    var c30 = new Date(); c30.setDate(c30.getDate()-30);
    var emRotaMes = all.filter(function(o){return o.resolucaoDevolucao==='Entrega em Rota' && new Date(o.createdAt)>=c30;}).length;

    setKpi('dd-total',total); setKpi('dd-tratativa',emTratativa);
    setKpi('dd-resolvidas',resolvidas); setKpi('dd-com-reet',comReet);
    setKpi('dd-evitadas',evitadas); setKpi('dd-pendentes',pendentes);
    setKpi('dd-entrega-rota',emRota);
    setKpi('dd-entrega-rota-pct',emRotaPct);
    setKpi('dd-entrega-rota-mes',emRotaMes);

    this._renderEvol(all);
    this._renderMotivos(all);
    this._renderStatus(all);
    this._renderRotaChart(all);
    this._renderRankClientes(all);
    this._renderRankMotoristas(all);
    await this._renderRankResp(all);

    var tbl=document.getElementById('dd-recentes'); if(!tbl) return;
    if(!all.length){tbl.innerHTML='<tr><td colspan="6">'+emptyState()+'</td></tr>';return;}
    var s=[...all].sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,8);
    tbl.innerHTML=s.map(function(o){
      return '<tr><td><span class="td-code">'+o.codigo+'</span></td><td>'+o.tipo+'</td>'
        +'<td>'+badgeStatus(o.status)+'</td><td>'+(o.cliente||'—')+'</td>'
        +'<td>'+(o.resolucaoDevolucao||'<span style="color:var(--text-muted)">Pendente</span>')+'</td>'
        +'<td>'+fmtDate(o.createdAt)+'</td></tr>';
    }).join('');
  },
  _renderEvol(all){
    destroyChart(this._c.evol);
    var r=last30days(all,'createdAt');
    this._c.evol=makeBarChart('dd-chart-evol',r.labels,[{label:'Devoluções',data:r.counts,backgroundColor:'rgba(59,130,246,0.8)'}]);
    if(!all.length) emptyChartMsg('dd-chart-evol','Sem registros');
    else clearEmptyMsg('dd-chart-evol');
  },
  _renderMotivos(all){
    destroyChart(this._c.motivos);
    var e=groupBy(all,function(o){return o.tipo;});
    if(!e.length){emptyChartMsg('dd-chart-motivos','Sem dados');return;} clearEmptyMsg('dd-chart-motivos');
    this._c.motivos=makePieChart('dd-chart-motivos',e.map(function(x){return x[0];}),e.map(function(x){return x[1];}));
  },
  _renderStatus(all){
    destroyChart(this._c.status);
    var e=groupBy(all,function(o){return o.resolucaoDevolucao||'Sem resolução';});
    if(!e.length){emptyChartMsg('dd-chart-status','Sem dados');return;} clearEmptyMsg('dd-chart-status');
    this._c.status=makePieChart('dd-chart-status',e.map(function(x){return x[0];}),e.map(function(x){return x[1];}));
  },
  // A4: Gráfico específico de Entrega em Rota por dia
  _renderRotaChart(all){
    destroyChart(this._c.rota);
    var rotaItems=all.filter(function(o){return o.resolucaoDevolucao==='Entrega em Rota';});
    var r=last30days(rotaItems,'createdAt');
    this._c.rota=makeBarChart('dd-chart-rota',r.labels,[{label:'Entrega em Rota',data:r.counts,backgroundColor:'rgba(16,185,129,0.75)'}]);
    if(!rotaItems.length) emptyChartMsg('dd-chart-rota','Sem Entregas em Rota registradas');
    else clearEmptyMsg('dd-chart-rota');
  },
  _renderRankClientes(all){
    var el=document.getElementById('dd-rank-clientes'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(o){return o.cliente||'N/A';}));
  },
  _renderRankMotoristas(all){
    var el=document.getElementById('dd-rank-motoristas'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(o){return o.motorista||'N/A';}));
  },
  async _renderRankResp(all){
    await refreshUsersCache();
    var el=document.getElementById('dd-rank-resp'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(o){return getUser(o.responsavelId).nome;}));
  },
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD REENTREGAS
// ═══════════════════════════════════════════════════════════════
var DashReentregas = {
  _c:{}, _f:{},
  async load(){
    var el=document.getElementById('dr-filters-area');
    if(el) el.innerHTML=await buildFiltrosHtml('dr',{mot2:true,status:true,applyFn:'DashReentregas._apply',clearFn:'DashReentregas._clear'});
    this._f={};
    await this._render();
  },
  async _apply(){ this._f=readFiltros('dr',['mot2','status']); await this._render(); },
  async _clear(){ clearFiltros('dr',['mot2','status']); this._f={}; await this._render(); },
  async _getData(){
    var all=await DB.getActive(DB.KEYS.REENTREGAS);
    var f=this._f||{};
    all=applyFiltrosBase(all,f,'createdAt');
    if(f.status) all=all.filter(function(r){return r.status===f.status;});
    if(f.mot2)   all=all.filter(function(r){return (r.motoristaSecundario||'').toLowerCase().includes(f.mot2);});
    return all;
  },
  async _render(){
    var all=await this._getData();
    var total=all.length;
    var agendadas=all.filter(function(r){return r.possuiAgendamento==='sim';}).length;
    var pendentes=all.filter(function(r){return ['ABERTA','EM_ANDAMENTO'].includes(r.status);}).length;
    var concluidas=all.filter(function(r){return r.status==='RESOLVIDA';}).length;
    var evitadas=all.filter(function(r){return r.devolucaoEvitada;}).length;
    var semMot2=all.filter(function(r){return !r.motoristaSecundario&&!['RESOLVIDA','CANCELADA'].includes(r.status);}).length;

    setKpi('dr-total',total); setKpi('dr-agendadas',agendadas);
    setKpi('dr-pendentes',pendentes); setKpi('dr-concluidas',concluidas);
    setKpi('dr-evitadas',evitadas); setKpi('dr-sem-mot2',semMot2);

    this._renderEvol(all);
    this._renderMotivos(all);
    this._renderStatus(all);
    this._renderRankClientes(all);
    this._renderRankMotoristas(all);

    var tbl=document.getElementById('dr-recentes'); if(!tbl) return;
    if(!all.length){tbl.innerHTML='<tr><td colspan="6">'+emptyState()+'</td></tr>';return;}
    var s=[...all].sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,8);
    tbl.innerHTML=s.map(function(r){
      var sm=!r.motoristaSecundario?'<span style="color:var(--danger);font-size:11px">⚠ Pendente</span>':r.motoristaSecundario;
      return '<tr><td><span class="td-code">'+r.codigo+'</span></td><td style="font-size:12px">'+r.motivo+'</td>'
        +'<td>'+badgeStatus(r.status)+'</td><td>'+(r.cliente||'—')+'</td>'
        +'<td style="font-size:12px">'+sm+'</td><td>'+fmtDate(r.createdAt)+'</td></tr>';
    }).join('');
  },
  _renderEvol(all){
    destroyChart(this._c.evol);
    var r=last30days(all,'createdAt');
    this._c.evol=makeBarChart('dr-chart-evol',r.labels,[{label:'Reentregas',data:r.counts,backgroundColor:'rgba(139,92,246,0.8)'}]);
    if(!all.length) emptyChartMsg('dr-chart-evol','Sem registros');
    else clearEmptyMsg('dr-chart-evol');
  },
  _renderMotivos(all){
    destroyChart(this._c.motivos);
    var e=groupBy(all,function(r){return r.motivo||'N/A';});
    if(!e.length){emptyChartMsg('dr-chart-motivos','Sem dados');return;} clearEmptyMsg('dr-chart-motivos');
    this._c.motivos=makePieChart('dr-chart-motivos',e.map(function(x){return x[0];}),e.map(function(x){return x[1];}));
  },
  _renderStatus(all){
    destroyChart(this._c.status);
    var e=groupBy(all,function(r){return r.status;});
    if(!e.length){emptyChartMsg('dr-chart-status','Sem dados');return;} clearEmptyMsg('dr-chart-status');
    this._c.status=makePieChart('dr-chart-status',e.map(function(x){return x[0];}),e.map(function(x){return x[1];}));
  },
  _renderRankClientes(all){
    var el=document.getElementById('dr-rank-clientes'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(r){return r.cliente||'N/A';}));
  },
  _renderRankMotoristas(all){
    var el=document.getElementById('dr-rank-motoristas'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(r){return r.motoristaPrincipal||'N/A';}));
  },
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD SOBRAS / FALTAS
// ═══════════════════════════════════════════════════════════════
var DashSobrasFaltasPage = {
  _c:{}, _f:{},
  async load(){
    var el=document.getElementById('dsf-filters-area');
    if(el) el.innerHTML=await buildFiltrosHtml('dsf',{conferente:true,tipo:true,nf:true,applyFn:'DashSobrasFaltasPage._apply',clearFn:'DashSobrasFaltasPage._clear'});
    this._f={};
    await this._render();
  },
  async _apply(){ this._f=readFiltros('dsf',['conferente','tipo','nf']); await this._render(); },
  async _clear(){ clearFiltros('dsf',['conferente','tipo','nf']); this._f={}; await this._render(); },
  async _getData(){
    var all=await DB.getActive(DB.KEYS.SOBRAS_FALTAS);
    var f=this._f||{};
    all=applyFiltrosBase(all,f,'data');
    if(f.conferente) all=all.filter(function(r){return (r.conferente||'').toLowerCase().includes(f.conferente);});
    if(f.tipo)       all=all.filter(function(r){return r.tipo===f.tipo.toUpperCase();});
    if(f.nf)         all=all.filter(function(r){return (r.notaFiscal||'').toLowerCase().includes(f.nf);});
    return all;
  },
  async _render(){
    var all=await this._getData();
    var sobras=all.filter(function(r){return r.tipo==='SOBRA';});
    var faltas=all.filter(function(r){return r.tipo==='FALTA';});

    setKpi('dsf-total',all.length); setKpi('dsf-sobras',sobras.length);
    setKpi('dsf-faltas',faltas.length);
    var res=all.filter(function(r){return r.status==='RESOLVIDA';}).length;
    setKpi('dsf-taxa',all.length>0?Math.round(res/all.length*100)+'%':'0%');

    this._renderEvol(all);
    this._renderTipo(all);
    this._renderRankConferente(all);
    this._renderRankClientes(all);
    this._renderRankCarreg(all);

    var tbl=document.getElementById('dsf-recentes'); if(!tbl) return;
    if(!all.length){tbl.innerHTML='<tr><td colspan="6">'+emptyState()+'</td></tr>';return;}
    var s=[...all].sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);}).slice(0,8);
    tbl.innerHTML=s.map(function(r){
      var tb=r.tipo==='SOBRA'?'<span class="badge" style="background:#d1fae5;color:#065f46">Sobra</span>':'<span class="badge" style="background:#fee2e2;color:#b91c1c">Falta</span>';
      return '<tr><td><span class="td-code">'+r.codigo+'</span></td><td>'+tb+'</td>'
        +'<td>'+(r.cliente||'—')+'</td><td>'+(r.produto||'—')+'</td>'
        +'<td>'+(r.conferente||'—')+'</td><td>'+fmtDate(r.data||r.createdAt)+'</td></tr>';
    }).join('');
  },
  _renderEvol(all){
    destroyChart(this._c.evol);
    var sob=last30days(all.filter(function(r){return r.tipo==='SOBRA';}),'data');
    var fal=last30days(all.filter(function(r){return r.tipo==='FALTA';}),'data');
    this._c.evol=makeBarChart('dsf-chart-evol',sob.labels,[
      {label:'Sobras',data:sob.counts,backgroundColor:'rgba(16,185,129,0.8)'},
      {label:'Faltas',data:fal.counts,backgroundColor:'rgba(239,68,68,0.8)'},
    ]);
    if(!all.length) emptyChartMsg('dsf-chart-evol','Sem registros');
    else clearEmptyMsg('dsf-chart-evol');
  },
  _renderTipo(all){
    destroyChart(this._c.tipo);
    var e=groupBy(all,function(r){return r.tipo;});
    if(!e.length){emptyChartMsg('dsf-chart-tipo','Sem dados');return;} clearEmptyMsg('dsf-chart-tipo');
    this._c.tipo=makePieChart('dsf-chart-tipo',e.map(function(x){return x[0];}),e.map(function(x){return x[1];}));
  },
  _renderRankConferente(all){
    var el=document.getElementById('dsf-rank-conf'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(r){return r.conferente||'N/A';}));
  },
  _renderRankClientes(all){
    var el=document.getElementById('dsf-rank-clientes'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(r){return r.cliente||'N/A';}));
  },
  _renderRankCarreg(all){
    var el=document.getElementById('dsf-rank-carreg'); if(el) el.innerHTML=rankingHtml(groupBy(all,function(r){return r.numCarregamento||'N/A';}));
  },
};

