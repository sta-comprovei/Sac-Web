
// ===============================================================
// LogiTrack SAC — Módulo Sobras/Faltas (Erros de Conferência) — Supabase
// ===============================================================

var SobrasFaltasPage = {
  page: 1, perPage: 20, filters: {},

  async load() {
    this.page = 1; this.filters = {};
    this.renderFiltros(); await this.render();
  },

  async getFiltered() {
    var all = (await DB.getAll(DB.KEYS.SOBRAS_FALTAS)).filter(function(r){return !r.arquivado;});
    var f = this.filters;
    if(f.tipo)       all = all.filter(function(r){return r.tipo===f.tipo;});
    if(f.status)     all = all.filter(function(r){return r.status===f.status;});
    if(f.dataIni)    all = all.filter(function(r){return (r.data||r.createdAt)>=f.dataIni;});
    if(f.dataFim)    all = all.filter(function(r){return (r.data||r.createdAt)<=(f.dataFim+'T23:59:59');});
    if(f.origemDiv) all=all.filter(function(r){return r.origemDivergencia===f.origemDiv;});
    if(f.tratativa)  all=all.filter(function(r){return r.tratativaCom===f.tratativa;});
    if(f.busca) {
      var b = f.busca.toLowerCase();
      all = all.filter(function(r){
        return (r.codigo||'').toLowerCase().includes(b)
          ||(r.cliente||'').toLowerCase().includes(b)
          ||(r.motorista||'').toLowerCase().includes(b)
          ||(r.conferente||'').toLowerCase().includes(b)
          ||(r.notaFiscal||'').toLowerCase().includes(b)
          ||(r.produto||'').toLowerCase().includes(b)
          ||(r.numCarregamento||'').toLowerCase().includes(b);
      });
    }
    return all.sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});
  },

  renderFiltros() {
    var el = document.getElementById('sf-filters');
    if(!el) return;
    var self = this;
    el.innerHTML =
      '<div class="input-group" style="flex:1;min-width:200px">'
        +'<span class="input-icon">'+Icons.svg('search',15)+'</span>'
        +'<input class="input" id="sf-busca" placeholder="Código, cliente, NF, produto..." style="height:34px;font-size:12.5px">'
      +'</div>'
      +'<select class="select" id="sf-tipo" style="height:34px;font-size:12.5px;width:auto">'
        +'<option value="">Sobras e Faltas</option>'
        +'<option value="SOBRA">Sobra</option>'
        +'<option value="FALTA">Falta</option>'
      +'</select>'
      +'<select class="select" id="sf-status" style="height:34px;font-size:12.5px;width:auto">'
        +'<option value="">Todos os status</option>'
        +'<option value="ABERTA">Aberta</option>'
        +'<option value="EM_ANDAMENTO">Em Andamento</option>'
        +'<option value="RESOLVIDA">Resolvida</option>'
        +'<option value="CANCELADA">Cancelada</option>'
      +'</select>'
      +'<input type="date" class="input" id="sf-data-ini" style="height:34px;font-size:12.5px;width:auto" title="Data inicial">'
      +'<input type="date" class="input" id="sf-data-fim" style="height:34px;font-size:12.5px;width:auto" title="Data final">'
      +'<select class="select" id="sf-origem-div" style="height:34px;font-size:12.5px;width:auto">'+'<option value="">Todas origens</option>'+'<option value="Motorista">Motorista</option>'+'<option value="Conferente">Conferente</option>'+'<option value="Operacional">Operacional</option>'+'<option value="Cliente">Cliente</option>'+'<option value="Em análise">Em análise</option>'+'</select>'+'<select class="select" id="sf-tratativa" style="height:34px;font-size:12.5px;width:auto">'
+'<option value="">Todas tratativas</option>'
+TRATATIVAS_CONFIG.map(function(t){return '<option value="'+t.nome+'">'+t.nome+'</option>';}).join('')
+'</select>'
+'<button class="btn btn-ghost btn-sm" id="sf-clear">'+Icons.svg('refresh',14)+'</button>';

    ['sf-busca','sf-tipo','sf-status','sf-data-ini','sf-data-fim','sf-origem-div','sf-tratativa'].forEach(function(id){
      var inp=document.getElementById(id); if(!inp) return;
      inp.addEventListener(id==='sf-busca'?'input':'change', async function(){
        self.filters={
          busca:   document.getElementById('sf-busca')?.value||'',
          tipo:    document.getElementById('sf-tipo')?.value||'',
          status:  document.getElementById('sf-status')?.value||'',
          dataIni: document.getElementById('sf-data-ini')?.value||'',
          dataFim: document.getElementById('sf-data-fim')?.value||'',
          origemDiv: document.getElementById('sf-origem-div')?.value||'',
          tratativa: document.getElementById('sf-tratativa')?.value||'',
        };
        self.page=1; await self.render();
      });
    });
    document.getElementById('sf-clear')?.addEventListener('click', async function(){
      self.filters={}; self.page=1;
      el.querySelectorAll('input,select').forEach(function(e){e.value='';});
      await self.render();
    });
  },

  async render() {
    var all   = await this.getFiltered();
    var start = (this.page-1)*this.perPage;
    var slice = all.slice(start, start+this.perPage);
    var tbody = document.getElementById('sf-tbody');
    if(!tbody) return;
    var cntEl = document.getElementById('sf-count');
    if(cntEl) cntEl.textContent = all.length+' registro'+(all.length!==1?'s':'');

    if(!slice.length){
      tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">'
        +Icons.svg('filter',32)+'<br><br>Nenhum registro encontrado</td></tr>';
      renderPagination('sf-pagination',0,1,this.perPage,function(){});
      return;
    }
    var self=this;
    tbody.innerHTML=slice.map(function(r){
      var tipoBadge = r.tipo==='SOBRA'
        ? '<span class="badge" style="background:#d1fae5;color:#065f46">Sobra</span>'
        : '<span class="badge" style="background:#fee2e2;color:#b91c1c">Falta</span>';
      return '<tr>'
        +'<td><span class="td-code">'+r.codigo+'</span></td>'
        +'<td>'+tipoBadge+'</td>'
        +'<td>'+fmtDate(r.data||r.createdAt)+'</td>'
        +'<td>'+(r.cliente||'—')+'</td>'
        +'<td style="font-size:12px">'+(r.produto||'—')+'</td>'
        +'<td style="text-align:right">'+(r.quantidade||'—')+'</td>'
        +'<td>'+badgeStatus(r.status)+'</td>'
        +'<td style="font-size:12px">'+(r.conferente||'—')+'</td>'
        +'<td><div class="td-actions">'
          +'<button class="btn btn-ghost btn-icon btn-sm" title="Ver" onclick="SobrasFaltasPage.ver(\''+r.id+'\')">'+Icons.svg('eye',14)+'</button>'
          +'<button class="btn btn-ghost btn-icon btn-sm" title="Editar" onclick="SobrasFaltasPage.editar(\''+r.id+'\')">'+Icons.svg('edit',14)+'</button>'
          +'<button class="btn btn-ghost btn-icon btn-sm" title="Arquivar" style="color:var(--warning)" onclick="SobrasFaltasPage.arquivar(\''+r.id+'\')">'+Icons.svg('trash',14)+'</button>'
        +'</div></td>'
        +'</tr>';
    }).join('');
    renderPagination('sf-pagination',all.length,this.page,this.perPage,function(p){self.page=p;self.render();});
  },

  async ver(id) {
    var r=await DB.find(DB.KEYS.SOBRAS_FALTAS,id); if(!r) return;
    await refreshUsersCache();
    var resp=getUser(r.responsavelId);
    document.getElementById('modal-sf-ver-title').textContent=r.codigo;
    document.getElementById('modal-sf-ver-body').innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
        +'<div><label>Tipo</label><p>'+(r.tipo==='SOBRA'?'<span class="badge" style="background:#d1fae5;color:#065f46">Sobra</span>':'<span class="badge" style="background:#fee2e2;color:#b91c1c">Falta</span>')+'</p></div>'
        +'<div><label>Status</label><p>'+badgeStatus(r.status)+'</p></div>'
        +'<div><label>Data</label><p>'+fmtDate(r.data||r.createdAt)+'</p></div>'
        +'<div><label>Nº Carregamento</label><p>'+(r.numCarregamento||'—')+'</p></div>'
        +'<div><label>Nota Fiscal</label><p>'+(r.notaFiscal||'—')+'</p></div>'
        +'<div><label>Cliente</label><p>'+(r.cliente||'—')+'</p></div>'
        +'<div><label>Motorista</label><p>'+(r.motorista||'—')+'</p></div>'
        +'<div><label>Conferente</label><p>'+(r.conferente||'—')+'</p></div>'
        +'<div><label>Produto</label><p>'+(r.produto||'—')+'</p></div>'
        +'<div><label>Quantidade</label><p>'+(r.quantidade||'—')+'</p></div>'
        +'<div><label>Responsável</label><p>'+resp.nome+'</p></div>'
        +(r.origemDivergencia?'<div><label>Origem da Divergência</label><p>'+r.origemDivergencia+'</p></div>':'')
        +(r.tratativaCom?'<div><label>Tratativa com</label><p>'+r.tratativaCom+'</p></div>':'')
        +(r.observacoes?'<div style="grid-column:1/-1"><label>Observações</label><p>'+r.observacoes+'</p></div>':'')
        +'<div><label>Registrado em</label><p>'+fmtDateTime(r.createdAt)+'</p></div>'
        +'<div><label>Última atualização</label><p>'+fmtDateTime(r.updatedAt)+'</p></div>'
      +'</div>'
      +'<div class="divider"></div>'
      +'<div><label style="margin-bottom:10px;display:block">Timeline de Alterações</label>'
        +renderTimeline(r.historico)
      +'</div>';
    document.getElementById('modal-sf-ver-edit-btn').onclick=function(){Modal.close('modal-sf-ver');SobrasFaltasPage.editar(id);};
    Modal.open('modal-sf-ver');
  },

  async nova() {
    await this._fill(null);
    document.getElementById('sf-modal-title').textContent='Nova Sobra/Falta';
    document.getElementById('sf-form-id').value='';
    document.getElementById('sf-modal-status-row').style.display='none';
    Modal.open('modal-sobra-falta');
  },

  async editar(id) {
    var r=await DB.find(DB.KEYS.SOBRAS_FALTAS,id); if(!r) return;
    await this._fill(r);
    document.getElementById('sf-modal-title').textContent='Editar Sobra/Falta';
    document.getElementById('sf-form-id').value=id;
    document.getElementById('sf-modal-status-row').style.display='';
    Modal.open('modal-sobra-falta');
  },

  async _fill(r) {
    var users=(await DB.getAll(DB.KEYS.USERS)).filter(function(u){return u.ativo;});
    var selR=document.getElementById('sf-responsavel-sel');
    if(selR) selR.innerHTML='<option value="">Selecionar...</option>'
      +users.map(function(u){return '<option value="'+u.id+'"'+(r&&r.responsavelId===u.id?' selected':'')+'>' +u.nome+'</option>';}).join('');

    var set=function(id,v){var e=document.getElementById(id);if(e)e.value=v||'';};
    set('sf-tipo',       r?r.tipo:'FALTA');
    set('sf-status-sel', r?r.status:'ABERTA');
    set('sf-data',       r?(r.data||r.createdAt||'').split('T')[0]:'');
    set('sf-num-carr',   r?r.numCarregamento:'');
    set('sf-nf',         r?r.notaFiscal:'');
    set('sf-cliente',    r?r.cliente:'');
    set('sf-mot-cod',    r?r._motCod||'':'');
    set('sf-conferente', r?r.conferente:'');
    set('sf-produto',    r?r.produto:'');
    set('sf-qtd',        r?r.quantidade:'');
    set('sf-obs',        r?r.observacoes:'');
    set('sf-origem-div', r?r.origemDivergencia||'':'');
    var sfTC = document.getElementById('sf-tratativa-container');
    if(sfTC) sfTC.innerHTML = buildTratativaSelect('sf-tratativa-sel', r?r.tratativaCom||'':'');
    this._previewMot();
  },

  _previewMot() {
    var input=document.getElementById('sf-mot-cod');
    var preview=document.getElementById('sf-mot-preview');
    if(!input||!preview) return;
    var cod=input.value.trim();
    if(!cod){preview.textContent='';preview.style.color='';return;}
    var found=buscarMotoristaPorCodigo(cod);
    if(found){preview.textContent=found.display;preview.style.color='var(--success)';}
    else{preview.textContent='Código não encontrado';preview.style.color='var(--danger)';}
  },

  async salvar() {
    var id=document.getElementById('sf-form-id').value;
    var get=function(sid){return (document.getElementById(sid)||{}).value||'';};
    var tipo=get('sf-tipo'), cliente=get('sf-cliente'), produto=get('sf-produto');
    if(!tipo||!cliente.trim()||!produto.trim()){Toast.warning('Preencha Tipo, Cliente e Produto');return;}

    var motCod=get('sf-mot-cod').trim();
    var motFound=motCod?buscarMotoristaPorCodigo(motCod):null;
    var motorista=motFound?motFound.display:motCod;

    var user=Session.get();
    var data={
      tipo:tipo, status:get('sf-status-sel')||'ABERTA',
      data:get('sf-data')||(new Date().toISOString().split('T')[0]),
      numCarregamento:get('sf-num-carr'), notaFiscal:get('sf-nf'),
      cliente:cliente, motorista:motorista, _motCod:motCod,
      conferente:get('sf-conferente'), produto:produto,
      quantidade:get('sf-qtd'), responsavelId:get('sf-responsavel-sel') || null,
      observacoes:get('sf-obs'),
      origemDivergencia:get('sf-origem-div')||'',
      tratativaCom:get('sf-tratativa-sel')||'',
    };

    if(id) {
      var existing=await DB.find(DB.KEYS.SOBRAS_FALTAS,id);
      var hist=existing?existing.historico||[]:[];
      pushHistorico(hist,[
        ['Tipo',existing.tipo,data.tipo],['Status',existing.status,data.status],
        ['Cliente',existing.cliente,data.cliente],['Produto',existing.produto,data.produto],
        ['Quantidade',existing.quantidade,data.quantidade],
        ['Motorista',existing.motorista,data.motorista],
        ['Conferente',existing.conferente,data.conferente],
        ['Nota Fiscal',existing.notaFiscal,data.notaFiscal],
        ['Origem Divergencia',existing.origemDivergencia,data.origemDivergencia],
        ['Tratativa com',existing.tratativaCom,data.tratativaCom],
      ],user);
      data.historico=hist;
      await DB.update(DB.KEYS.SOBRAS_FALTAS,id,data);
      await logAction('EDICAO','SobraFalta',id);
      Toast.success('Registro atualizado!');
      (async function(eid, edata, eex) {
        var cod = eex.codigo||eid;
        await Notificacoes.criar({ modulo:'sobra_falta', tipo:'atualizacao', registroId:eid, registroCodigo:cod, titulo:'⚠️ Sobra/Falta '+cod+' atualizada', descricao:'Status: '+edata.status });
        if (edata.tratativaCom && edata.tratativaCom !== eex.tratativaCom) await Notificacoes.criar({ modulo:'tratativa', tipo:'tratativa', registroId:eid, registroCodigo:cod, titulo:'🔄 Tratativa alterada — '+cod, descricao:'De: '+(eex.tratativaCom||'—')+' → Para: '+edata.tratativaCom });
        if (edata.origemDivergencia && edata.origemDivergencia !== eex.origemDivergencia) await Notificacoes.criar({ modulo:'sobra_falta', tipo:'atualizacao', registroId:eid, registroCodigo:cod, titulo:'⚠️ Origem alterada — '+cod, descricao:'De: '+(eex.origemDivergencia||'—')+' → Para: '+edata.origemDivergencia });
      })(id, data, existing).catch(function(e){ console.warn('[Notif] sobra edit:', e.message); });
    } else {
      var cnt=(await DB.getAll(DB.KEYS.SOBRAS_FALTAS)).length+1;
      data.codigo=(tipo==='SOBRA'?'SB':'FT')+'-'+new Date().getFullYear()+'-'+String(cnt).padStart(4,'0');
      data.historico=[{data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:'Registro criado',campo:'',valorAnterior:'',novoValor:''}];
      var created = await DB.insert(DB.KEYS.SOBRAS_FALTAS,data);
      await logAction('CRIACAO','SobraFalta',created?created.id:'');
      Toast.success('Registro '+data.codigo+' criado!');
      if (created) await Notificacoes.criar({ modulo:'sobra_falta', tipo:'criacao', registroId:created.id, registroCodigo:data.codigo, titulo:'⚠️ Nova Sobra/Falta: '+data.codigo, descricao:(data.tipo||'')+(data.cliente?' · '+data.cliente:'') });
    }
    Modal.close('modal-sobra-falta');
    await this.render();
    await App.updateAlertBadge();
  },

  arquivar(id) {
    var self = this;
    DB.find(DB.KEYS.SOBRAS_FALTAS,id).then(function(r) {
      if(!r) return;
      confirmDialog('Arquivar Registro','O registro '+r.codigo+' será arquivado (não excluído). Continua disponível na Auditoria.', async function(){
        await DB.delete(DB.KEYS.SOBRAS_FALTAS,id); // soft-delete (registra histórico internamente)
        await logAction('ARQUIVAMENTO','SobraFalta',id);
        Toast.info('Arquivado. Disponível em Auditoria.');
        await self.render();
      });
    });
  },
};

