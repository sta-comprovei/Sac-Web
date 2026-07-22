
// ===============================================================
// LogiTrack SAC -- Secondary Pages (Supabase)
// ===============================================================

// -- Rankings ---------------------------------------------------
const RankingsPage = {
  filtros: {},
  async load() {
    this.filtros={};
    await this._renderFiltros();
    await this._render();
  },
  async _renderFiltros() {
    var el=document.getElementById('rank-filters'); if(!el) return;
    el.innerHTML=
      '<input type="date" class="input" id="rk-ini" style="height:34px;font-size:12.5px;width:auto" title="De">'
      +'<input type="date" class="input" id="rk-fim" style="height:34px;font-size:12.5px;width:auto" title="Até">'
      +'<input class="input" id="rk-cliente" placeholder="Cliente" style="height:34px;font-size:12.5px;width:130px">'
      +'<select class="select" id="rk-fonte" style="height:34px;font-size:12.5px;width:auto">'
        +'<option value="ocs">Ocorrências</option><option value="reet">Reentregas</option><option value="sf">Sobras/Faltas</option>'
      +'</select>'
      +'<button class="btn btn-primary btn-sm" onclick="RankingsPage._aplicar()">Filtrar</button>'
      +'<button class="btn btn-ghost btn-sm" onclick="RankingsPage._limpar()">'+Icons.svg('refresh',14)+'</button>';
  },
  async _aplicar() {
    var g=function(id){return (document.getElementById(id)||{}).value||'';};
    this.filtros={dataIni:g('rk-ini'),dataFim:g('rk-fim'),cliente:g('rk-cliente'),fonte:g('rk-fonte')||'ocs'};
    await this._render();
  },
  async _limpar() {
    this.filtros={}; document.querySelectorAll('#rank-filters input,#rank-filters select').forEach(function(e){e.value='';});
    await this._render();
  },
  async _getSource() {
    var fonte=this.filtros.fonte||'ocs';
    var key=fonte==='reet'?DB.KEYS.REENTREGAS:fonte==='sf'?DB.KEYS.SOBRAS_FALTAS:DB.KEYS.OCORRENCIAS;
    var all=(await DB.getAll(key)).filter(function(r){return !r.arquivado;});
    var f=this.filtros;
    if(f.dataIni) all=all.filter(function(r){return r.createdAt>=f.dataIni;});
    if(f.dataFim) all=all.filter(function(r){return r.createdAt<=(f.dataFim+'T23:59:59');});
    if(f.cliente){var cl=f.cliente.toLowerCase(); all=all.filter(function(r){return (r.cliente||'').toLowerCase().includes(cl);});}
    return all;
  },
  async _render() {
    var ocs=await this._getSource();
    var fonte=this.filtros.fonte||'ocs';
    var getMotor=fonte==='reet'?function(r){return r.motoristaPrincipal||'';}:function(r){return r.motorista||'';};
    this.renderRankingTexto('clientes',    function(o){return o.cliente||'';},   ocs);
    this.renderRankingTexto('motoristas',  getMotor,                              ocs);
    this.renderRankingTexto('conferentes', function(o){return o.conferente||'';},ocs);
    await this.renderRankingResponsaveis(ocs);
  },
  renderRankingTexto(elId, getVal, data) {
    var el=document.getElementById('rank-'+elId); if(!el) return;
    var arr=data||[];
    var map={};
    arr.forEach(function(o){ var val=getVal(o); if(!val) return; if(!map[val]) map[val]={nome:val,total:0,res:0}; map[val].total++; if(o.status==='RESOLVIDA') map[val].res++; });
    var sorted=Object.values(map).sort(function(a,b){return b.total-a.total;}).slice(0,10);
    var medals=['gold','silver','bronze'];
    if(!sorted.length){el.innerHTML='<p style="color:var(--text-muted);text-align:center;padding:24px">Sem dados</p>';return;}
    el.innerHTML=sorted.map(function(r,i){ var taxa=r.total>0?Math.round(r.res/r.total*100):0; return '<div class="stat-row"><div class="stat-rank '+(medals[i]||'')+'">'+(i+1)+'</div><div><div class="stat-name">'+r.nome+'</div><div class="stat-sub">'+r.total+' registros · '+taxa+'% resolvidos</div></div><div class="stat-value">'+r.total+'</div></div>'; }).join('');
  },
  async renderRankingResponsaveis(data) {
    var el=document.getElementById('rank-responsaveis'); if(!el) return;
    var arr=data||[];
    var users=await DB.getAll(DB.KEYS.USERS); var map={};
    arr.forEach(function(o){ var id=o.responsavelId; if(!id) return; if(!map[id]) map[id]={id:id,total:0,res:0}; map[id].total++; if(o.status==='RESOLVIDA') map[id].res++; });
    var sorted=Object.values(map).sort(function(a,b){return b.total-a.total;}).slice(0,10);
    var medals=['gold','silver','bronze'];
    if(!sorted.length){el.innerHTML='<p style="color:var(--text-muted);text-align:center;padding:24px">Sem dados</p>';return;}
    el.innerHTML=sorted.map(function(r,i){ var u=users.find(function(x){return x.id===r.id;})||{nome:'Desconhecido'}; var taxa=r.total>0?Math.round(r.res/r.total*100):0; return '<div class="stat-row"><div class="stat-rank '+(medals[i]||'')+'">'+(i+1)+'</div><div><div class="stat-name">'+u.nome+'</div><div class="stat-sub">'+r.total+' registros · '+taxa+'% resolvidos</div></div><div class="stat-value">'+r.total+'</div></div>'; }).join('');
  },
};

