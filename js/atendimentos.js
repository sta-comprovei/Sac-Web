
// ===============================================================
// LogiTrack SAC — Módulo Atendimentos + Financeiro
// ===============================================================

var ATENDIMENTOS_STATUS = ['NOVO','EM_ATENDIMENTO','AGUARDANDO','FINALIZADO','CONVERTIDO'];
var STATUS_FINANCEIRO   = ['Pendente','Em Análise','Aprovado','Aguardando Pagamento','Pago','Cancelado'];
var FORMAS_PAGAMENTO    = ['PIX','TED','DOC','Depósito','Boleto','Cartão','Dinheiro','Crédito em Conta','Outro'];

function badgeAtendimento(s) {
  var m = {NOVO:'aberta',EM_ATENDIMENTO:'andamento',AGUARDANDO:'aguardando',FINALIZADO:'resolvida',CONVERTIDO:'resolvida'};
  var l = {NOVO:'Novo',EM_ATENDIMENTO:'Em Atendimento',AGUARDANDO:'Aguardando',FINALIZADO:'Finalizado',CONVERTIDO:'Convertido'};
  return '<span class="badge badge-'+(m[s]||'aberta')+'">'+(l[s]||s)+'</span>';
}
function badgeFinanceiro(s) {
  var m = {'Pendente':'aberta','Em Análise':'andamento','Aprovado':'resolvida','Aguardando Pagamento':'aguardando','Pago':'resolvida','Cancelado':'cancelada'};
  return s ? '<span class="badge badge-'+(m[s]||'aberta')+'">'+s+'</span>' : '<span class="badge badge-aberta">Pendente</span>';
}
function fmtDuracao(ms) {
  if (!ms && ms !== 0) return '—';
  var m = Math.floor(ms / 60000);
  if (m < 60) return m + 'min';
  var h = Math.floor(m / 60), rm = m % 60;
  return h + 'h' + (rm > 0 ? rm + 'min' : '');
}

