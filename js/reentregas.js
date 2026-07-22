
// ===============================================================
// LogiTrack SAC -- Módulo de Reentregas (Supabase)
// ===============================================================

var MOTIVOS_REENTREGA = [
  'Fora do horario comercial',
  'Cliente nao consegue efetuar o pagamento',
  'Cliente nao recebe no sabado',
  'Erro do motorista',
  'Fora de rota',
  'Problema no cliente',
];

// ---------------------------------------------------------------
// Renderer de timeline de histórico (reutilizável)
// ---------------------------------------------------------------
function renderTimeline(historico) {
  if (!historico || !historico.length) {
    return '<p style="color:var(--text-muted);font-size:12px">Nenhum histórico registrado.</p>';
  }
  return '<div class="timeline">' +
    historico.map(function(h) {
      var detalhe = '';
      if (h.valorAnterior !== undefined && h.valorAnterior !== '' && h.novoValor !== undefined) {
        detalhe = '<div style="font-size:11px;color:var(--text-muted);margin-top:2px">'
          + 'De: <span style="color:var(--danger)">' + (h.valorAnterior || '(vazio)') + '</span>'
          + ' → Para: <span style="color:var(--success)">' + (h.novoValor || '(vazio)') + '</span>'
          + '</div>';
      }
      return '<div class="timeline-item">'
        + '<div class="timeline-dot"></div>'
        + '<div class="timeline-text">' + (h.acao || '') + '</div>'
        + detalhe
        + '<div class="timeline-time">'
          + (h.usuario || '') + ' · ' + fmtDateTime(h.data)
        + '</div>'
        + '</div>';
    }).join('') +
  '</div>';
}