// -- Relatorios -------------------------------------------------
const RelatoriosPage = {
  async load() { await this.populateFiltros(); },
  async populateFiltros() {
    var ocs=await DB.getAll(DB.KEYS.OCORRENCIAS);
    var clientesSet={};
    ocs.forEach(function(o){if(o.cliente) clientesSet[o.cliente]=true;});
    var clientesUnicos=Object.keys(clientesSet).sort();
    var selC=document.getElementById('rel-cliente');
    if(selC) selC.innerHTML='<option value="">Todos clientes</option>'+clientesUnicos.map(function(c){return '<option value="'+c+'">'+c+'</option>';}).join('');
    const selT=document.getElementById('rel-tipo');
    if(selT) selT.innerHTML='<option value="">Todos</option>'+TIPOS_OCORRENCIA.map(t=>'<option value="'+t+'">'+(TIPO_LABEL[t]||t)+'</option>').join('');
  },
  async gerar(formato) {
    const ocs=await DB.getAll(DB.KEYS.OCORRENCIAS);
    const dataIni=document.getElementById('rel-data-ini')?.value||'';
    const dataFim=document.getElementById('rel-data-fim')?.value||'';
    var clienteFilter=document.getElementById('rel-cliente')?.value||'';
    const status=document.getElementById('rel-status')?.value||'';
    const tipoFiltro=document.getElementById('rel-tipo')?.value||'';
    let filtered=ocs.filter(function(o){return !o.arquivado;});
    if(dataIni) filtered=filtered.filter(o=>o.createdAt>=dataIni);
    if(dataFim) filtered=filtered.filter(o=>o.createdAt<=(dataFim+'T23:59:59'));
    if(clienteFilter) filtered=filtered.filter(function(o){return (o.cliente||'').toLowerCase().includes(clienteFilter.toLowerCase());});
    if(status) filtered=filtered.filter(o=>o.status===status);
    if(tipoFiltro) filtered=filtered.filter(o=>o.tipo===tipoFiltro);
    filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(formato==='pdf') await this.exportPDF(filtered);
    else if(formato==='excel') this.exportExcel(filtered);
    else this.exportCSV(filtered);
  },
  exportCSV(ocs) {
    var headers=['Codigo','Tipo','Status','Prioridade','Cliente','Motorista','Nota Fiscal','Local','Valor','Resolucao','Justificativa','Tratativa com','Data'];
    var rows=ocs.map(function(o){return[
      o.codigo, TIPO_LABEL[o.tipo]||o.tipo, o.status, o.prioridade,
      o.cliente||'', getMotoristaDisplay(o.motorista||''),
      o.notaFiscal||'', o.localOcorrencia||'', o.valorMercadoria||0,
      o.resolucaoDevolucao||'', o.justificativa||'', o.tratativaCom||'', fmtDate(o.createdAt)
    ];});
    var lines=[headers].concat(rows).map(function(r){
      return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');
    });
    var csv=lines.join('\r\n');
    this._download('ocorrencias.csv','text/csv;charset=utf-8','\uFEFF'+csv);
    Toast.success('CSV gerado com '+ocs.length+' registros');
  },
  exportExcel(ocs) {
    var headers=['Codigo','Tipo','Status','Prioridade','Cliente','Motorista','Nota Fiscal','Valor','Resolucao','Justificativa','Tratativa com','Data'];
    var html='<html><head><meta charset="UTF-8"></head><body><table border="1">';
    html+='<tr>'+headers.map(function(h){return'<th style="background:#1e3a5f;color:#fff;padding:6px 10px">'+h+'</th>';}).join('')+'</tr>';
    ocs.forEach(function(o,i){
      var bg=i%2===0?'#f8fafc':'#fff';
      html+='<tr style="background:'+bg+'"><td>'+o.codigo+'</td><td>'+(o.tipo||'')+'</td><td>'+o.status+'</td><td>'+o.prioridade+'</td><td>'+(o.cliente||'')+'</td><td>'+getMotoristaDisplay(o.motorista||'')+'</td><td>'+(o.notaFiscal||'')+'</td><td>'+fmtMoney(o.valorMercadoria)+'</td><td>'+(o.resolucaoDevolucao||'')+'</td><td>'+(o.justificativa||'')+'</td><td>'+(o.tratativaCom||'')+'</td><td>'+fmtDate(o.createdAt)+'</td></tr>';
    });
    html+='</table></body></html>';
    this._download('ocorrencias.xls','application/vnd.ms-excel',html);
    Toast.success('Excel gerado com '+ocs.length+' registros');
  },
  async exportPDF(ocs) {
    var win=window.open('','_blank');
    var cfg=await DB.getConfig();
    var rows=ocs.map(function(o){
      var smap={ABERTA:'aberta',EM_ANDAMENTO:'andamento',AGUARDANDO:'andamento',RESOLVIDA:'resolvida',CANCELADA:'cancelada'};
      var pmap={CRITICA:'critica',ALTA:'alta',MEDIA:'media',BAIXA:'baixa'};
      return '<tr><td><strong>'+o.codigo+'</strong></td><td>'+(TIPO_LABEL[o.tipo]||o.tipo)+'</td>'
        +'<td><span class="badge '+(smap[o.status]||'')+'">'+(o.status||'')+'</span></td>'
        +'<td><span class="badge '+(pmap[o.prioridade]||'')+'">'+(o.prioridade||'')+'</span></td>'
        +'<td>'+(o.cliente||'')+'</td><td>'+getMotoristaDisplay(o.motorista||'')+'</td>'
        +'<td>'+fmtMoney(o.valorMercadoria)+'</td><td>'+fmtDate(o.createdAt)+'</td></tr>';
    }).join('');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatorio de Ocorrencias</title>'
      +'<style>body{font-family:Arial,sans-serif;font-size:12px;color:#333;margin:20px}'
      +'h1{color:#1e3a5f}p.sub{color:#64748b;font-size:11px;margin-bottom:20px}'
      +'table{width:100%;border-collapse:collapse}th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-size:11px}'
      +'td{padding:5px 8px;border-bottom:1px solid #e2e8f0;font-size:11px}tr:nth-child(even)td{background:#f8fafc}'
      +'.badge{display:inline-block;padding:2px 6px;border-radius:99px;font-size:10px;font-weight:600}'
      +'.aberta{background:#dbeafe;color:#1d4ed8}.resolvida{background:#d1fae5;color:#065f46}'
      +'.andamento{background:#fef3c7;color:#b45309}.cancelada{background:#f1f5f9;color:#64748b}'
      +'.critica{background:#fee2e2;color:#b91c1c}.alta{background:#ffedd5;color:#c2410c}'
      +'.media{background:#fef9c3;color:#a16207}.baixa{background:#f0fdf4;color:#166534}'
      +'@media print{body{margin:10px}}</style></head><body>'
      +'<h1>Relatorio de Ocorrencias - '+(cfg.empresa||'LogiTrack SAC')+'</h1>'
      +'<p class="sub">Gerado em '+fmtDateTime(new Date().toISOString())+' - '+ocs.length+' registros</p>'
      +'<table><thead><tr><th>Codigo</th><th>Tipo</th><th>Status</th><th>Prioridade</th>'
      +'<th>Cliente</th><th>Motorista</th><th>Valor</th><th>Data</th></tr></thead>'
      +'<tbody>'+rows+'</tbody></table></body></html>');
    win.document.close();
    setTimeout(function(){win.print();},400);
    Toast.success('Relatorio PDF aberto para impressao');
  },
  _download(filename, mime, content) {
    var blob=new Blob([content],{type:mime});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=filename; a.click();
    URL.revokeObjectURL(a.href);
  },
};