var AtendimentosPage = {
  page: 1, perPage: 20, filters: {},

  async load() {
    this.page = 1; this.filters = {};
    await this.renderFilters();
    await this.render();
  },

  async renderFilters() {
    var el = document.getElementById('at-filters'); if (!el) return;
    var users = (await DB.getAll(DB.KEYS.USERS)).filter(function(u){ return u.ativo; });
    var self = this;
    el.innerHTML =
      '<div class="input-group" style="flex:1;min-width:180px">'
        + '<span class="input-icon">'+Icons.svg('search',15)+'</span>'
        + '<input class="input" id="at-busca" placeholder="Contato, assunto..." style="height:34px;font-size:12.5px">'
      + '</div>'
      + '<select class="select" id="at-status" style="height:34px;font-size:12.5px;width:auto">'
        + '<option value="">Status</option>'
        + ATENDIMENTOS_STATUS.map(function(s){ return '<option value="'+s+'">'+s.replace('_',' ')+'</option>'; }).join('')
      + '</select>'
      + '<select class="select" id="at-status-fin" style="height:34px;font-size:12.5px;width:auto">'
        + '<option value="">Status Financeiro</option>'
        + STATUS_FINANCEIRO.map(function(s){ return '<option value="'+s+'">'+s+'</option>'; }).join('')
      + '</select>'
      + '<select class="select" id="at-forma-pag" style="height:34px;font-size:12.5px;width:auto">'
        + '<option value="">Forma de Pagamento</option>'
        + FORMAS_PAGAMENTO.map(function(s){ return '<option value="'+s+'">'+s+'</option>'; }).join('')
      + '</select>'
      + '<input type="date" class="input" id="at-data-pag-ini" style="height:34px;font-size:12px;width:auto" title="Pagamento de">'
      + '<input type="date" class="input" id="at-data-pag-fim" style="height:34px;font-size:12px;width:auto" title="Pagamento até">'
      + '<button class="btn btn-ghost btn-sm" id="at-clear">'+Icons.svg('refresh',14)+'</button>';

    ['at-busca','at-status','at-status-fin','at-forma-pag','at-data-pag-ini','at-data-pag-fim'].forEach(function(id) {
      var inp = document.getElementById(id); if (!inp) return;
      inp.addEventListener(id==='at-busca'?'input':'change', async function() {
        self.filters = {
          busca:       (document.getElementById('at-busca')||{}).value||'',
          status:      (document.getElementById('at-status')||{}).value||'',
          statusFin:   (document.getElementById('at-status-fin')||{}).value||'',
          formaPag:    (document.getElementById('at-forma-pag')||{}).value||'',
          dataPagIni:  (document.getElementById('at-data-pag-ini')||{}).value||'',
          dataPagFim:  (document.getElementById('at-data-pag-fim')||{}).value||'',
        };
        self.page = 1; await self.render();
      });
    });
    document.getElementById('at-clear')?.addEventListener('click', async function() {
      self.filters = {}; self.page = 1;
      el.querySelectorAll('input,select').forEach(function(e){ e.value=''; });
      await self.render();
    });
  },

  async getFiltered() {
    var all = (await DB.getAll(DB.KEYS.ATENDIMENTOS)).filter(function(a){ return !a.arquivado; });
    var f = this.filters;
    if (f.status)    all = all.filter(function(a){ return a.status === f.status; });
    if (f.statusFin) all = all.filter(function(a){ return (a.statusFinanceiro||'Pendente') === f.statusFin; });
    if (f.formaPag)  all = all.filter(function(a){ return a.formaPagamento === f.formaPag; });
    if (f.dataPagIni) all = all.filter(function(a){ return a.dataPagamento && a.dataPagamento >= f.dataPagIni; });
    if (f.dataPagFim) all = all.filter(function(a){ return a.dataPagamento && a.dataPagamento <= f.dataPagFim; });
    if (f.busca) {
      var b = f.busca.toLowerCase();
      all = all.filter(function(a){
        return (a.contatoNome||'').toLowerCase().includes(b)
          || (a.assunto||'').toLowerCase().includes(b)
          || (a.codigo||'').toLowerCase().includes(b);
      });
    }
    return all.sort(function(a,b){ return new Date(b.createdAt)-new Date(a.createdAt); });
  },

  async render() {
    var all = await this.getFiltered();
    var start = (this.page-1) * this.perPage;
    var slice = all.slice(start, start + this.perPage);
    var tbody = document.getElementById('at-tbody');
    if (!tbody) return;
    var cntEl = document.getElementById('at-count');
    if (cntEl) cntEl.textContent = all.length + ' atendimento' + (all.length!==1?'s':'');

    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">'
        + Icons.svg('message',32) + '<br><br>Nenhum atendimento encontrado</td></tr>';
      renderPagination('at-pagination', 0, 1, this.perPage, function(){});
      return;
    }

    await refreshUsersCache();
    var self = this;
    tbody.innerHTML = slice.map(function(a) {
      var resp = getUser(a.responsavelId);
      var tempoResp = a.horaPrimeiraResp && a.horaAbertura
        ? fmtDuracao(new Date(a.horaPrimeiraResp)-new Date(a.horaAbertura)) : '—';
      var temOc = a.ocorrenciaId ? '<span style="color:var(--success)">'+Icons.svg('check',14)+'</span>' : '—';
      var valTotal = a.valorTotal != null && parseFloat(a.valorTotal) > 0
        ? '<span style="color:var(--success);font-weight:600">'+fmtMoney(a.valorTotal)+'</span>'
        : '—';
      return '<tr>'
        + '<td><span class="td-code">'+(a.codigo||a.id.slice(0,8))+'</span></td>'
        + '<td style="font-weight:500">'+(a.contatoNome||'—')+'</td>'
        + '<td style="font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(a.assunto||'—')+'</td>'
        + '<td>'+badgeAtendimento(a.status)+'</td>'
        + '<td>'+badgeFinanceiro(a.statusFinanceiro)+'</td>'
        + '<td style="font-size:12px">'+valTotal+'</td>'
        + '<td style="font-size:12px">'+(a.dataPagamento?fmtDate(a.dataPagamento):'—')+'</td>'
        + '<td style="font-size:12px">'+(resp.nome||'—')+'</td>'
        + '<td>'+temOc+'</td>'
        + '<td><div class="td-actions">'
          + '<button class="btn btn-ghost btn-icon btn-sm" title="Ver" onclick="AtendimentosPage.ver(\''+a.id+'\')">'+Icons.svg('eye',14)+'</button>'
          + '<button class="btn btn-ghost btn-icon btn-sm" title="Editar" onclick="AtendimentosPage.editar(\''+a.id+'\')">'+Icons.svg('edit',14)+'</button>'
          + (a.status!=='FINALIZADO'&&a.status!=='CONVERTIDO' ? '<button class="btn btn-ghost btn-icon btn-sm" title="Gerar Ocorrência" style="color:var(--brand-600)" onclick="AtendimentosPage.gerarOcorrencia(\''+a.id+'\')">'+Icons.svg('plus',14)+'</button>' : '')
          + '<button class="btn btn-ghost btn-icon btn-sm" title="Arquivar" style="color:var(--warning)" onclick="AtendimentosPage.arquivar(\''+a.id+'\')">'+Icons.svg('trash',14)+'</button>'
        + '</div></td>'
        + '</tr>';
    }).join('');

    renderPagination('at-pagination', all.length, this.page, this.perPage, function(p){ self.page=p; self.render(); });
  },

  // ── VER (com abas Geral / Financeiro) ────────────────────────
  async ver(id) {
    var a = await DB.find(DB.KEYS.ATENDIMENTOS, id); if (!a) return;
    await refreshUsersCache();
    var resp = getUser(a.responsavelId);
    var tempoResp = a.horaPrimeiraResp && a.horaAbertura
      ? fmtDuracao(new Date(a.horaPrimeiraResp)-new Date(a.horaAbertura)) : '—';
    var tempoTotal = a.horaEncerramento && a.horaAbertura
      ? fmtDuracao(new Date(a.horaEncerramento)-new Date(a.horaAbertura)) : '—';

    document.getElementById('modal-at-ver-title').textContent = a.contatoNome || 'Atendimento';
    document.getElementById('modal-at-ver-body').innerHTML =
      // Abas
      '<div class="tabs" style="margin-bottom:16px">'
        + '<div class="tab-btn active" id="at-ver-tab-geral" onclick="AtendimentosPage._switchVerTab(\'geral\')">Atendimento</div>'
        + '<div class="tab-btn" id="at-ver-tab-fin" onclick="AtendimentosPage._switchVerTab(\'fin\')">💰 Financeiro</div>'
        + '<div class="tab-btn" id="at-ver-tab-hist" onclick="AtendimentosPage._switchVerTab(\'hist\')">Histórico</div>'
      + '</div>'

      // ABA GERAL
      + '<div id="at-ver-panel-geral">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
          + '<div><label>Contato</label><p>'+(a.contatoNome||'—')+'</p></div>'
          + '<div><label>Status</label><p>'+badgeAtendimento(a.status)+'</p></div>'
          + '<div><label>Data</label><p>'+fmtDate(a.data||a.createdAt)+'</p></div>'
          + '<div><label>Responsável</label><p>'+resp.nome+'</p></div>'
          + '<div style="grid-column:1/-1"><label>Assunto</label><p style="font-weight:500">'+(a.assunto||'—')+'</p></div>'
          + (a.descricao?'<div style="grid-column:1/-1"><label>Descrição</label><p style="white-space:pre-wrap">'+a.descricao+'</p></div>':'')
          + '<div><label>1ª Resposta</label><p>'+tempoResp+'</p></div>'
          + '<div><label>Tempo Total</label><p>'+tempoTotal+'</p></div>'
          + (a.ocorrenciaId?'<div><label>Ocorrência Gerada</label><p><span class="td-code">'+a.ocorrenciaId.slice(0,8)+'...</span> ('+a.ocorrenciaTipo+')</p></div>':'')
        + '</div>'
        + '<div><label style="margin-bottom:8px;display:block">Anexos</label>'
          + AtendimentosPage._renderAnexosSalvos(a.anexos)
        + '</div>'
      + '</div>'

      // ABA FINANCEIRO
      + '<div id="at-ver-panel-fin" style="display:none">'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
          + '<div><label>Status Financeiro</label><p>'+badgeFinanceiro(a.statusFinanceiro)+'</p></div>'
          + '<div><label>Valor Indenização</label><p>'+fmtMoney(a.valorIndenizacao||0)+'</p></div>'
          + '<div><label>Valor Reembolso</label><p>'+fmtMoney(a.valorReembolso||0)+'</p></div>'
          + '<div><label>Valor Crédito</label><p>'+fmtMoney(a.valorCredito||0)+'</p></div>'
          + '<div><label>Valor Total</label><p style="font-size:18px;font-weight:700;color:var(--success)">'+fmtMoney(a.valorTotal||0)+'</p></div>'
          + '<div><label>Forma de Pagamento</label><p>'+(a.formaPagamento||'—')+'</p></div>'
          + '<div><label>Data de Pagamento</label><p>'+(a.dataPagamento?fmtDate(a.dataPagamento):'—')+'</p></div>'
          + (a.observacoesFinanceiras?'<div style="grid-column:1/-1"><label>Observações Financeiras</label><p>'+a.observacoesFinanceiras+'</p></div>':'')
        + '</div>'
        + '<div class="divider"></div>'
        + '<div><label style="margin-bottom:10px;display:block">Histórico Financeiro</label>'
          + renderTimeline(a.historicoFinanceiro)
        + '</div>'
      + '</div>'

      // ABA HISTÓRICO GERAL
      + '<div id="at-ver-panel-hist" style="display:none">'
        + renderTimeline(a.historico)
      + '</div>';

    document.getElementById('modal-at-ver-edit-btn').onclick = function(){ Modal.close('modal-at-ver'); AtendimentosPage.editar(id); };
    Modal.open('modal-at-ver');
  },

  _switchVerTab(tab) {
    ['geral','fin','hist'].forEach(function(t) {
      var btn = document.getElementById('at-ver-tab-'+t);
      var panel = document.getElementById('at-ver-panel-'+t);
      if (btn)   btn.classList.toggle('active', t===tab);
      if (panel) panel.style.display = t===tab ? '' : 'none';
    });
  },

  // ── NOVO / EDITAR (modal com abas) ───────────────────────────
  async novo() {
    await this._fillModal(null);
    document.getElementById('at-modal-title').textContent = 'Novo Atendimento';
    document.getElementById('at-form-id').value = '';
    document.getElementById('at-modal-status-row').style.display = 'none';
    var inp = document.getElementById('at-anexos-input'); if(inp) inp.value='';
    var prev = document.getElementById('at-anexos-preview'); if(prev) prev.innerHTML='';
    AtendimentosPage._switchModalTab('geral');
    Modal.open('modal-atendimento');
  },

  async editar(id) {
    var a = await DB.find(DB.KEYS.ATENDIMENTOS, id); if (!a) return;
    await this._fillModal(a);
    document.getElementById('at-modal-title').textContent = 'Editar Atendimento';
    document.getElementById('at-form-id').value = id;
    document.getElementById('at-modal-status-row').style.display = '';
    AtendimentosPage._switchModalTab('geral');
    Modal.open('modal-atendimento');
  },

  _switchModalTab(tab) {
    ['geral','fin'].forEach(function(t) {
      var btn = document.getElementById('at-tab-btn-'+t);
      var panel = document.getElementById('at-tab-panel-'+t);
      if (btn)   btn.classList.toggle('active', t===tab);
      if (panel) panel.style.display = t===tab ? '' : 'none';
    });
  },

  async _fillModal(a) {
    var users = (await DB.getAll(DB.KEYS.USERS)).filter(function(u){ return u.ativo; });
    var sess = Session.get();
    var canFin = await temPermissao('editarFinanceiro');

    // Responsável atendimento
    var selR = document.getElementById('at-responsavel-sel');
    if (selR) {
      selR.innerHTML = '<option value="">Selecionar...</option>'
        + users.map(function(u){ return '<option value="'+u.id+'"'+(a&&a.responsavelId===u.id?' selected':'')+((!a&&sess&&u.id===sess.id)?' selected':'')+'>'+u.nome+'</option>'; }).join('');
    }

    var set = function(id, v) { var e=document.getElementById(id); if(e) e.value = (v===null||v===undefined)?'':v; };
    set('at-contato-nome', a?a.contatoNome:'');
    set('at-data',         a?(a.data||a.createdAt||'').split('T')[0]:'');
    set('at-hora',         a?a.horaRecebimento||'':'');
    set('at-assunto',      a?a.assunto:'');
    set('at-descricao',    a?a.descricao:'');
    set('at-status-sel',   a?a.status:'NOVO');

    // Financeiro
    var disableFin = !canFin;
    var finIds = ['at-fin-indenizacao','at-fin-reembolso','at-fin-credito','at-fin-status','at-fin-forma','at-fin-data-pag','at-fin-obs'];
    set('at-fin-indenizacao', a?a.valorIndenizacao||'':'');
    set('at-fin-reembolso',   a?a.valorReembolso||'':'');
    set('at-fin-credito',     a?a.valorCredito||'':'');
    set('at-fin-status',      a?a.statusFinanceiro||'Pendente':'Pendente');
    set('at-fin-forma',       a?a.formaPagamento||'':'');
    set('at-fin-data-pag',    a?a.dataPagamento||'':'');
    set('at-fin-obs',         a?a.observacoesFinanceiras||'':'');
    AtendimentosPage._calcTotal();
    finIds.forEach(function(fid) {
      var e = document.getElementById(fid);
      if (e) { e.disabled = disableFin; e.style.opacity = disableFin?'0.6':'1'; }
    });
    var hint = document.getElementById('at-fin-perm-hint');
    if (hint) hint.textContent = canFin ? '' : 'Sem permissão para editar campos financeiros.';
  },

  _calcTotal() {
    var v1 = parseFloat(document.getElementById('at-fin-indenizacao')?.value)||0;
    var v2 = parseFloat(document.getElementById('at-fin-reembolso')?.value)||0;
    var v3 = parseFloat(document.getElementById('at-fin-credito')?.value)||0;
    var el = document.getElementById('at-fin-total-display');
    if (el) el.textContent = fmtMoney(v1+v2+v3);
  },

  // ── SALVAR ───────────────────────────────────────────────────
  async salvar() {
    var id  = document.getElementById('at-form-id').value;
    var get = function(sid){ return (document.getElementById(sid)||{}).value||''; };
    var nome    = get('at-contato-nome');
    var assunto = get('at-assunto');
    if (!nome.trim() || !assunto.trim()) { Toast.warning('Preencha Contato e Assunto'); return; }

    var canFin = await temPermissao('editarFinanceiro');
    var user   = Session.get();

    var baseData = {
      contatoNome:    nome,
      data:           get('at-data') || new Date().toISOString().split('T')[0],
      horaRecebimento:get('at-hora') || null,
      assunto:        assunto,
      descricao:      get('at-descricao'),
      status:         get('at-status-sel') || 'NOVO',
      responsavelId:  get('at-responsavel-sel') || null,
    };

    // Financeiro (apenas se tiver permissão)
    var finData = {};
    if (canFin) {
      finData = {
        valorIndenizacao:       parseFloat(document.getElementById('at-fin-indenizacao')?.value)||0,
        valorReembolso:         parseFloat(document.getElementById('at-fin-reembolso')?.value)||0,
        valorCredito:           parseFloat(document.getElementById('at-fin-credito')?.value)||0,
        formaPagamento:         get('at-fin-forma'),
        statusFinanceiro:       get('at-fin-status') || 'Pendente',
        dataPagamento:          get('at-fin-data-pag') || null,
        observacoesFinanceiras: get('at-fin-obs'),
      };
    }

    // Upload de anexos
    var fileInput = document.getElementById('at-anexos-input');
    var novosAnexos = [];
    if (fileInput && fileInput.files && fileInput.files.length) {
      Toast.info('Enviando ' + fileInput.files.length + ' arquivo(s)...');
      var atId = id || ('AT-TEMP-'+Date.now());
      for (var i = 0; i < fileInput.files.length; i++) {
        var file = fileInput.files[i];
        if (file.size > 10 * 1024 * 1024) { Toast.warning('Arquivo "'+file.name+'" > 10MB — ignorado.'); continue; }
        try { novosAnexos.push(await SupabaseStorage.upload(file, atId)); }
        catch(e) { Toast.error('Falha ao enviar "'+file.name+'": '+e.message); }
      }
    }

    var data = Object.assign({}, baseData, finData);

    if (id) {
      var existing = await DB.find(DB.KEYS.ATENDIMENTOS, id);
      var hist  = existing ? (existing.historico||[]) : [];
      var histFin = existing ? (existing.historicoFinanceiro||[]) : [];
      var anexosAtuais = existing ? (existing.anexos||[]) : [];

      // Histórico geral
      [['Status',existing.status,data.status],['Assunto',existing.assunto,data.assunto]].forEach(function(c){
        if (String(c[1]||'')!==String(c[2]||'')) hist.push({data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:'Campo "'+c[0]+'" alterado',campo:c[0],valorAnterior:String(c[1]||''),novoValor:String(c[2]||'')});
      });

      // Histórico financeiro (somente campos financeiros)
      if (canFin) {
        [
          ['Valor Indenização', existing.valorIndenizacao, finData.valorIndenizacao],
          ['Valor Reembolso',   existing.valorReembolso,   finData.valorReembolso],
          ['Valor Crédito',     existing.valorCredito,     finData.valorCredito],
          ['Forma Pagamento',   existing.formaPagamento,   finData.formaPagamento],
          ['Status Financeiro', existing.statusFinanceiro, finData.statusFinanceiro],
          ['Data Pagamento',    existing.dataPagamento,    finData.dataPagamento],
          ['Obs. Financeiras',  existing.observacoesFinanceiras, finData.observacoesFinanceiras],
        ].forEach(function(c){
          if (String(c[1]||'')!==String(c[2]||'')) {
            var entry = {data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:'Campo financeiro "'+c[0]+'" alterado',campo:c[0],valorAnterior:String(c[1]||''),novoValor:String(c[2]||'')};
            histFin.push(entry);
            hist.push(entry);
            if (c[0]==='Status Financeiro' && c[2]==='Pago') {
              var pago = {data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:'💰 Pagamento registrado — '+fmtMoney(finData.valorIndenizacao+finData.valorReembolso+finData.valorCredito)+(finData.formaPagamento?' via '+finData.formaPagamento:''),campo:'pagamento',valorAnterior:'',novoValor:String(finData.dataPagamento||new Date().toISOString().split('T')[0])};
              histFin.push(pago); hist.push(pago);
            }
          }
        });
        data.historicoFinanceiro = histFin;
      }

      if (novosAnexos.length) { hist.push({data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:novosAnexos.length+' anexo(s) adicionado(s)',campo:'anexos',valorAnterior:'',novoValor:novosAnexos.map(function(a){return a.nome;}).join(', ')}); }
      if (data.status==='FINALIZADO' && existing.status!=='FINALIZADO' && !existing.horaEncerramento) data.horaEncerramento = new Date().toISOString();
      if ((data.status==='EM_ATENDIMENTO'||data.status==='FINALIZADO') && !existing.horaPrimeiraResp) data.horaPrimeiraResp = new Date().toISOString();

      data.historico = hist;
      data.anexos = anexosAtuais.concat(novosAnexos);
      await DB.update(DB.KEYS.ATENDIMENTOS, id, data);
      Toast.success('Atendimento atualizado!');
      // Notificações (fire-and-forget, nunca interrompe o fluxo)
      Promise.resolve().then(async function() { (async function(eid, edata, eex) {
        var cod = eex.codigo||eid;
        if (edata.status !== eex.status) await Notificacoes.criar({ modulo:'atendimento', tipo:'status', registroId:eid, registroCodigo:cod, titulo:'📋 Atendimento '+cod+' — status alterado', descricao:'De: '+(eex.status||'—')+' → Para: '+edata.status });
        if (edata.status === 'CONVERTIDO' && eex.status !== 'CONVERTIDO') await Notificacoes.criar({ modulo:'atendimento', tipo:'conversao', registroId:eid, registroCodigo:cod, titulo:'📋 Atendimento convertido em ocorrência: '+cod, descricao:(eex.contatoNome||'') });
        if (novosAnexos.length) await Notificacoes.criar({ modulo:'atendimento', tipo:'anexo', registroId:eid, registroCodigo:cod, titulo:'📋 Anexo adicionado — '+cod, descricao:novosAnexos.length+' arquivo(s) adicionado(s)' });
        // Financeiro
        if (canFin && finData) {
          var valorAnt = parseFloat(eex.valorTotal)||0; var valorNov = (parseFloat(finData.valorIndenizacao)||0)+(parseFloat(finData.valorReembolso)||0)+(parseFloat(finData.valorCredito)||0);
          if (Math.abs(valorNov-valorAnt)>0.01) await Notificacoes.criar({ modulo:'financeiro', tipo:'financeiro', registroId:eid, registroCodigo:cod, titulo:'💰 Valor alterado — '+cod, descricao:'Novo total: '+fmtMoney(valorNov) });
          if (finData.statusFinanceiro !== eex.statusFinanceiro) {
            await Notificacoes.criar({ modulo:'financeiro', tipo:'financeiro', registroId:eid, registroCodigo:cod, titulo:'💰 Status financeiro alterado — '+cod, descricao:'De: '+(eex.statusFinanceiro||'—')+' → Para: '+finData.statusFinanceiro });
            if (finData.statusFinanceiro === 'Pago') await Notificacoes.criar({ modulo:'financeiro', tipo:'financeiro', registroId:eid, registroCodigo:cod, titulo:'💰 Pagamento registrado — '+cod, descricao:'Total: '+fmtMoney(valorNov)+(finData.formaPagamento?' via '+finData.formaPagamento:'') });
            if (finData.statusFinanceiro === 'Cancelado') await Notificacoes.criar({ modulo:'financeiro', tipo:'financeiro', registroId:eid, registroCodigo:cod, titulo:'💰 Pagamento cancelado — '+cod, descricao:'' });
          }
        }
      })(id, data, existing); }).catch(function(e){ console.warn('[Notif] atend edit:', e.message); });
    } else {
      var count = (await DB.getAll(DB.KEYS.ATENDIMENTOS)).length + 1;
      data.codigo = 'AT-'+new Date().getFullYear()+'-'+String(count).padStart(4,'0');
      data.horaAbertura = new Date().toISOString();
      data.anexos = novosAnexos;
      data.statusFinanceiro = data.statusFinanceiro || 'Pendente';
      data.historicoFinanceiro = canFin && (finData.valorIndenizacao||finData.valorReembolso||finData.valorCredito) ? [{data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:'Dados financeiros registrados',campo:'financeiro',valorAnterior:'',novoValor:'Total: '+fmtMoney((finData.valorIndenizacao||0)+(finData.valorReembolso||0)+(finData.valorCredito||0))}] : [];
      data.historico = [{data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:'Atendimento aberto',campo:'',valorAnterior:'',novoValor:''}];
      if (novosAnexos.length) data.historico.push({data:new Date().toISOString(),usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',acao:novosAnexos.length+' anexo(s) adicionado(s)',campo:'anexos',valorAnterior:'',novoValor:novosAnexos.map(function(a){return a.nome;}).join(', ')});
      var created = await DB.insert(DB.KEYS.ATENDIMENTOS, data);
      await logAction('CRIACAO','Atendimento',created?created.id:'');
      Toast.success('Atendimento '+data.codigo+' registrado!');
      if (created) {
        await Notificacoes.criar({ modulo:'atendimento', tipo:'criacao', registroId:created.id, registroCodigo:data.codigo, titulo:'📋 Novo Atendimento: '+data.codigo, descricao:(data.assunto||'')+(data.contatoNome?' · '+data.contatoNome:'') });
        if (data.responsavelId) await Notificacoes.notificarResponsavel(data.responsavelId,'👤 Você é responsável pelo Atendimento '+data.codigo,'Você foi definido como responsável.','responsavel',created.id,data.codigo);
        if (novosAnexos.length) await Notificacoes.criar({ modulo:'atendimento', tipo:'anexo', registroId:created.id, registroCodigo:data.codigo, titulo:'📋 Anexo adicionado — '+data.codigo, descricao:novosAnexos.length+' arquivo(s)' });
      }
    }

    Modal.close('modal-atendimento');
    if (fileInput) fileInput.value='';
    var prev = document.getElementById('at-anexos-preview'); if(prev) prev.innerHTML='';
    await this.render();
  },

  // ── ANEXOS ───────────────────────────────────────────────────
  _previewAnexos(input) {
    var preview = document.getElementById('at-anexos-preview'); if (!preview) return;
    preview.innerHTML = '';
    Array.from(input.files).forEach(function(file) {
      var tag = document.createElement('div');
      tag.style.cssText = 'display:flex;align-items:center;gap:6px;background:var(--bg-stripe);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px';
      var icon = file.type.startsWith('image/')?'🖼️':file.name.endsWith('.pdf')?'📄':file.name.endsWith('.xml')?'📋':'📎';
      tag.innerHTML = icon+' <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+file.name+'</span> <span style="color:var(--text-muted)">('+( file.size/1024).toFixed(0)+'KB)</span>';
      preview.appendChild(tag);
    });
  },
  _renderAnexosSalvos(anexos) {
    if (!anexos||!anexos.length) return '<p style="color:var(--text-muted);font-size:12px">Nenhum anexo</p>';
    return '<div style="display:flex;flex-wrap:wrap;gap:8px">'
      + anexos.map(function(a){
          var icon=(a.tipo||'').startsWith('image/')?'🖼️':a.nome.endsWith('.pdf')?'📄':a.nome.endsWith('.xml')?'📋':'📎';
          return '<div style="background:var(--bg-stripe);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:12px">'
            +'<a onclick="AtendimentosPage.abrirAnexo(\''+encodeURIComponent(a.path)+'\')" style="cursor:pointer;color:var(--brand-600);text-decoration:none">'+icon+' '+a.nome+'</a>'
            +'</div>';
        }).join('')
      + '</div>';
  },
  async abrirAnexo(encodedPath) {
    var path = decodeURIComponent(encodedPath);
    try { var url = await SupabaseStorage.getSignedUrl(path); if(url) window.open(url,'_blank'); else Toast.error('Não foi possível gerar o link.'); }
    catch(e){ Toast.error('Erro ao abrir anexo: '+e.message); }
  },

  // ── GERAR OCORRÊNCIA ─────────────────────────────────────────
  async gerarOcorrencia(id) {
    var a = await DB.find(DB.KEYS.ATENDIMENTOS, id); if (!a) return;
    var old = document.getElementById('at-gerar-modal'); if (old) old.remove();
    var m = document.createElement('div'); m.id='at-gerar-modal'; m.className='modal-overlay open';
    m.innerHTML = '<div class="modal modal-sm">'
      +'<div class="modal-header"><span class="modal-title">Gerar Ocorrência — '+a.contatoNome+'</span>'
      +'<button class="modal-close" onclick="document.getElementById(\'at-gerar-modal\').remove()" style="background:none;border:none;cursor:pointer;display:flex;color:var(--text-secondary)">'+Icons.svg('x',16)+'</button></div>'
      +'<div class="modal-body"><p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">Selecione o tipo de registro a criar:</p>'
        +'<div style="display:flex;flex-direction:column;gap:10px">'
          +'<button class="btn btn-primary" onclick="AtendimentosPage._gerarDevolucao(\''+id+'\')">📋 Devolução</button>'
          +'<button class="btn btn-secondary" onclick="AtendimentosPage._gerarReentrega(\''+id+'\')">🔄 Reentrega</button>'
          +'<button class="btn btn-ghost" onclick="AtendimentosPage._gerarSobraFalta(\''+id+'\')">📦 Sobra / Falta</button>'
        +'</div>'
      +'</div></div>';
    document.body.appendChild(m);
  },
  async _gerarDevolucao(id) {
    var m=document.getElementById('at-gerar-modal'); if(m) m.remove();
    var a=await DB.find(DB.KEYS.ATENDIMENTOS,id); if(!a) return;
    await App.navigate('nova');
    var set=function(sid,v){var e=document.getElementById(sid);if(e&&v!==undefined) e.value=v;};
    set('nova-cliente',a.contatoNome); set('nova-desc','[AT '+a.codigo+'] '+a.assunto+(a.descricao?'\n\n'+a.descricao:'')); set('nova-responsavel',a.responsavelId);
    NovaOcorrenciaPage._atendimentoOrigemId=id; Toast.info('Formulário pré-preenchido com dados do atendimento.');
  },
  async _gerarReentrega(id) {
    var m=document.getElementById('at-gerar-modal'); if(m) m.remove();
    var a=await DB.find(DB.KEYS.ATENDIMENTOS,id); if(!a) return;
    await App.navigate('reentregas'); await ReentregasPage.nova();
    var set=function(sid,v){var e=document.getElementById(sid);if(e&&v) e.value=v;};
    set('reet-cliente',a.contatoNome); set('reet-desc','[AT '+a.codigo+'] '+a.assunto); set('reet-responsavel-sel',a.responsavelId); Toast.info('Formulário de reentrega pré-preenchido.');
  },
  async _gerarSobraFalta(id) {
    var m=document.getElementById('at-gerar-modal'); if(m) m.remove();
    var a=await DB.find(DB.KEYS.ATENDIMENTOS,id); if(!a) return;
    await App.navigate('sobras-faltas'); await SobrasFaltasPage.nova();
    var set=function(sid,v){var e=document.getElementById(sid);if(e&&v) e.value=v;};
    set('sf-cliente',a.contatoNome); set('sf-obs','[AT '+a.codigo+'] '+a.assunto); Toast.info('Formulário de sobra/falta pré-preenchido.');
  },

  // ── ARQUIVAR ─────────────────────────────────────────────────
  arquivar(id) {
    var self=this;
    DB.find(DB.KEYS.ATENDIMENTOS,id).then(function(a){
      if(!a) return;
      confirmDialog('Arquivar Atendimento','O atendimento '+a.codigo+' será arquivado.',async function(){
        await DB.delete(DB.KEYS.ATENDIMENTOS,id); Toast.info('Atendimento arquivado.'); await self.render();
      });
    });
  },
};