// ---------------------------------------------------------------
// ReentregasPage
// ---------------------------------------------------------------
var ReentregasPage = {
  page: 1,
  perPage: 20,
  filters: {},

  async load() {
    this.page = 1;
    this.filters = {};
    this.renderFilters();
    await this.render();
    await this.atualizarAlertasSemMotorista2();
  },

  async getFiltered() {
    var all = (await DB.getAll(DB.KEYS.REENTREGAS)).filter(function(r) {
      return !r.arquivado;
    });
    var f = this.filters;
    if (f.status)  all = all.filter(function(r){ return r.status === f.status; });
    if (f.tratativa) all = all.filter(function(r){return r.tratativaCom===f.tratativa;});
    if (f.busca) {
      var b = f.busca.toLowerCase();
      all = all.filter(function(r) {
        return (r.codigo||'').toLowerCase().includes(b)
          || (r.cliente||'').toLowerCase().includes(b)
          || (r.motoristaPrincipal||'').toLowerCase().includes(b)
          || (r.notaFiscal||'').toLowerCase().includes(b)
          || (r.motivo||'').toLowerCase().includes(b);
      });
    }
    return all.sort(function(a,b){ return new Date(b.createdAt)-new Date(a.createdAt); });
  },

  renderFilters() {
    var el = document.getElementById('reet-filters');
    if (!el) return;
    var self = this;
    el.innerHTML =
      '<div class="input-group" style="flex:1;min-width:200px">'
        + '<span class="input-icon">' + Icons.svg('search',15) + '</span>'
        + '<input class="input" id="reet-busca" placeholder="Buscar por código, cliente, motorista..." style="height:34px;font-size:12.5px">'
      + '</div>'
      + '<select class="select" id="reet-status" style="height:34px;font-size:12.5px;width:auto">'
        + '<option value="">Todos os status</option>'
        + '<option value="ABERTA">Aberta</option>'
        + '<option value="EM_ANDAMENTO">Em Andamento</option>'
        + '<option value="RESOLVIDA">Resolvida</option>'
        + '<option value="CANCELADA">Cancelada</option>'
      + '</select>'
      + '<button class="btn btn-ghost btn-sm" id="reet-clear">' + Icons.svg('refresh',14) + '</button>';

    ['reet-busca','reet-status','reet-tratativa'].forEach(function(id) {
      var inp = document.getElementById(id);
      if (!inp) return;
      inp.addEventListener(id==='reet-busca'?'input':'change', async function() {
        self.filters = {
          busca:  document.getElementById('reet-busca')?.value || '',
          status: document.getElementById('reet-status')?.value || '',
          tratativa: document.getElementById('reet-tratativa')?.value || '',
        };
        self.page = 1;
        await self.render();
      });
    });
    document.getElementById('reet-clear')?.addEventListener('click', async function() {
      self.filters = {};
      self.page = 1;
      el.querySelectorAll('input,select').forEach(function(e){ e.value=''; });
      await self.render();
    });
  },

  async render() {
    var all = await this.getFiltered();
    var start = (this.page-1) * this.perPage;
    var slice = all.slice(start, start + this.perPage);
    var tbody = document.getElementById('reet-tbody');
    if (!tbody) return;
    var cntEl = document.getElementById('reet-count');
    if (cntEl) cntEl.textContent = all.length + ' reentrega' + (all.length!==1?'s':'');

    if (!slice.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">'
        + Icons.svg('refresh',32) + '<br><br>Nenhuma reentrega encontrada</td></tr>';
      renderPagination('reet-pagination', 0, 1, this.perPage, function(){});
      return;
    }

    var self = this;
    tbody.innerHTML = slice.map(function(r) {
      var semMot2 = !r.motoristaSecundario;
      var mot2Cell = semMot2
        ? '<span style="color:var(--danger);font-size:11px;font-weight:600">⚠ Sem Mot. Sec.</span>'
        : r.motoristaSecundario;
      return '<tr>'
        + '<td><span class="td-code">' + r.codigo + '</span></td>'
        + '<td style="font-size:12px">' + (r.motivo||'—') + '</td>'
        + '<td>' + badgeStatus(r.status) + '</td>'
        + '<td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (r.cliente||'—') + '</td>'
        + '<td style="font-size:12px">' + (r.motoristaPrincipal||'—') + '</td>'
        + '<td style="font-size:12px">' + mot2Cell + '</td>'
        + '<td>' + (r.devolucaoEvitada ? '<span class="badge badge-resolvida">Sim</span>' : '<span class="badge badge-cancelada">Não</span>') + '</td>'
        + '<td><div class="td-actions">'
          + '<button class="btn btn-ghost btn-icon btn-sm" title="Ver" onclick="ReentregasPage.ver(\'' + r.id + '\')">' + Icons.svg('eye',14) + '</button>'
          + '<button class="btn btn-ghost btn-icon btn-sm" title="Editar" onclick="ReentregasPage.editar(\'' + r.id + '\')">' + Icons.svg('edit',14) + '</button>'
          + '<button class="btn btn-ghost btn-icon btn-sm" title="Arquivar" style="color:var(--warning)" onclick="ReentregasPage.arquivar(\'' + r.id + '\')">' + Icons.svg('trash',14) + '</button>'
        + '</div></td>'
        + '</tr>';
    }).join('');

    renderPagination('reet-pagination', all.length, this.page, this.perPage, function(p){
      self.page = p; self.render();
    });
  },

  // ── Motorista secundário inline ──────────────────────────────
  async editarMotoristaSecundario(id) {
    var r = await DB.find(DB.KEYS.REENTREGAS, id);
    if (!r) return;
    var old = document.getElementById('confirm-modal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal-overlay open';
    modal.innerHTML = '<div class="modal modal-sm">'
      + '<div class="modal-header"><span class="modal-title">Motorista Secundário — ' + r.codigo + '</span>'
      + '<button class="modal-close" onclick="document.getElementById(\'confirm-modal\').remove()" style="background:none;border:none;cursor:pointer;display:flex;color:var(--text-secondary)">' + Icons.svg('x',16) + '</button></div>'
      + '<div class="modal-body">'
        + '<div class="form-group"><label>Código do Motorista Secundário</label>'
          + '<input class="input" id="mot2-cod-inline" placeholder="Ex: 2278" value="' + (r._mot2cod||'') + '" oninput="ReentregasPage._previewMot2()">'
          + '<div id="mot2-preview-inline" style="font-size:12px;margin-top:4px;font-weight:500">'
            + (r.motoristaSecundario ? '<span style="color:var(--success)">' + r.motoristaSecundario + '</span>' : '')
          + '</div>'
        + '</div>'
      + '</div>'
      + '<div class="modal-footer">'
        + '<button class="btn btn-secondary" onclick="document.getElementById(\'confirm-modal\').remove()">Cancelar</button>'
        + '<button class="btn btn-primary" onclick="ReentregasPage._salvarMot2(\'' + id + '\')">Salvar</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(modal);
  },

  _previewMot2() {
    var input = document.getElementById('mot2-cod-inline');
    var preview = document.getElementById('mot2-preview-inline');
    if (!input || !preview) return;
    var cod = input.value.trim();
    if (!cod) { preview.innerHTML = ''; return; }
    var found = buscarMotoristaPorCodigo(cod);
    if (found) {
      preview.innerHTML = '<span style="color:var(--success)">' + found.display + '</span>';
    } else {
      preview.innerHTML = '<span style="color:var(--danger)">Código não encontrado</span>';
    }
  },

  async _salvarMot2(id) {
    var cod = (document.getElementById('mot2-cod-inline')?.value || '').trim();
    var r = await DB.find(DB.KEYS.REENTREGAS, id);
    if (!r) return;

    var anterior = r.motoristaSecundario || '';
    var novo = '';
    if (cod) {
      var found = buscarMotoristaPorCodigo(cod);
      novo = found ? found.display : cod;
    }

    var historico = r.historico || [];
    if (anterior !== novo) {
      var user = Session.get();
      historico.push({
        data: new Date().toISOString(), usuario: user?user.nome:'Sistema', usuarioId: user?user.id:'',
        acao: novo ? 'Motorista secundario definido' : 'Motorista secundario removido',
        campo: 'Motorista Secundario', valorAnterior: anterior, novoValor: novo,
      });
    }

    await DB.update(DB.KEYS.REENTREGAS, id, { motoristaSecundario: novo, _mot2cod: cod, historico: historico });
    var m = document.getElementById('confirm-modal');
    if (m) m.remove();
    Toast.success(novo ? 'Motorista secundário atualizado: ' + novo : 'Motorista secundário removido.');
    await this.render();
    await this.atualizarAlertasSemMotorista2();
    await App.updateAlertBadge();
    await App.renderSidebar();
  },

  // ── Alerta automático sem motorista secundário ───────────────
  async atualizarAlertasSemMotorista2() {
    await App.updateAlertBadge();
  },

  async getSemMotorista2() {
    var all = await DB.getAll(DB.KEYS.REENTREGAS);
    return all.filter(function(r) {
      return !r.arquivado && !r.motoristaSecundario && !['RESOLVIDA','CANCELADA'].includes(r.status);
    });
  },

  // ── Ver ──────────────────────────────────────────────────────
  async ver(id) {
    var r = await DB.find(DB.KEYS.REENTREGAS, id);
    if (!r) return;
    await refreshUsersCache();
    var resp = getUser(r.responsavelId);

    document.getElementById('modal-reet-ver-title').textContent = r.codigo;
    document.getElementById('modal-reet-ver-body').innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">'
        + '<div><label>Motivo</label><p>' + (r.motivo||'—') + '</p></div>'
        + '<div><label>Status</label><p>' + badgeStatus(r.status) + '</p></div>'
        + '<div><label>Cliente</label><p>' + (r.cliente||'—') + '</p></div>'
        + '<div><label>Motorista Principal</label><p>' + (r.motoristaPrincipal||'—') + '</p></div>'
        + '<div><label>Motorista Secundário</label><p>'
          + (r.motoristaSecundario
              ? r.motoristaSecundario
              : '<span style="color:var(--danger);font-weight:600">Não informado</span>')
          + ' <button class="btn btn-ghost btn-sm" onclick="Modal.close(\'modal-reet-ver\');ReentregasPage.editarMotoristaSecundario(\'' + id + '\')" style="font-size:11px;padding:2px 6px">Editar</button>'
          + '</p></div>'
        + '<div><label>Responsável</label><p>' + resp.nome + '</p></div>'
        + '<div><label>Nota Fiscal</label><p>' + (r.notaFiscal||'—') + '</p></div>'
        + '<div><label>Local</label><p>' + (r.localOcorrencia||'—') + '</p></div>'
        + '<div><label>Valor Mercadoria</label><p>' + fmtMoney(r.valorMercadoria) + '</p></div>'
        + '<div><label>Devolução Evitada</label><p>' + (r.devolucaoEvitada?'<span class="badge badge-resolvida">Sim</span>':'<span class="badge badge-cancelada">Não</span>') + '</p></div>'
        + (r.tratativaCom?'<div><label>Tratativa com</label><p>'+r.tratativaCom+'</p></div>':'')
        + (r.descricao?'<div style="grid-column:1/-1"><label>Descrição</label><p style="white-space:pre-wrap">' + r.descricao + '</p></div>':'')
        + (r.observacoes?'<div style="grid-column:1/-1"><label>Observações</label><p>' + r.observacoes + '</p></div>':'')
        + '<div><label>Registrado em</label><p>' + fmtDateTime(r.createdAt) + '</p></div>'
        + '<div><label>Última atualização</label><p>' + fmtDateTime(r.updatedAt) + '</p></div>'
      + '</div>'
      + '<div class="divider"></div>'
      + '<div><label style="margin-bottom:10px;display:block">Timeline de Alterações</label>'
        + renderTimeline(r.historico)
      + '</div>';

    document.getElementById('modal-reet-ver-edit-btn').onclick = function() {
      Modal.close('modal-reet-ver');
      ReentregasPage.editar(id);
    };
    Modal.open('modal-reet-ver');
  },

  // ── Nova / Editar ────────────────────────────────────────────
  async nova() {
    await this._preencherModal(null);
    document.getElementById('reet-modal-title').textContent = 'Nova Reentrega';
    document.getElementById('reet-form-id').value = '';
    document.getElementById('reet-modal-status-row').style.display = 'none';
    Modal.open('modal-reentrega');
  },

  async editar(id) {
    var r = await DB.find(DB.KEYS.REENTREGAS, id);
    if (!r) return;
    await this._preencherModal(r);
    document.getElementById('reet-modal-title').textContent = 'Editar Reentrega';
    document.getElementById('reet-form-id').value = id;
    document.getElementById('reet-modal-status-row').style.display = '';
    Modal.open('modal-reentrega');
  },

  async _preencherModal(r) {
    var users = (await DB.getAll(DB.KEYS.USERS)).filter(function(u){ return u.ativo; });
    var selR = document.getElementById('reet-responsavel-sel');
    if (selR) {
      selR.innerHTML = '<option value="">Selecionar...</option>'
        + users.map(function(u){
            return '<option value="' + u.id + '"' + (r&&r.responsavelId===u.id?' selected':'') + '>' + u.nome + '</option>';
          }).join('');
    }

    var selM = document.getElementById('reet-motivo-sel');
    if (selM) {
      selM.innerHTML = '<option value="">Selecionar motivo...</option>'
        + MOTIVOS_REENTREGA.map(function(m){
            return '<option value="' + m + '"' + (r&&r.motivo===m?' selected':'') + '>' + m + '</option>';
          }).join('');
    }

    var set = function(id, v) { var e=document.getElementById(id); if(e) e.value=v||''; };
    set('reet-status-sel',     r ? r.status : 'ABERTA');
    set('reet-cliente',        r ? r.cliente : '');
    set('reet-mot1-cod',       r ? (r._mot1cod||'') : '');
    set('reet-mot2-cod',       r ? (r._mot2cod||'') : '');
    set('reet-nf',             r ? r.notaFiscal : '');
    set('reet-local',          r ? r.localOcorrencia : '');
    set('reet-valor',          r ? r.valorMercadoria : '');
    set('reet-desc',           r ? r.descricao : '');
    set('reet-obs',            r ? r.observacoes : '');
    var reetTC = document.getElementById('reet-tratativa-container');
    if(reetTC) reetTC.innerHTML = buildTratativaSelect('reet-tratativa-sel', r?r.tratativaCom||'':'');
    set('reet-dev-evitada',    r ? (r.devolucaoEvitada?'sim':'nao') : 'nao');

    this._previewMot('reet-mot1-cod','reet-mot1-preview');
    this._previewMot('reet-mot2-cod','reet-mot2-preview');
  },

  _previewMot(inputId, previewId) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    if (!input || !preview) return;
    var cod = input.value.trim();
    if (!cod) { preview.textContent = ''; preview.style.color = ''; return; }
    var found = buscarMotoristaPorCodigo(cod);
    if (found) {
      preview.textContent = found.display;
      preview.style.color = 'var(--success)';
    } else {
      preview.textContent = 'Código não encontrado';
      preview.style.color = 'var(--danger)';
    }
  },

  _toggleDiasHorarios() { /* campo removido */ },

  async salvar() {
    var id = document.getElementById('reet-form-id').value;
    var get = function(sid){ return (document.getElementById(sid)||{}).value||''; };

    var motivo   = get('reet-motivo-sel');
    var cliente  = get('reet-cliente');
    var descricao= get('reet-desc');
    if (!motivo || !cliente.trim()) {
      Toast.warning('Preencha Motivo e Cliente');
      return;
    }

    var mot1cod = get('reet-mot1-cod').trim();
    var mot2cod = get('reet-mot2-cod').trim();
    var mot1Found = mot1cod ? buscarMotoristaPorCodigo(mot1cod) : null;
    var mot2Found = mot2cod ? buscarMotoristaPorCodigo(mot2cod) : null;

    var mot1Display = mot1Found ? mot1Found.display : mot1cod;
    var mot2Display = mot2Found ? mot2Found.display : mot2cod;

    var user = Session.get();
    var data = {
      motivo: motivo,
      status: get('reet-status-sel') || 'ABERTA',
      cliente: cliente,
      motoristaPrincipal: mot1Display,
      motoristaSecundario: mot2Display,
      _mot1cod: mot1cod,
      _mot2cod: mot2cod,
      responsavelId: get('reet-responsavel-sel') || null,
      notaFiscal: get('reet-nf'),
      localOcorrencia: get('reet-local'),
      valorMercadoria: parseFloat(get('reet-valor')) || 0,
      descricao: descricao,
      observacoes: get('reet-obs'),
      tratativaCom: get('reet-tratativa-sel') || '',
      devolucaoEvitada: get('reet-dev-evitada') === 'sim',
    };

    if (id) {
      var existing = await DB.find(DB.KEYS.REENTREGAS, id);
      var historico = existing ? (existing.historico || []) : [];

      var campos = [
        ['Motivo', existing.motivo, data.motivo],
        ['Status', existing.status, data.status],
        ['Cliente', existing.cliente, data.cliente],
        ['Motorista Principal', existing.motoristaPrincipal, data.motoristaPrincipal],
        ['Motorista Secundario', existing.motoristaSecundario, data.motoristaSecundario],
        ['Devolucao Evitada', existing.devolucaoEvitada?'Sim':'Nao', data.devolucaoEvitada?'Sim':'Nao'],
        ['Tratativa com', existing.tratativaCom, data.tratativaCom],
      ];
      campos.forEach(function(c) {
        if (c[1] !== c[2]) {
          historico.push({
            data: new Date().toISOString(),
            usuario: user ? user.nome : 'Sistema',
            usuarioId: user ? user.id : '',
            acao: 'Campo "' + c[0] + '" alterado',
            campo: c[0],
            valorAnterior: String(c[1] || ''),
            novoValor: String(c[2] || ''),
          });
        }
      });
      data.historico = historico;
      await DB.update(DB.KEYS.REENTREGAS, id, data);
      await logAction('EDICAO', 'Reentrega', id);
      Toast.success('Reentrega atualizada!');
      (async function(eid, edata, eex) {
        var cod = eex.codigo||eid;
        await Notificacoes.criar({ modulo:'reentrega', tipo:'atualizacao', registroId:eid, registroCodigo:cod, titulo:'🚚 Reentrega '+cod+' atualizada', descricao:'Status: '+edata.status });
        if (edata.responsavelId && edata.responsavelId !== eex.responsavelId) await Notificacoes.notificarResponsavel(edata.responsavelId,'👤 Você é responsável pela Reentrega '+cod,'Você foi definido como responsável.','responsavel',eid,cod);
        if (edata.tratativaCom && edata.tratativaCom !== eex.tratativaCom) await Notificacoes.criar({ modulo:'tratativa', tipo:'tratativa', registroId:eid, registroCodigo:cod, titulo:'🔄 Tratativa alterada — '+cod, descricao:'De: '+(eex.tratativaCom||'—')+' → Para: '+edata.tratativaCom });
        if (edata.status === 'RESOLVIDA' && eex.status !== 'RESOLVIDA') await Notificacoes.criar({ modulo:'reentrega', tipo:'status', registroId:eid, registroCodigo:cod, titulo:'🚚 Reentrega concluída: '+cod, descricao:(edata.cliente||'') });
      })(id, data, existing).catch(function(e){ console.warn('[Notif] reentrega edit:', e.message); });
    } else {
      var count = (await DB.getAll(DB.KEYS.REENTREGAS)).length + 1;
      data.codigo = 'RT-' + new Date().getFullYear() + '-' + String(count).padStart(4,'0');
      data.historico = [{
        data: new Date().toISOString(),
        usuario: user ? user.nome : 'Sistema',
        usuarioId: user ? user.id : '',
        acao: 'Reentrega registrada',
        campo: '', valorAnterior: '', novoValor: '',
      }];
      var created = await DB.insert(DB.KEYS.REENTREGAS, data);
      await logAction('CRIACAO', 'Reentrega', created?created.id:'');
      Toast.success('Reentrega ' + data.codigo + ' registrada!');
      if (created) {
        await Notificacoes.criar({ modulo:'reentrega', tipo:'criacao', registroId:created.id, registroCodigo:data.codigo, titulo:'🚚 Nova Reentrega: '+data.codigo, descricao:(data.motivo||'')+(data.cliente?' · '+data.cliente:'') });
        if (data.responsavelId) await Notificacoes.notificarResponsavel(data.responsavelId,'👤 Você é responsável pela Reentrega '+data.codigo,'Você foi definido como responsável.','responsavel',created.id,data.codigo);
      }
    }

    Modal.close('modal-reentrega');
    await this.render();
    await this.atualizarAlertasSemMotorista2();
    await App.updateAlertBadge();
    await App.renderSidebar();
  },

  // ── Arquivamento lógico (nunca deleta) ───────────────────────
  arquivar(id) {
    var self = this;
    DB.find(DB.KEYS.REENTREGAS, id).then(function(r) {
      if (!r) return;
      confirmDialog(
        'Arquivar Reentrega',
        'A reentrega ' + r.codigo + ' será arquivada (não excluída). Continuará disponível na auditoria.',
        async function() {
          await DB.delete(DB.KEYS.REENTREGAS, id); // soft-delete (registra histórico internamente)
          await logAction('ARQUIVAMENTO', 'Reentrega', id);
          Toast.info('Reentrega arquivada. Disponível em Auditoria.');
          await self.render();
          await self.atualizarAlertasSemMotorista2();
          await App.updateAlertBadge();
        },
        true
      );
    });
  },
};

