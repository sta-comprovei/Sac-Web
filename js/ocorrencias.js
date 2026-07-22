
// ===============================================================
// LogiTrack SAC -- Ocorrencias CRUD (Supabase)
// ===============================================================

// -- Pesquisa inteligente de tipo (codigo ou descricao) ---------
function buildTipoField(inputId, selectedValor) {
  var listId = inputId + '_list';
  var opts = TIPOS_OCORRENCIA_CONFIG.map(function(t) {
    return '<option value="'+t.valor+'"></option>';
  }).join('');
  var val = selectedValor || '';
  return '<input class="input" id="'+inputId+'" list="'+listId+'" placeholder="Digite o codigo ou descricao..." value="'+val+'" autocomplete="off">'
       + '<datalist id="'+listId+'">'+opts+'</datalist>';
}

// ---------------------------------------------------------------
const OcorrenciasPage = {
  page:1, perPage:20, filters:{},

  async load() {
    this.page=1; this.filters={};
    this.renderFilters();
    await this.render();
  },

  async getFiltered() {
    var ocs = (await DB.getAll(DB.KEYS.OCORRENCIAS)).filter(function(o){ return !o.arquivado; });
    var f   = this.filters;
    if(f.status)    ocs=ocs.filter(function(o){return o.status===f.status;});
    if(f.tipo)      ocs=ocs.filter(function(o){return o.tipo===f.tipo;});
    if(f.tratativa) ocs=ocs.filter(function(o){return o.tratativaCom===f.tratativa;});
    if(f.busca) {
      var b=f.busca.toLowerCase();
      ocs=ocs.filter(function(o){
        return (o.codigo||'').toLowerCase().includes(b)
          || (o.descricao||'').toLowerCase().includes(b)
          || (o.cliente||'').toLowerCase().includes(b)
          || (o.motorista||'').toLowerCase().includes(b)
          || (o.conferente||'').toLowerCase().includes(b)
          || (o.notaFiscal||'').toLowerCase().includes(b)
          || (o.tipo||'').toLowerCase().includes(b);
      });
    }
    return ocs.sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});
  },

  renderFilters() {
    var el=document.getElementById('oc-filters');
    if(!el) return;
    var tipoOpts='<option value="">Todos os tipos</option>';
    TIPOS_OCORRENCIA_CONFIG.forEach(function(t){
      tipoOpts+='<option value="'+t.valor+'">'+t.valor+'</option>';
    });
    el.innerHTML=
      '<div class="input-group" style="flex:1;min-width:220px">'
        +'<span class="input-icon">'+Icons.svg('search',15)+'</span>'
        +'<input class="input" id="oc-busca" placeholder="Buscar por codigo, cliente, motorista..." style="height:34px;font-size:12.5px">'
      +'</div>'
      +'<select class="select" id="oc-status" style="height:34px;font-size:12.5px;width:auto">'
        +'<option value="">Todos os status</option>'
        +'<option value="ABERTA">Aberta</option>'
        +'<option value="EM_ANDAMENTO">Em Andamento</option>'
        +'<option value="AGUARDANDO">Aguardando</option>'
        +'<option value="RESOLVIDA">Resolvida</option>'
        +'<option value="CANCELADA">Cancelada</option>'
      +'</select>'
      +'<select class="select" id="oc-tipo" style="height:34px;font-size:12.5px;width:auto;max-width:240px">'+tipoOpts+'</select>'

      +'<select class="select" id="oc-tratativa" style="height:34px;font-size:12.5px;width:auto">'
        +'<option value="">Todas tratativas</option>'
        +TRATATIVAS_CONFIG.map(function(t){return '<option value="'+t.nome+'">'+t.nome+'</option>';}).join('')
      +'</select>'
      +'<button class="btn btn-ghost btn-sm" id="oc-clear" title="Limpar filtros">'+Icons.svg('refresh',14)+'</button>';

    var self=this;
    ['oc-busca','oc-status','oc-tipo','oc-tratativa'].forEach(function(id){
      var el2=document.getElementById(id); if(!el2) return;
      el2.addEventListener(id==='oc-busca'?'input':'change', async function(){
        self.filters={
          busca:    document.getElementById('oc-busca')?.value||'',
          status:   document.getElementById('oc-status')?.value||'',
          tipo:     document.getElementById('oc-tipo')?.value||'',
          tratativa: document.getElementById('oc-tratativa')?.value||'',

        };
        self.page=1; await self.render();
      });
    });
    document.getElementById('oc-clear')?.addEventListener('click', async function(){
      self.filters={}; self.page=1;
      el.querySelectorAll('input,select').forEach(function(e){e.value='';});
      await self.render();
    });
  },

  async render() {
    var all=await this.getFiltered();
    var start=(this.page-1)*this.perPage;
    var slice=all.slice(start,start+this.perPage);
    var tbody=document.getElementById('oc-tbody');
    if(!tbody) return;
    var cntEl=document.getElementById('oc-count');
    if(cntEl) cntEl.textContent=all.length+' ocorrencia'+(all.length!==1?'s':'');
    if(!slice.length){
      tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">'+Icons.svg('filter',32)+'<br><br>Nenhuma ocorrencia encontrada</td></tr>';
      renderPagination('oc-pagination',0,1,this.perPage,function(){});
      return;
    }
    var self=this;
    tbody.innerHTML=slice.map(function(o){
      return '<tr>'
        +'<td><span class="td-code">'+o.codigo+'</span></td>'
        +'<td><span style="font-size:12px">'+o.tipo+'</span></td>'
        +'<td>'+badgeStatus(o.status)+'</td>'
        +'<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(o.cliente||'—')+'</td>'
        +'<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(o.motorista||'—')+'</td>'
        +'<td>'+fmtDate(o.createdAt)+'</td>'
        +'<td><div class="td-actions">'
          +'<button class="btn btn-ghost btn-icon btn-sm" title="Ver" onclick="OcorrenciasPage.ver(\''+o.id+'\')">'+Icons.svg('eye',14)+'</button>'
          +'<button class="btn btn-ghost btn-icon btn-sm" title="Editar" onclick="OcorrenciasPage.editar(\''+o.id+'\')">'+Icons.svg('edit',14)+'</button>'
          +'<button class="btn btn-ghost btn-icon btn-sm" title="Excluir" style="color:var(--danger)" onclick="OcorrenciasPage.excluir(\''+o.id+'\')">'+Icons.svg('trash',14)+'</button>'
        +'</div></td></tr>';
    }).join('');
    renderPagination('oc-pagination',all.length,this.page,this.perPage,function(p){self.page=p;self.render();});
  },

  async ver(id) {
    var o=await DB.find(DB.KEYS.OCORRENCIAS,id);
    if(!o) return;
    await refreshUsersCache();
    var resp=getUser(o.responsavelId);
    document.getElementById('modal-ver-title').textContent=o.codigo;
    document.getElementById('modal-ver-body').innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">'
        +'<div><label>Tipo</label><p>'+o.tipo+'</p></div>'
        +'<div><label>Status</label><p>'+badgeStatus(o.status)+'</p></div>'
        +'<div><label>Nota Fiscal</label><p>'+(o.notaFiscal||'—')+'</p></div>'
        +'<div><label>Cliente</label><p>'+(o.cliente||'—')+'</p></div>'
        +'<div><label>Motorista</label><p>'+(o.motorista||'—')+'</p></div>'
        +'<div><label>Responsavel</label><p>'+resp.nome+'</p></div>'
        +'<div><label>Local</label><p>'+(o.localOcorrencia||'—')+'</p></div>'
        +'<div><label>Valor Mercadoria</label><p>'+fmtMoney(o.valorMercadoria)+'</p></div>'
        +'<div style="grid-column:1/-1"><label>Descricao</label><p style="white-space:pre-wrap">'+o.descricao+'</p></div>'
        +(o.tratativaCom?'<div><label>Tratativa com</label><p>'+o.tratativaCom+'</p></div>':'')
        +(o.observacoes?'<div style="grid-column:1/-1"><label>Observacoes</label><p>'+o.observacoes+'</p></div>':'')
        +(o.justificativa?'<div style="grid-column:1/-1"><label>Justificativa</label><p style="white-space:pre-wrap">'+o.justificativa+'</p></div>':'')
        +'<div><label>Resolução da Devolução</label><p>'+(o.resolucaoDevolucao?'<strong>'+o.resolucaoDevolucao+'</strong>':'<span style="color:var(--text-muted);font-style:italic">Pendente — aguardando usuário autorizado</span>')+'</p></div>'
        +'<div><label>Registrado em</label><p>'+fmtDateTime(o.createdAt)+'</p></div>'
        +'<div><label>Ultima atualizacao</label><p>'+fmtDateTime(o.updatedAt)+'</p></div>'
      +'</div>'
      +'<div class="divider"></div>'
      +'<div><label style="margin-bottom:10px;display:block">Timeline de Alterações</label>'
        + renderTimeline(o.historico)
      +'</div>';
    document.getElementById('modal-ver-edit-btn').onclick=function(){Modal.close('modal-ver');OcorrenciasPage.editar(id);};
    Modal.open('modal-ver');
  },

  async editar(id) {
    var o=await DB.find(DB.KEYS.OCORRENCIAS,id);
    if(!o) return;
    await this._preencherModal(o);
    document.getElementById('oc-modal-title').textContent='Editar Ocorrencia';
    document.getElementById('oc-form-id').value=id;
    document.getElementById('oc-modal-status-row').style.display='';
    Modal.open('modal-ocorrencia');
  },

  async nova() {
    await this._preencherModal(null);
    document.getElementById('oc-modal-title').textContent='Nova Ocorrencia';
    document.getElementById('oc-form-id').value='';
    document.getElementById('oc-modal-status-row').style.display='none';
    Modal.open('modal-ocorrencia');
  },

  async _preencherModal(o) {
    var users=(await DB.getAll(DB.KEYS.USERS)).filter(function(u){return u.ativo;});

    var selR=document.getElementById('oc-responsavel-sel');
    if(selR){
      selR.innerHTML='<option value="">Selecionar...</option>'+users.map(function(u){
        return '<option value="'+u.id+'"'+(o&&o.responsavelId===u.id?' selected':'')+'>'+ u.nome+'</option>';
      }).join('');
    }

    var set=function(id,v){var e=document.getElementById(id);if(e)e.value=v||'';};
    set('oc-status-sel',  o?o.status:'ABERTA');
    set('oc-cliente-txt', o?o.cliente:'');
    set('oc-nf',          o?o.notaFiscal:'');
    set('oc-local',       o?o.localOcorrencia:'');
    set('oc-valor',       o?o.valorMercadoria:'');
    set('oc-desc',        o?o.descricao:'');
    set('oc-obs',         o?o.observacoes:'');
    // tratativaCom — built dynamically via innerHTML
    var tcContainer = document.getElementById('oc-tratativa-container');
    if(tcContainer) tcContainer.innerHTML = buildTratativaSelect('oc-tratativa-sel', o?o.tratativaCom||'':'');
    set('oc-justificativa', o?o.justificativa||'':'');
    set('oc-resolucao-dev', o?o.resolucaoDevolucao||'':'');

    var canEditResolucao = await temPermissao('alterarResolucaoDevolucao');
    var resolRow=document.getElementById('oc-resolucao-dev-row');
    if(resolRow){
      resolRow.style.display = (o && o.id) ? '' : 'none';
      var selResol=document.getElementById('oc-resolucao-dev');
      var hintEl=document.getElementById('oc-resolucao-hint');
      if(selResol){
        selResol.disabled = !canEditResolucao;
        selResol.title = canEditResolucao ? 'Alterar resolução da devolução' : 'Sem permissão — somente o usuário autorizado pode alterar';
        selResol.style.opacity = canEditResolucao ? '1' : '0.55';
        selResol.style.cursor = canEditResolucao ? 'pointer' : 'not-allowed';
        selResol.style.background = canEditResolucao ? '' : 'var(--bg-stripe)';
      }
      if(hintEl){
        if(canEditResolucao){
          hintEl.textContent = 'Você tem permissão para alterar este campo.';
          hintEl.style.color = 'var(--success)';
        } else {
          hintEl.textContent = 'Somente o usuário autorizado pode alterar a resolução da devolução.';
          hintEl.style.color = 'var(--text-muted)';
        }
      }
    }

    var tipoContainer=document.getElementById('oc-tipo-container');
    if(tipoContainer) tipoContainer.innerHTML=buildTipoField('oc-tipo-sel', o?o.tipo:'');

    set('oc-motorista-cod', o ? (o.motorista&&o.motorista.match(/^(\d+) - /)?o.motorista.match(/^(\d+)/)[1]:o.motorista||'') : '');
    OcorrenciasPage._atualizarPreviewMotorista('oc-motorista-cod','oc-motorista-preview');
  },

  _atualizarPreviewMotorista(inputId, previewId) {
    var input=document.getElementById(inputId);
    var preview=document.getElementById(previewId);
    if(!input||!preview) return;
    var cod=input.value.trim();
    if(!cod){ preview.textContent=''; preview.style.color=''; return; }
    var found=buscarMotoristaPorCodigo(cod);
    if(found){
      preview.textContent=found.display;
      preview.style.color='var(--success)';
    } else {
      preview.textContent='Motorista nao encontrado para o codigo: '+cod;
      preview.style.color='var(--danger)';
    }
  },

  async salvar() {
    var id = document.getElementById('oc-form-id').value;
    var get = function(sel){ return (document.getElementById(sel)||{}).value||''; };
    var tipo      = get('oc-tipo-sel');
    var descricao = get('oc-desc');
    if (!tipo || !descricao.trim()) { Toast.warning('Preencha os campos obrigatorios'); return; }

    var motCod    = get('oc-motorista-cod').trim();
    var motFound  = motCod ? buscarMotoristaPorCodigo(motCod) : null;
    if (motCod && !motFound) {
      if (!confirm('Codigo de motorista "' + motCod + '" nao encontrado. Gravar assim mesmo?')) return;
    }
    var motorista = motFound ? motFound.display : motCod;

    var podeResolucao = await temPermissao('alterarResolucaoDevolucao');
    var existingForResol = id ? await DB.find(DB.KEYS.OCORRENCIAS,id) : null;

    var data = {
      tipo: tipo, prioridade: '', descricao: descricao,
      status:    get('oc-status-sel') || 'ABERTA',
      cliente:   get('oc-cliente-txt'),
      motorista: motorista,
      responsavelId: get('oc-responsavel-sel') || null,
      notaFiscal: get('oc-nf'),
      localOcorrencia: get('oc-local'),
      valorMercadoria: parseFloat(get('oc-valor')) || 0,
      observacoes: get('oc-obs'),
      justificativa: get('oc-justificativa'),
      tratativaCom: get('oc-tratativa-sel'),
      resolucaoDevolucao: (podeResolucao ? get('oc-resolucao-dev') : (existingForResol ? existingForResol.resolucaoDevolucao||'' : '')),
    };

    var user = Session.get();
    if (id) {
      var existing = await DB.find(DB.KEYS.OCORRENCIAS, id);
      var historico = existing ? (existing.historico || []) : [];

      var camposRastreados = [
        ['Status',              existing.status,           data.status],
        ['Tipo',                existing.tipo,             data.tipo],
        ['Cliente',             existing.cliente,          data.cliente],
        ['Motorista',           existing.motorista,        data.motorista],
        ['Nota Fiscal',         existing.notaFiscal,       data.notaFiscal],
        ['Local',               existing.localOcorrencia,  data.localOcorrencia],
        ['Descricao',           existing.descricao,        data.descricao],
        ['Observacoes',         existing.observacoes,      data.observacoes],
        ['Justificativa',       existing.justificativa,    data.justificativa],
        ['Tratativa com',      existing.tratativaCom,     data.tratativaCom],
        ['Resolucao Devolucao', existing.resolucaoDevolucao, data.resolucaoDevolucao],
      ];

      camposRastreados.forEach(function(c) {
        var anterior = c[1] || '';
        var novo     = c[2] || '';
        if (anterior !== novo) {
          historico.push({
            data: new Date().toISOString(),
            usuario: user ? user.nome : 'Sistema',
            usuarioId: user ? user.id : '',
            acao: 'Campo "' + c[0] + '" alterado',
            campo: c[0],
            valorAnterior: String(anterior),
            novoValor: String(novo),
          });
        }
      });

      data.historico = historico;
      await DB.update(DB.KEYS.OCORRENCIAS, id, data);
      await logAction('EDICAO', 'Ocorrencia', id);
      Toast.success('Ocorrencia atualizada com sucesso!');
      // Notificações de atualização
      (async function(eid, edata, eexisting) {
        var codigo = eexisting.codigo||eid;
        await Notificacoes.criar({ modulo:'devolucao', tipo:'atualizacao', registroId:eid, registroCodigo:codigo, titulo:'📦 Devolução '+codigo+' atualizada', descricao:'Status: '+edata.status+(edata.tratativaCom?' · Tratativa: '+edata.tratativaCom:'') });
        if (edata.responsavelId && edata.responsavelId !== eexisting.responsavelId)
          await Notificacoes.notificarResponsavel(edata.responsavelId, '👤 Você é responsável pela Devolução '+codigo, 'Você foi definido como responsável.', 'responsavel', eid, codigo);
        if (edata.tratativaCom && edata.tratativaCom !== eexisting.tratativaCom)
          await Notificacoes.criar({ modulo:'tratativa', tipo:'tratativa', registroId:eid, registroCodigo:codigo, titulo:'🔄 Tratativa alterada — '+codigo, descricao:'De: '+(eexisting.tratativaCom||'—')+' → Para: '+edata.tratativaCom });
        if (edata.resolucaoDevolucao && edata.resolucaoDevolucao !== eexisting.resolucaoDevolucao)
          await Notificacoes.criar({ modulo:'devolucao', tipo:'status', registroId:eid, registroCodigo:codigo, titulo:'📦 Resolução alterada — '+codigo, descricao:'Resolução: '+edata.resolucaoDevolucao });
      })(id, data, existing).catch(function(e){ console.warn('[Notif] Erro em notificação de edição:', e.message); });
    } else {
      var count = (await DB.getAll(DB.KEYS.OCORRENCIAS)).length + 1;
      data.codigo = 'OC-' + new Date().getFullYear() + '-' + String(count).padStart(4,'0');
      data.historico = [{
        data: new Date().toISOString(),
        usuario: user ? user.nome : 'Sistema',
        usuarioId: user ? user.id : '',
        acao: 'Ocorrência registrada',
        campo: '', valorAnterior: '', novoValor: '',
      }];
      var created = await DB.insert(DB.KEYS.OCORRENCIAS, data);
      await logAction('CRIACAO', 'Ocorrencia', created ? created.id : '');
      Toast.success('Ocorrencia registrada com sucesso!');
      if (created) {
        Promise.resolve().then(async function(){
          await Notificacoes.criar({ modulo:'devolucao', tipo:'criacao', registroId:created.id, registroCodigo:data.codigo, titulo:'📦 Nova Devolução: '+data.codigo, descricao:(data.tipo||'')+(data.cliente?' · '+data.cliente:'') });
          if (data.responsavelId) await Notificacoes.notificarResponsavel(data.responsavelId, '👤 Você é responsável pela Devolução '+data.codigo, 'Você foi definido como responsável.', 'responsavel', created.id, data.codigo);
        }).catch(function(e){ console.warn('[Notif] Erro em notificação de criação:', e.message); });
      }
    }
    Modal.close('modal-ocorrencia');
    await this.render();
    await App.updateAlertBadge();
  },

  excluir(id) {
    var self = this;
    DB.find(DB.KEYS.OCORRENCIAS, id).then(function(o) {
      confirmDialog('Arquivar Ocorrência',
        'A ocorrência ' + (o ? o.codigo : '') + ' será arquivada (não excluída definitivamente). O registro fica disponível na Auditoria.',
        async function() {
          await DB.delete(DB.KEYS.OCORRENCIAS, id); // soft-delete (já registra histórico internamente)
          await logAction('ARQUIVAMENTO', 'Ocorrencia', id);
          Toast.info('Ocorrência arquivada. Disponível em Auditoria.');
          await self.render();
          await App.updateAlertBadge();
        }
      );
    });
  },
};