// -- Alertas ----------------------------------------------------
const AlertasPage = {
  async load() {
    const ocs=await DB.getAll(DB.KEYS.OCORRENCIAS);
    const el=document.getElementById('alertas-list');
    if(!el) return;
    const read=(await DB.get(DB.KEYS.ALERTS_READ))||[];
    const cfg=await DB.getConfig();
    const sla=cfg.slaHoras||24;
    const alerts=[];

    ocs.forEach(function(o){
      if(o.arquivado) return;
      if(o.prioridade==='CRITICA'&&!['RESOLVIDA','CANCELADA'].includes(o.status))
        alerts.push({type:'critical',title:'Ocorrência Crítica: '+o.codigo,
          msg:o.tipo+' - '+(o.cliente||''),time:o.createdAt,id:o.id});
      if(o.status==='ABERTA'){
        var diffH=(Date.now()-new Date(o.createdAt))/3600000;
        if(diffH>sla) alerts.push({type:'warning',title:'SLA Vencido: '+o.codigo,
          msg:'Aberta ha '+Math.round(diffH)+'h (SLA: '+sla+'h)',time:o.createdAt,id:o.id});
      }
    });

    var semMot2 = (await DB.getAll(DB.KEYS.REENTREGAS)).filter(function(r){
      return !r.arquivado && !r.motoristaSecundario && !['RESOLVIDA','CANCELADA'].includes(r.status);
    });
    semMot2.forEach(function(r){
      var alertId = 'reet-semMot2-'+r.id;
      alerts.push({
        type:'warning',
        title:'Reentrega sem Motorista Secundário: '+r.codigo,
        msg:(r.cliente||'') + ' — ' + (r.motivo||''),
        time: r.createdAt,
        id: alertId,
        action: 'ReentregasPage.editarMotoristaSecundario(\'' + r.id + '\')',
        actionLabel: 'Definir',
      });
    });
    alerts.sort(function(a,b){return new Date(b.time)-new Date(a.time);});
    var cntEl=document.getElementById('alertas-count');
    if(cntEl) cntEl.textContent='('+alerts.length+' alertas)';
    if(!alerts.length){
      el.innerHTML='<div style="text-align:center;padding:48px;color:var(--text-muted)">'+Icons.svg('check',40)+'<br><br>Nenhum alerta ativo no momento</div>';
      return;
    }
    el.innerHTML=alerts.map(function(a){
      var unread=!read.includes(a.id)?'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--danger);vertical-align:middle;margin-left:4px"></span>':'';
      var actionBtn = a.action
        ? '<button class="btn btn-primary btn-sm" onclick="'+a.action+'" style="white-space:nowrap;margin-left:4px">' + (a.actionLabel||'Ação') + '</button>'
        : '';
      return '<div class="alert-item '+a.type+'">'
        +'<div class="alert-icon '+a.type+'">'+Icons.svg('alert',16)+'</div>'
        +'<div class="alert-content">'
        +'<div class="alert-title">'+a.title+unread+'</div>'
        +'<div class="alert-msg">'+a.msg+'</div>'
        +'</div>'
        +'<span class="alert-time">'+fmtRelative(a.time)+'</span>'
        + actionBtn
        +'<button class="btn btn-ghost btn-sm" onclick="AlertasPage.marcarLido(\''+a.id+'\')" style="white-space:nowrap">Marcar lido</button>'
        +'</div>';
    }).join('');
  },
  async marcarLido(id) {
    var read=(await DB.get(DB.KEYS.ALERTS_READ))||[];
    if(!read.includes(id)) read.push(id);
    DB.set(DB.KEYS.ALERTS_READ,read);
    await App.updateAlertBadge(); await App.renderSidebar(); await this.load();
    Toast.info('Alerta marcado como lido');
  },
  async marcarTodos() {
    var ids=(await DB.getAll(DB.KEYS.OCORRENCIAS)).map(function(o){return o.id;});
    DB.set(DB.KEYS.ALERTS_READ,ids);
    await App.updateAlertBadge(); await App.renderSidebar(); await this.load();
    Toast.success('Todos os alertas marcados como lidos');
  },
};

// -- Metas ------------------------------------------------------
const MetasPage = {
  async load() {
    const metas=await DB.getAll(DB.KEYS.METAS);
    const el=document.getElementById('metas-list');
    if(!el) return;
    if(!metas.length){el.innerHTML='<p style="text-align:center;padding:32px;color:var(--text-muted)">Nenhuma meta cadastrada</p>';return;}
    const smap={EM_ANDAMENTO:'andamento',ATINGIDA:'resolvida',NAO_ATINGIDA:'critica',CANCELADA:'cancelada'};
    const slbl={EM_ANDAMENTO:'Em Andamento',ATINGIDA:'Atingida',NAO_ATINGIDA:'Nao Atingida',CANCELADA:'Cancelada'};
    el.innerHTML=metas.map(function(m){
      var pct=m.valorAlvo>0?Math.min(100,Math.round(m.valorAtual/m.valorAlvo*100)):0;
      var bar=m.status==='ATINGIDA'?'green':m.status==='NAO_ATINGIDA'?'red':'';
      var prazo=m.prazo?'<div style="font-size:11px;color:var(--text-muted);margin-top:8px">Prazo: '+fmtDate(m.prazo)+'</div>':'';
      return '<div class="card" style="margin-bottom:12px"><div class="card-body" style="padding:16px">'
        +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">'
        +'<div><div style="font-size:14px;font-weight:600">'+m.titulo+'</div>'
        +'<div style="font-size:12px;color:var(--text-secondary);margin-top:2px">'+(m.descricao||'')+'</div></div>'
        +'<span class="badge badge-'+(smap[m.status]||'aberta')+'">'+(slbl[m.status]||m.status)+'</span>'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:12px">'
        +'<div class="progress" style="flex:1"><div class="progress-bar '+bar+'" style="width:'+pct+'%"></div></div>'
        +'<span style="font-size:12px;font-weight:600;min-width:36px;text-align:right">'+pct+'%</span>'
        +'<span style="font-size:12px;color:var(--text-secondary)">'+m.valorAtual+'/'+m.valorAlvo+' '+(m.unidade||'')+'</span>'
        +'</div>'+prazo+'</div></div>';
    }).join('');
  },
};