// -- Nova Ocorrencia (pagina dedicada) --------------------------
const NovaOcorrenciaPage = {
  async load() {
    var users=(await DB.getAll(DB.KEYS.USERS)).filter(function(u){return u.ativo;});
    var selR=document.getElementById('nova-responsavel');
    if(selR){
      selR.innerHTML='<option value="">Selecionar...</option>'+users.map(function(u){
        return '<option value="'+u.id+'">'+u.nome+'</option>';
      }).join('');
      var sess=Session.get();
      if(sess && sess.id) selR.value=sess.id;
    }
    // Tratativa com — select dinâmico
    var tcEl = document.getElementById('nova-tratativa-container');
    if (tcEl) tcEl.innerHTML = buildTratativaSelect('nova-tratativa-sel', '');

    var motInput=document.getElementById('nova-motorista-cod');
    if(motInput){
      motInput.addEventListener('input',function(){
        NovaOcorrenciaPage._previewMotorista();
      });
    }
  },
  _previewMotorista() {
    var input=document.getElementById('nova-motorista-cod');
    var preview=document.getElementById('nova-motorista-preview');
    if(!input||!preview) return;
    var cod=input.value.trim();
    if(!cod){ preview.textContent=''; preview.style.color=''; return; }
    var found=buscarMotoristaPorCodigo(cod);
    if(found){
      preview.textContent=found.display;
      preview.style.color='var(--success)';
    } else {
      preview.textContent='Codigo nao encontrado';
      preview.style.color='var(--danger)';
    }
  },
  async salvar() {
    var get=function(id){return (document.getElementById(id)||{}).value||'';};
    var tipo =get('nova-tipo'), desc=get('nova-desc');
    if(!tipo||!desc.trim()){Toast.warning('Preencha ao menos o Tipo e uma Descrição');return;}

    var motCod  =get('nova-motorista-cod').trim();
    var motFound=motCod?buscarMotoristaPorCodigo(motCod):null;
    if(motCod && !motFound){
      if(!confirm('Codigo de motorista "'+motCod+'" nao encontrado. Gravar assim mesmo?')) return;
    }
    var motorista=motFound?motFound.display:motCod;

    var user=Session.get();
    var count=(await DB.getAll(DB.KEYS.OCORRENCIAS)).length+1;
    var codigo='OC-'+new Date().getFullYear()+'-'+String(count).padStart(4,'0');
    var oc={
      codigo:codigo, tipo:tipo, prioridade:'', status:'ABERTA',
      cliente:   get('nova-cliente'),
      motorista: motorista,
      responsavelId: get('nova-responsavel') || null,
      notaFiscal: get('nova-nf'), localOcorrencia: get('nova-local'),
      valorMercadoria: parseFloat(get('nova-valor'))||0,
      descricao: desc, observacoes: get('nova-obs'),
      tratativaCom: get('nova-tratativa-sel') || '',
      historico:[{acao:'Ocorrencia registrada',usuario:user?user.nome:'Sistema',usuarioId:user?user.id:'',data:new Date().toISOString()}],
    };
    var created = await DB.insert(DB.KEYS.OCORRENCIAS,oc);
    await logAction('CRIACAO','Ocorrencia',created?created.id:'');

    // ── Vínculo bidirecional: se gerado a partir de um atendimento ──
    if (NovaOcorrenciaPage._atendimentoOrigemId && created && created.id) {
      var atId = NovaOcorrenciaPage._atendimentoOrigemId;
      NovaOcorrenciaPage._atendimentoOrigemId = null;
      try {
        // Atualiza a ocorrência com referência ao atendimento
        await DB.update(DB.KEYS.OCORRENCIAS, created.id, { atendimentoOrigemId: atId });
        // Atualiza o atendimento com referência à ocorrência gerada
        var atExist = await DB.find(DB.KEYS.ATENDIMENTOS, atId);
        if (atExist) {
          var atHist = atExist.historico || [];
          atHist.push({ data:new Date().toISOString(), usuario:user?user.nome:'Sistema', usuarioId:user?user.id:'', acao:'Ocorrência gerada: '+codigo, campo:'ocorrenciaId', valorAnterior:'', novoValor:created.id });
          await DB.update(DB.KEYS.ATENDIMENTOS, atId, { ocorrenciaId: created.id, ocorrenciaTipo: 'devolucao', status: 'CONVERTIDO', historico: atHist });
        }
      } catch(e) { console.warn('Falha ao vincular atendimento/ocorrência:', e); }
    }

    Toast.success('Ocorrencia '+codigo+' registrada com sucesso!');
    ['nova-tipo','nova-prior','nova-nf','nova-local','nova-valor','nova-desc','nova-obs',
     'nova-cliente','nova-motorista-cod'].forEach(function(id){
      var e=document.getElementById(id); if(e) e.value='';
    });
    var prev=document.getElementById('nova-motorista-preview');
    if(prev){prev.textContent='';prev.style.color='';}
    await App.updateAlertBadge();
    setTimeout(function(){App.navigate('ocorrencias');},1200);
  },
};