// -- Auditoria --------------------------------------------------
const AuditoriaPage = {
  page:1, perPage:25,
  async load() { this.page=1; await this.render(); },
  async render() {
    const logs=(await DB.getAll(DB.KEYS.LOGS)).sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});
    const tbody=document.getElementById('audit-tbody');
    if(!tbody) return;

    var ocArq = (await DB.getAll(DB.KEYS.OCORRENCIAS)).filter(function(o){return o.arquivado;});
    var rtArq = (await DB.getAll(DB.KEYS.REENTREGAS)).filter(function(r){return r.arquivado;});
    var infoEl = document.getElementById('audit-arquivados-info');
    if(infoEl) infoEl.innerHTML = ocArq.length+rtArq.length > 0
      ? '<div style="background:var(--bg-stripe);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--text-secondary)">'
        + Icons.svg('shield',14) + ' <strong style="color:var(--text-primary)">' + (ocArq.length+rtArq.length) + ' registro(s) arquivado(s)</strong> — '
        + ocArq.length + ' ocorrência(s) e ' + rtArq.length + ' reentrega(s) arquivada(s). Os dados são preservados permanentemente.'
        + '</div>'
      : '';

    const start=(this.page-1)*this.perPage;
    const slice=logs.slice(start,start+this.perPage);
    if(!slice.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum log registrado</td></tr>';return;}
    tbody.innerHTML=slice.map(function(l){
      return '<tr><td><span style="font-size:12px">'+l.acao+'</span></td>'
        +'<td>'+(l.usuarioNome||'-')+'</td><td>'+(l.entidade||'-')+'</td>'
        +'<td>'+(l.ip||'-')+'</td><td style="font-size:12px">'+fmtDateTime(l.createdAt)+'</td></tr>';
    }).join('');
    renderPagination('audit-pagination',logs.length,this.page,this.perPage,function(p){AuditoriaPage.page=p;AuditoriaPage.render();});
  },
};

// -- Configuracoes ----------------------------------------------
const ConfiguracoesPage = {
  async load() {
    const cfg=await DB.getConfig();
    var set=function(id,v){var e=document.getElementById(id);if(!e)return;if(e.type==='checkbox')e.checked=!!v;else e.value=v||'';};
    set('cfg-empresa',cfg.empresa); set('cfg-cnpj',cfg.cnpj);
    set('cfg-telefone',cfg.telefone); set('cfg-email',cfg.email);
    set('cfg-endereco',cfg.endereco); set('cfg-sla',cfg.slaHoras||24);
    set('cfg-sla-alerta',cfg.slaAlerta||80); set('cfg-paginacao',cfg.paginacao||20);
    set('cfg-notif-email',cfg.notifEmail); set('cfg-notif-sonoro',cfg.notifSonoro);
    set('cfg-tema',cfg.tema||'light');
    await ConfiguracoesPage.renderFrotaInfo();
  },
  async salvar() {
    var get=function(id){var e=document.getElementById(id);if(!e)return null;return e.type==='checkbox'?e.checked:e.value;};
    var cfg={
      empresa:get('cfg-empresa'),cnpj:get('cfg-cnpj'),
      telefone:get('cfg-telefone'),email:get('cfg-email'),
      endereco:get('cfg-endereco'),slaHoras:parseInt(get('cfg-sla'))||24,
      slaAlerta:parseInt(get('cfg-sla-alerta'))||80,paginacao:parseInt(get('cfg-paginacao'))||20,
      notifEmail:get('cfg-notif-email'),notifSonoro:get('cfg-notif-sonoro'),
      tema:get('cfg-tema'),
    };
    await DB.setConfig(cfg);
    Theme.apply(cfg.tema);
    await logAction('EDICAO','Configuracoes','sistema');
    Toast.success('Configuracoes salvas com sucesso!');
  },
};

// ---------------------------------------------------------------
// Importacao de Frota (extensao de ConfiguracoesPage) — agora via Supabase
// ---------------------------------------------------------------
ConfiguracoesPage.renderFrotaInfo = async function() {
  var lista = getMotoristasAtivos();
  var importada = lista !== MOTORISTAS_PADRAO;
  var fonte = importada ? 'Planilha importada (compartilhada com todos os usuários)' : 'Lista padrao (Frota_ATUALIZADA.xlsx)';
  var el = document.getElementById('frota-info');
  if (!el) return;
  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div style="display:flex;align-items:center;gap:8px">'
        + '<div style="width:10px;height:10px;border-radius:50%;background:var(--success)"></div>'
        + '<span style="font-size:13px;font-weight:600">' + lista.length + ' motoristas carregados</span>'
      + '</div>'
      + '<span style="font-size:12px;color:var(--text-secondary)">Fonte: ' + fonte + '</span>'
      + (importada ? '<button class="btn btn-ghost btn-sm" onclick="ConfiguracoesPage.limparFrotaImportada()" style="margin-left:auto;color:var(--danger)">Remover importacao</button>' : '')
    + '</div>';
};

ConfiguracoesPage.importarFrota = function() {
  var input = document.getElementById('frota-file');
  if (!input || !input.files || !input.files[0]) {
    Toast.warning('Selecione um arquivo Excel (.xlsx) ou CSV');
    return;
  }
  var file = input.files[0];
  var ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    ConfiguracoesPage._importarCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    ConfiguracoesPage._importarXLSX(file);
  } else {
    Toast.error('Formato nao suportado. Use .xlsx ou .csv');
  }
};

ConfiguracoesPage._salvarFrotaNoBanco = async function(motoristas) {
  await MotoristasDB.replaceAll(motoristas);
  await refreshMotoristasImportados();
  Toast.success(motoristas.length + ' motoristas importados e disponíveis para TODOS os usuários!');
  await ConfiguracoesPage.renderFrotaInfo();
  await logAction('EDICAO','Frota','importacao');
  var f1=document.getElementById('frota-file'); if(f1) f1.value='';
  var f2=document.getElementById('frota-preview'); if(f2) f2.innerHTML='';
};

ConfiguracoesPage._importarCSV = function(file) {
  var reader = new FileReader();
  reader.onload = async function(e) {
    var text = e.target.result;
    var lines = text.split(/\r?\n/).filter(function(l){ return l.trim(); });
    var motoristas = [];
    lines.forEach(function(line) {
      var parts = line.split(/[,;\t]/);
      var cod = (parts[0]||'').trim().replace(/['"]/g,'');
      var nome = (parts[1]||'').trim().replace(/['"]/g,'');
      if (!cod || !nome) return;
      if (isNaN(parseInt(cod))) return;
      if (!motoristas.find(function(m){ return m.codigo === cod; })) {
        motoristas.push({ codigo: cod, nome: nome.toUpperCase() });
      }
    });
    motoristas.sort(function(a,b){ return parseInt(a.codigo)-parseInt(b.codigo); });
    if (motoristas.length === 0) { Toast.error('Nenhum motorista encontrado no arquivo. Verifique o formato.'); return; }
    try {
      await ConfiguracoesPage._salvarFrotaNoBanco(motoristas);
    } catch(err) {
      Toast.error('Erro ao salvar frota no banco: ' + err.message);
    }
  };
  reader.readAsText(file, 'UTF-8');
};

ConfiguracoesPage._importarXLSX = function(file) {
  if (typeof XLSX !== 'undefined') {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var wb = XLSX.read(e.target.result, { type: 'binary' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        var motoristas = [];
        data.forEach(function(row) {
          var cod = String(row[0]||'').trim();
          var nome = String(row[1]||'').trim();
          if (!cod || !nome) return;
          if (isNaN(parseInt(cod))) return;
          if (!motoristas.find(function(m){ return m.codigo === cod; })) {
            motoristas.push({ codigo: cod, nome: nome.toUpperCase() });
          }
        });
        motoristas.sort(function(a,b){ return parseInt(a.codigo)-parseInt(b.codigo); });
        if (motoristas.length === 0) { Toast.error('Nenhum motorista encontrado.'); return; }
        await ConfiguracoesPage._salvarFrotaNoBanco(motoristas);
      } catch(err) {
        Toast.error('Erro ao ler o arquivo Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  } else {
    Toast.warning('Para importar XLSX, exporte como CSV (UTF-8) no Excel e tente novamente. Ou use o botao "Como exportar CSV".');
    ConfiguracoesPage._mostrarInstrucoes();
  }
};

ConfiguracoesPage._mostrarInstrucoes = function() {
  var el = document.getElementById('frota-preview');
  if (!el) return;
  el.innerHTML =
    '<div style="background:var(--bg-stripe);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-top:8px;font-size:12px;color:var(--text-secondary)">'
    + '<strong style="color:var(--text-primary)">Como exportar CSV do Excel:</strong><br>'
    + '1. Abra o arquivo no Excel<br>'
    + '2. Arquivo > Salvar como<br>'
    + '3. Tipo: CSV UTF-8 (delimitado por virgulas)<br>'
    + '4. Certifique-se que a coluna A = Codigo e coluna B = Nome<br>'
    + '5. Importe o arquivo CSV aqui'
    + '</div>';
};

ConfiguracoesPage.previewFrota = function(input) {
  var el = document.getElementById('frota-preview');
  if (!el || !input.files || !input.files[0]) return;
  var file = input.files[0];
  el.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);margin-top:6px">'
    + 'Arquivo selecionado: <strong>' + file.name + '</strong> (' + (file.size/1024).toFixed(1) + ' KB)'
    + '</div>';
};

ConfiguracoesPage.limparFrotaImportada = function() {
  confirmDialog('Remover importacao', 'A lista voltara a usar os dados padrao da planilha original para TODOS os usuários. Continuar?', async function() {
    await MotoristasDB.replaceAll([]);
    await refreshMotoristasImportados();
    Toast.success('Importacao removida. Usando lista padrao.');
    await ConfiguracoesPage.renderFrotaInfo();
  }, false);
};

// ── Página de Arquivados ───────────────────────────────────────
var ArquivadosPage = {
  page:1, perPage:20, filtroTipo:'todos',

  async load(){
    this.page=1;
    this._renderTabs();
    await this.render();
  },

  _renderTabs(){
    var el=document.getElementById('arq-tabs'); if(!el) return;
    var tipos=[['todos','Todos'],['ocorrencia','Ocorrências'],['reentrega','Reentregas'],['sobra-falta','Sobras/Faltas']];
    var self=this;
    el.innerHTML='<div class="tabs" style="margin-bottom:0">'
      +tipos.map(function(t){
        return '<div class="tab-btn'+(self.filtroTipo===t[0]?' active':'')+'" onclick="ArquivadosPage._setTipo(\''+t[0]+'\')">'+t[1]+'</div>';
      }).join('')
      +'</div>';
  },

  async _setTipo(tipo){
    this.filtroTipo=tipo; this.page=1;
    this._renderTabs(); await this.render();
  },

  async _getAll(){
    var all=[];
    var keys={
      'ocorrencia': DB.KEYS.OCORRENCIAS,
      'reentrega':  DB.KEYS.REENTREGAS,
      'sobra-falta':DB.KEYS.SOBRAS_FALTAS,
    };
    if(this.filtroTipo==='todos'){
      for (var tipo in keys) {
        var arr = (await DB.getAll(keys[tipo])).filter(function(r){return r.arquivado;});
        arr.forEach(function(r){ r._tipoEntidade = tipo; all.push(r); });
      }
    } else {
      var k=keys[this.filtroTipo];
      if(k) {
        var arr2 = (await DB.getAll(k)).filter(function(r){return r.arquivado;});
        var tipoAtual = this.filtroTipo;
        arr2.forEach(function(r){ r._tipoEntidade = tipoAtual; all.push(r); });
      }
    }
    return all.sort(function(a,b){return new Date(b.arquivadoEm||b.updatedAt)-new Date(a.arquivadoEm||a.updatedAt);});
  },

  _keyByTipo(tipo){
    return {ocorrencia:DB.KEYS.OCORRENCIAS,reentrega:DB.KEYS.REENTREGAS,'sobra-falta':DB.KEYS.SOBRAS_FALTAS}[tipo];
  },

  async render(){
    var all=await this._getAll();
    var start=(this.page-1)*this.perPage;
    var slice=all.slice(start,start+this.perPage);
    var tbody=document.getElementById('arq-tbody');
    var cntEl=document.getElementById('arq-count');
    if(cntEl) cntEl.textContent=all.length+' registro'+(all.length!==1?'s':'')+' arquivados';
    if(!tbody) return;
    var isAdminUser= await isAdmin();

    if(!slice.length){
      tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="opacity:.3;margin-bottom:8px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>Nenhum registro arquivado</p></td></tr>';
      renderPagination('arq-pagination',0,1,this.perPage,function(){});
      return;
    }

    tbody.innerHTML=slice.map(function(r){
      var tipoLabel={ocorrencia:'Ocorrência',reentrega:'Reentrega','sobra-falta':'Sobra/Falta'}[r._tipoEntidade]||r._tipoEntidade;
      return '<tr>'
        +'<td><span class="td-code">'+(r.codigo||r.id)+'</span></td>'
        +'<td><span class="badge badge-cancelada">'+tipoLabel+'</span></td>'
        +'<td>'+(r.cliente||'—')+'</td>'
        +'<td>'+fmtDate(r.createdAt)+'</td>'
        +'<td>'+(r.arquivadoPor||'—')+'</td>'
        +'<td>'+fmtDateTime(r.arquivadoEm)+'</td>'
        +'<td><div class="td-actions">'
          +'<button class="btn btn-success btn-sm" onclick="ArquivadosPage.restaurar(\''+r._tipoEntidade+'\',\''+r.id+'\')" title="Restaurar">Restaurar</button>'
          +(isAdminUser?'<button class="btn btn-danger btn-sm" onclick="ArquivadosPage.excluirDefinitivo(\''+r._tipoEntidade+'\',\''+r.id+'\')" title="Excluir definitivamente">Excluir</button>':'')
        +'</div></td>'
        +'</tr>';
    }).join('');

    var self=this;
    renderPagination('arq-pagination',all.length,this.page,this.perPage,function(p){self.page=p;self.render();});
  },

  restaurar(tipo,id){
    var key=this._keyByTipo(tipo); if(!key) return;
    var self=this;
    DB.find(key,id).then(function(r){
      if(!r) return;
      confirmDialog('Restaurar registro','O registro '+(r.codigo||id)+' será restaurado e voltará à listagem normal.', async function(){
        await DB.restore(key,id);
        await logAction('RESTAURACAO',tipo,id);
        Toast.success('Registro restaurado com sucesso!');
        await self.render();
        await App.updateAlertBadge();
      },false);
    });
  },

  excluirDefinitivo(tipo,id){
    var self=this;
    isAdmin().then(function(canDelete){
      if(!canDelete){ Toast.error('Apenas Administradores podem excluir definitivamente.'); return; }
      var key=self._keyByTipo(tipo); if(!key) return;
      DB.find(key,id).then(function(r){
        if(!r) return;
        confirmDialog(
          '⚠️ Excluir Definitivamente',
          'Esta ação é IRREVERSÍVEL. O registro '+(r.codigo||id)+' e todo seu histórico operacional serão removidos permanentemente. Um log administrativo será mantido. Confirmar?',
          async function(){
            await logAction('EXCLUSAO_DEFINITIVA — '+JSON.stringify({codigo:r.codigo,cliente:r.cliente,tipo:tipo}),tipo,id);
            await DB.hardDelete(key,id);
            Toast.success('Registro excluído definitivamente.');
            await self.render();
            await App.updateAlertBadge();
          },
          true
        );
      });
    });
  },
};

// ── Cadastros (Motoristas e Tipos de Ocorrência) ──────────────
var CadastrosPage = {
  tab: 'motoristas',

  async load() {
    this._renderTabs();
    await this._renderTab();
  },

  _renderTabs() {
    var el = document.getElementById('cad-tabs'); if (!el) return;
    var self = this;
    el.innerHTML = '<div class="tabs" style="margin-bottom:0">'
      + ['motoristas','tipos','tratativas'].map(function(t){
          var label = t==='motoristas'?'Motoristas':t==='tipos'?'Tipos de Ocorrência':'Tratativas';
          return '<div class="tab-btn'+(self.tab===t?' active':'')+'" onclick="CadastrosPage._setTab(\''+t+'\')">'+label+'</div>';
        }).join('')
      + '</div>';
  },

  async _setTab(t) {
    this.tab = t;
    this._renderTabs();
    await this._renderTab();
  },

  async _renderTab() {
    var el = document.getElementById('cad-content'); if (!el) return;
    if (this.tab === 'motoristas') {
      await this._renderMotoristas(el);
    } else if (this.tab === 'tipos') {
      await this._renderTipos(el);
    } else {
      await this._renderTratativas(el);
    }
  },

  // ── Sub-tab: Motoristas CRUD ─────────────────────────────────
  async _renderMotoristas(container) {
    var motoristas = (await DB.getAll(DB.KEYS.MOTORISTAS_CADASTRO))
      .filter(function(m){ return m.ativo !== false; })
      .sort(function(a,b){ return (a.codigo||'').localeCompare(b.codigo||'', undefined, {numeric:true}); });

    container.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
        + '<span style="font-size:13px;color:var(--text-secondary)">'+motoristas.length+' motorista(s) cadastrado(s)</span>'
        + '<button class="btn btn-primary btn-sm" onclick="CadastrosPage.novoMotorista()">'+Icons.svg('plus',14)+' Novo Motorista</button>'
      + '</div>'
      + '<div class="table-wrapper"><table class="table"><thead><tr>'
        + '<th>Código</th><th>Nome</th><th>CPF</th><th>Telefone</th><th>Ações</th>'
      + '</tr></thead><tbody>'
      + (motoristas.length ? motoristas.map(function(m){
          return '<tr>'
            + '<td><span class="td-code">'+m.codigo+'</span></td>'
            + '<td>'+m.nome+'</td>'
            + '<td>'+(m.cpf||'—')+'</td>'
            + '<td>'+(m.telefone||'—')+'</td>'
            + '<td><div class="td-actions">'
              + '<button class="btn btn-ghost btn-icon btn-sm" onclick="CadastrosPage.editarMotorista(\''+m.id+'\')">'+Icons.svg('edit',14)+'</button>'
              + '<button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="CadastrosPage.excluirMotorista(\''+m.id+'\')">'+Icons.svg('trash',14)+'</button>'
            + '</div></td>'
            + '</tr>';
        }).join('') : '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum motorista cadastrado</td></tr>')
      + '</tbody></table></div>';
  },

  novoMotorista() { this._abrirModalMotorista(null); },
  async editarMotorista(id) {
    var m = await DB.find(DB.KEYS.MOTORISTAS_CADASTRO, id);
    this._abrirModalMotorista(m);
  },
  _abrirModalMotorista(m) {
    var old = document.getElementById('cad-motorista-modal'); if (old) old.remove();
    var modal = document.createElement('div');
    modal.id = 'cad-motorista-modal';
    modal.className = 'modal-overlay open';
    modal.innerHTML = '<div class="modal modal-sm">'
      + '<div class="modal-header"><span class="modal-title">'+(m?'Editar':'Novo')+' Motorista</span>'
        + '<button class="modal-close" onclick="document.getElementById(\'cad-motorista-modal\').remove()" style="background:none;border:none;cursor:pointer;display:flex;color:var(--text-secondary)">'+Icons.svg('x',16)+'</button>'
      + '</div>'
      + '<div class="modal-body">'
        + '<input type="hidden" id="cadm-id" value="'+(m?m.id:'')+'">'
        + '<div class="form-group"><label>Código *</label><input class="input" id="cadm-codigo" value="'+(m?m.codigo||'':'')+'" placeholder="Ex: 2278"></div>'
        + '<div class="form-group"><label>Nome *</label><input class="input" id="cadm-nome" value="'+(m?m.nome||'':'')+'" placeholder="Nome completo em maiúsculas"></div>'
        + '<div class="form-group"><label>CPF</label><input class="input" id="cadm-cpf" value="'+(m?m.cpf||'':'')+'" placeholder="000.000.000-00"></div>'
        + '<div class="form-group"><label>Telefone</label><input class="input" id="cadm-tel" value="'+(m?m.telefone||'':'')+'" placeholder="(11) 99999-9999"></div>'
      + '</div>'
      + '<div class="modal-footer">'
        + '<button class="btn btn-secondary" onclick="document.getElementById(\'cad-motorista-modal\').remove()">Cancelar</button>'
        + '<button class="btn btn-primary" onclick="CadastrosPage.salvarMotorista()">Salvar</button>'
      + '</div></div>';
    document.body.appendChild(modal);
  },
  async salvarMotorista() {
    var id     = document.getElementById('cadm-id')?.value||'';
    var codigo = document.getElementById('cadm-codigo')?.value?.trim()||'';
    var nome   = document.getElementById('cadm-nome')?.value?.trim().toUpperCase()||'';
    if (!codigo || !nome) { Toast.warning('Código e Nome são obrigatórios'); return; }
    var data = { codigo, nome, cpf: document.getElementById('cadm-cpf')?.value||'', telefone: document.getElementById('cadm-tel')?.value||'', ativo: true };
    if (id) {
      await DB.update(DB.KEYS.MOTORISTAS_CADASTRO, id, data);
      Toast.success('Motorista atualizado!');
    } else {
      await DB.insert(DB.KEYS.MOTORISTAS_CADASTRO, data);
      Toast.success('Motorista cadastrado!');
    }
    // Atualiza cache de motoristas importados
    await refreshMotoristasImportados();
    document.getElementById('cad-motorista-modal')?.remove();
    await this._renderTab();
  },
  excluirMotorista(id) {
    var self = this;
    DB.find(DB.KEYS.MOTORISTAS_CADASTRO, id).then(function(m) {
      confirmDialog('Remover Motorista', 'Deseja remover o motorista '+m.nome+'?', async function(){
        await DB.update(DB.KEYS.MOTORISTAS_CADASTRO, id, {ativo:false});
        await refreshMotoristasImportados();
        Toast.success('Motorista removido.');
        await self._renderTab();
      });
    });
  },

  // ── Sub-tab: Tipos de Ocorrência CRUD ─────────────────────────
  async _renderTipos(container) {
    var tipos = (await DB.getAll(DB.KEYS.TIPOS_OCORRENCIA))
      .filter(function(t){ return t.ativo !== false; })
      .sort(function(a,b){ return (a.codigo||'').localeCompare(b.codigo||'', undefined, {numeric:true}); });

    container.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
        + '<span style="font-size:13px;color:var(--text-secondary)">'+tipos.length+' tipo(s) cadastrado(s)</span>'
        + '<button class="btn btn-primary btn-sm" onclick="CadastrosPage.novoTipo()">'+Icons.svg('plus',14)+' Novo Tipo</button>'
      + '</div>'
      + '<div class="table-wrapper"><table class="table"><thead><tr><th>Código</th><th>Descrição</th><th>Valor no sistema</th><th>Ações</th></tr></thead><tbody>'
      + (tipos.length ? tipos.map(function(t){
          return '<tr>'
            + '<td><span class="td-code">'+t.codigo+'</span></td>'
            + '<td>'+t.descricao+'</td>'
            + '<td style="font-size:11px;color:var(--text-muted)">'+t.codigo+' - '+t.descricao+'</td>'
            + '<td><div class="td-actions">'
              + '<button class="btn btn-ghost btn-icon btn-sm" onclick="CadastrosPage.editarTipo(\''+t.id+'\')">'+Icons.svg('edit',14)+'</button>'
              + '<button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="CadastrosPage.excluirTipo(\''+t.id+'\')">'+Icons.svg('trash',14)+'</button>'
            + '</div></td>'
            + '</tr>';
        }).join('') : '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhum tipo cadastrado no banco. Execute migration_v3.sql para popular.</td></tr>')
      + '</tbody></table></div>';
  },

  novoTipo() { this._abrirModalTipo(null); },
  async editarTipo(id) {
    var t = await DB.find(DB.KEYS.TIPOS_OCORRENCIA, id);
    this._abrirModalTipo(t);
  },
  _abrirModalTipo(t) {
    var old = document.getElementById('cad-tipo-modal'); if (old) old.remove();
    var modal = document.createElement('div');
    modal.id = 'cad-tipo-modal';
    modal.className = 'modal-overlay open';
    modal.innerHTML = '<div class="modal modal-sm">'
      + '<div class="modal-header"><span class="modal-title">'+(t?'Editar':'Novo')+' Tipo de Ocorrência</span>'
        + '<button class="modal-close" onclick="document.getElementById(\'cad-tipo-modal\').remove()" style="background:none;border:none;cursor:pointer;display:flex;color:var(--text-secondary)">'+Icons.svg('x',16)+'</button>'
      + '</div>'
      + '<div class="modal-body">'
        + '<input type="hidden" id="cadt-id" value="'+(t?t.id:'')+'">'
        + '<div class="form-group"><label>Código *</label><input class="input" id="cadt-codigo" value="'+(t?t.codigo||'':'')+'" placeholder="Ex: 042"><div class="form-hint">Use 3 dígitos. Não altere o código de um tipo existente.</div></div>'
        + '<div class="form-group"><label>Descrição *</label><input class="input" id="cadt-descricao" value="'+(t?t.descricao||'':'')+'" placeholder="Descrição do tipo de ocorrência"></div>'
      + '</div>'
      + '<div class="modal-footer">'
        + '<button class="btn btn-secondary" onclick="document.getElementById(\'cad-tipo-modal\').remove()">Cancelar</button>'
        + '<button class="btn btn-primary" onclick="CadastrosPage.salvarTipo()">Salvar</button>'
      + '</div></div>';
    document.body.appendChild(modal);
  },
  async salvarTipo() {
    var id       = document.getElementById('cadt-id')?.value||'';
    var codigo   = document.getElementById('cadt-codigo')?.value?.trim()||'';
    var descricao= document.getElementById('cadt-descricao')?.value?.trim()||'';
    if (!codigo || !descricao) { Toast.warning('Código e Descrição são obrigatórios'); return; }
    if (id) {
      await DB.update(DB.KEYS.TIPOS_OCORRENCIA, id, {codigo, descricao});
      Toast.success('Tipo atualizado!');
    } else {
      await DB.insert(DB.KEYS.TIPOS_OCORRENCIA, {codigo, descricao, ativo:true});
      Toast.success('Tipo cadastrado!');
    }
    await refreshTiposOcorrencia();
    document.getElementById('cad-tipo-modal')?.remove();
    await this._renderTab();
  },
  excluirTipo(id) {
    var self = this;
    DB.find(DB.KEYS.TIPOS_OCORRENCIA, id).then(function(t) {
      confirmDialog('Desativar Tipo', 'O tipo "'+t.codigo+' - '+t.descricao+'" será desativado (não aparecerá mais nas listas). Confirmar?', async function(){
        await DB.update(DB.KEYS.TIPOS_OCORRENCIA, id, {ativo:false});
        await refreshTiposOcorrencia();
        Toast.success('Tipo desativado.');
        await self._renderTab();
      });
    });
  },
};

// ── Sub-tab: Tratativas CRUD ────────────────────────────────────
// Extende CadastrosPage (já definido acima)
CadastrosPage._renderTratativas = async function(container) {
  var tratativas = (await DB.getAll(DB.KEYS.TRATATIVAS))
    .filter(function(t){ return t.ativo !== false; })
    .sort(function(a,b){ return a.nome.localeCompare(b.nome,'pt-BR'); });

  container.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
      + '<span style="font-size:13px;color:var(--text-secondary)">'+tratativas.length+' tratativa(s) cadastrada(s)</span>'
      + '<button class="btn btn-primary btn-sm" onclick="CadastrosPage.novaTratativa()">'+Icons.svg('plus',14)+' Nova Tratativa</button>'
    + '</div>'
    + '<div class="table-wrapper"><table class="table"><thead><tr><th>Nome</th><th>Ações</th></tr></thead><tbody>'
    + (tratativas.length
        ? tratativas.map(function(t){
            return '<tr>'
              + '<td><strong>'+t.nome+'</strong></td>'
              + '<td><div class="td-actions">'
                + '<button class="btn btn-ghost btn-icon btn-sm" onclick="CadastrosPage.editarTratativa(\''+t.id+'\')">'+Icons.svg('edit',14)+'</button>'
                + '<button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="CadastrosPage.excluirTratativa(\''+t.id+'\')">'+Icons.svg('trash',14)+'</button>'
              + '</div></td>'
              + '</tr>';
          }).join('')
        : '<tr><td colspan="2" style="text-align:center;padding:32px;color:var(--text-muted)">Nenhuma tratativa cadastrada</td></tr>')
    + '</tbody></table></div>';
};

CadastrosPage.novaTratativa = function() { CadastrosPage._abrirModalTratativa(null); };

CadastrosPage.editarTratativa = async function(id) {
  var t = await DB.find(DB.KEYS.TRATATIVAS, id);
  CadastrosPage._abrirModalTratativa(t);
};

CadastrosPage._abrirModalTratativa = function(t) {
  var old = document.getElementById('cad-tratativa-modal'); if (old) old.remove();
  var modal = document.createElement('div');
  modal.id = 'cad-tratativa-modal';
  modal.className = 'modal-overlay open';
  modal.innerHTML = '<div class="modal modal-sm">'
    + '<div class="modal-header"><span class="modal-title">'+(t?'Editar':'Nova')+' Tratativa</span>'
      + '<button class="modal-close" onclick="document.getElementById(\'cad-tratativa-modal\').remove()" style="background:none;border:none;cursor:pointer;display:flex;color:var(--text-secondary)">'+Icons.svg('x',16)+'</button>'
    + '</div>'
    + '<div class="modal-body">'
      + '<input type="hidden" id="cadt2-id" value="'+(t?t.id:'')+'">'
      + '<div class="form-group"><label>Nome *</label><input class="input" id="cadt2-nome" value="'+(t?t.nome||'':'')+'" placeholder="Ex: Comercial, Jurídico, Torre de Controle..."><div class="form-hint">Aparecerá automaticamente nos selects de Devoluções, Reentregas e Sobras/Faltas.</div></div>'
    + '</div>'
    + '<div class="modal-footer">'
      + '<button class="btn btn-secondary" onclick="document.getElementById(\'cad-tratativa-modal\').remove()">Cancelar</button>'
      + '<button class="btn btn-primary" onclick="CadastrosPage.salvarTratativa()">Salvar</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){ var e=document.getElementById('cadt2-nome'); if(e) e.focus(); }, 100);
};

CadastrosPage.salvarTratativa = async function() {
  var id   = document.getElementById('cadt2-id')?.value||'';
  var nome = document.getElementById('cadt2-nome')?.value?.trim()||'';
  if (!nome) { Toast.warning('Nome é obrigatório'); return; }
  if (id) {
    await DB.update(DB.KEYS.TRATATIVAS, id, { nome });
    Toast.success('Tratativa atualizada!');
  } else {
    await DB.insert(DB.KEYS.TRATATIVAS, { nome, ativo: true });
    Toast.success('Tratativa cadastrada!');
  }
  await refreshTratativas();
  document.getElementById('cad-tratativa-modal')?.remove();
  await CadastrosPage._renderTab();
};

CadastrosPage.excluirTratativa = function(id) {
  DB.find(DB.KEYS.TRATATIVAS, id).then(function(t) {
    confirmDialog('Remover Tratativa', 'Deseja remover "'+t.nome+'"? Registros existentes mantêm o valor salvo.', async function() {
      await DB.update(DB.KEYS.TRATATIVAS, id, { ativo: false });
      await refreshTratativas();
      Toast.success('Tratativa removida.');
      await CadastrosPage._renderTab();
    });
  });
};

