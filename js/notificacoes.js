
// ===============================================================
// LogiTrack SAC — Central de Notificações (v7)
// A1: Arquivamento | A2: Ações rápidas | A3: Contadores por módulo
// ===============================================================

var NOTIF_ICONES = {
  devolucao:   '📦',
  reentrega:   '🚚',
  atendimento: '📋',
  sobra_falta: '⚠️',
  financeiro:  '💰',
  responsavel: '👤',
  tratativa:   '🔄',
  prazo:       '⏰',
  '':          '🔔',
};

var NOTIF_MODULOS = {
  devolucao:   'Devolução',
  reentrega:   'Reentrega',
  atendimento: 'Atendimento',
  sobra_falta: 'Sobra/Falta',
  financeiro:  'Financeiro',
  responsavel: 'Responsável',
  tratativa:   'Tratativa',
  prazo:       'Prazo',
};

// Módulo → pageId de navegação
var NOTIF_ROTAS = {
  devolucao:   'ocorrencias',
  reentrega:   'reentregas',
  atendimento: 'atendimentos',
  sobra_falta: 'sobras-faltas',
};

// Módulo → chave DB para contagem
var NOTIF_MODULO_DBKEY = {
  devolucao:   'OCORRENCIAS',
  reentrega:   'REENTREGAS',
  sobra_falta: 'SOBRAS_FALTAS',
  atendimento: 'ATENDIMENTOS',
};

// ── Criar notificação ────────────────────────────────────────
var Notificacoes = {
  _panelOpen: false,
  _naoLidas:  0,
  _countsByModulo: {},   // { devolucao: 3, reentrega: 1, ... }
  _realtimeChannel: null,

  async criar(opts) {
    var user = Session.get();
    try {
      await DB.insert(DB.KEYS.NOTIFICACOES, {
        usuarioId:      opts.usuarioId || null,
        criadoPor:      user ? user.id : null,
        criadoPorNome:  user ? user.nome : 'Sistema',
        modulo:         opts.modulo || '',
        registroId:     opts.registroId || '',
        registroCodigo: opts.registroCodigo || '',
        titulo:         opts.titulo || '',
        descricao:      opts.descricao || '',
        tipo:           opts.tipo || '',
        lida:           false,
        arquivada:      false,
      });
      await this.atualizarTudo();
    } catch(e) {
      console.warn('Falha ao criar notificação:', e);
    }
  },

  async notificarResponsavel(responsavelId, titulo, descricao, modulo, registroId, registroCodigo) {
    if (!responsavelId) return;
    var user = Session.get();
    if (user && user.id === responsavelId) return;
    await this.criar({ usuarioId: responsavelId, modulo, tipo: 'responsavel', titulo, descricao, registroId, registroCodigo });
  },

  // ── Buscar notificações filtradas ────────────────────────────
  async buscar(filtros) {
    var user = Session.get();
    var all;
    try {
      all = await DB.getAll(DB.KEYS.NOTIFICACOES);
    } catch(e) {
      console.warn('[Notificacoes] Falha ao buscar notificações:', e.message);
      return [];
    }
    var isAdminUser = false;
    try { var u = await getUsuarioAtual(); isAdminUser = u && u.perfil === 'ADMINISTRADOR'; } catch(e) {}

    // Filtra por usuário (admin vê todas)
    if (!isAdminUser && user) {
      all = all.filter(function(n){ return !n.usuarioId || n.usuarioId === user.id; });
    }

    filtros = filtros || {};

    // A1: filtro de arquivamento
    if (filtros.arquivada === true) {
      all = all.filter(function(n){ return n.arquivada === true; });
    } else if (filtros.arquivada === false || filtros.arquivada === undefined) {
      // Por padrão, lista principal exclui arquivadas
      if (filtros.incluirArquivadas !== true) {
        all = all.filter(function(n){ return !n.arquivada; });
      }
    }

    if (filtros.modulo)           all = all.filter(function(n){ return n.modulo === filtros.modulo; });
    if (filtros.lida !== undefined) all = all.filter(function(n){ return n.lida === filtros.lida; });
    if (filtros.busca) {
      var b = filtros.busca.toLowerCase();
      all = all.filter(function(n){
        return (n.titulo||'').toLowerCase().includes(b)
          || (n.descricao||'').toLowerCase().includes(b)
          || (n.registroCodigo||'').toLowerCase().includes(b);
      });
    }
    return all.sort(function(a,b){ return new Date(b.dataCriacao)-new Date(a.dataCriacao); });
  },

  async contarNaoLidas() {
    var lista = await this.buscar({ lida: false });
    return lista.length;
  },

  // A3: Conta não lidas por módulo
  async contarPorModulo() {
    var lista = await this.buscar({ lida: false });
    var mapa = {};
    lista.forEach(function(n){
      if (n.modulo) mapa[n.modulo] = (mapa[n.modulo]||0) + 1;
    });
    return mapa;
  },

  // ── Atualizar tudo (sino + sidebar + painel se aberto) ────────
  async atualizarTudo() {
    await this.atualizarContador();
    await App.renderSidebar();
    if (this._panelOpen) await this.renderPanel();
  },

  async atualizarContador() {
    try {
      this._naoLidas = await this.contarNaoLidas();
      this._countsByModulo = await this.contarPorModulo();
    } catch(e) {
      this._naoLidas = 0;
      this._countsByModulo = {};
    }
    var badge = document.getElementById('notif-badge');
    var dot   = document.getElementById('notif-dot');
    if (badge) {
      badge.textContent = this._naoLidas > 99 ? '99+' : String(this._naoLidas);
      badge.style.display = this._naoLidas > 0 ? 'flex' : 'none';
    }
    if (dot) dot.style.display = this._naoLidas > 0 ? 'block' : 'none';
  },

  // Retorna badge HTML para o módulo (usado em renderSidebar)
  getModuloBadge(moduloKey) {
    var count = this._countsByModulo[moduloKey] || 0;
    if (count <= 0) return '';
    return '<span class="badge" style="background:var(--danger);color:#fff;margin-left:auto">'+(count>99?'99+':count)+'</span>';
  },

  // ── Ações sobre notificações ─────────────────────────────────
  async marcarLida(id) {
    await DB.update(DB.KEYS.NOTIFICACOES, id, { lida: true, dataLeitura: new Date().toISOString() });
    await this.atualizarTudo();
  },

  async marcarTodasLidas() {
    var lista = await this.buscar({ lida: false });
    for (var n of lista) {
      await DB.update(DB.KEYS.NOTIFICACOES, n.id, { lida: true, dataLeitura: new Date().toISOString() });
    }
    await this.atualizarTudo();
    Toast.success('Todas as notificações marcadas como lidas.');
  },

  // A1: Arquivar (soft — não exclui)
  async arquivar(id) {
    var user = Session.get();
    await DB.update(DB.KEYS.NOTIFICACOES, id, {
      arquivada:   true,
      arquivadaEm: new Date().toISOString(),
      arquivadaPor: user ? user.nome : 'Sistema',
      lida:        true,
    });
    await this.atualizarTudo();
    Toast.info('Notificação arquivada.');
  },

  // A1: Restaurar do arquivo
  async restaurar(id) {
    await DB.update(DB.KEYS.NOTIFICACOES, id, {
      arquivada:   false,
      arquivadaEm: null,
      arquivadaPor:'',
    });
    await this.atualizarTudo();
    Toast.success('Notificação restaurada.');
  },

  // A1: Excluir definitivo (somente admin)
  async excluirDefinitivo(id) {
    var isAdminUser = false;
    try { var u = await getUsuarioAtual(); isAdminUser = u && u.perfil === 'ADMINISTRADOR'; } catch(e) {}
    if (!isAdminUser) { Toast.error('Apenas Administradores podem excluir notificações definitivamente.'); return; }
    confirmDialog('Excluir Notificação', 'Esta ação é irreversível. Excluir definitivamente?', async function() {
      await DB.hardDelete(DB.KEYS.NOTIFICACOES, id);
      await Notificacoes.atualizarTudo();
      Toast.success('Notificação excluída definitivamente.');
    }, true);
  },

  // ── A2: Ações rápidas ─────────────────────────────────────────
  _buildAcoesRapidas(n) {
    var btns = '';
    var rota = NOTIF_ROTAS[n.modulo] || '';

    // Abrir Registro
    if (rota) {
      btns += '<button class="btn btn-primary btn-sm" style="font-size:11px;padding:3px 10px" onclick="Notificacoes.abrirRegistro(\''+rota+'\',\''+n.id+'\')">Abrir</button>';
    }

    // Assumir Ocorrência (devoluções e reentregas — cria/atribuição)
    if ((n.modulo === 'devolucao' || n.modulo === 'reentrega') && n.tipo === 'criacao' && n.registroId) {
      btns += '<button class="btn btn-secondary btn-sm" style="font-size:11px;padding:3px 10px" onclick="Notificacoes.assumirRegistro(\''+n.modulo+'\',\''+n.registroId+'\',\''+n.id+'\')">Assumir</button>';
    }

    // Alterar Status (registros abertos)
    if ((n.modulo === 'devolucao' || n.modulo === 'reentrega' || n.modulo === 'sobra_falta') && n.tipo !== 'prazo' && n.registroId) {
      btns += '<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 10px" onclick="Notificacoes.alterarStatus(\''+n.modulo+'\',\''+n.registroId+'\',\''+n.id+'\')">Alterar Status</button>';
    }

    // Marcar como Resolvida (só para registros não-financeiros)
    if ((n.modulo === 'devolucao' || n.modulo === 'reentrega' || n.modulo === 'sobra_falta') && n.tipo === 'criacao' && n.registroId) {
      btns += '<button class="btn btn-ghost btn-sm" style="font-size:11px;padding:3px 10px;color:var(--success)" onclick="Notificacoes.marcarResolvida(\''+n.modulo+'\',\''+n.registroId+'\',\''+n.id+'\')">✓ Resolvida</button>';
    }

    return btns ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">'+btns+'</div>' : '';
  },

  // Assumir: atribui o usuário logado como responsável
  async assumirRegistro(modulo, registroId, notifId) {
    var user = Session.get(); if (!user) return;
    var dbKey = NOTIF_MODULO_DBKEY[modulo];
    if (!dbKey) return;
    try {
      await DB.update(DB.KEYS[dbKey], registroId, { responsavelId: user.id });
      await DB.update(DB.KEYS.NOTIFICACOES, notifId, { lida: true, dataLeitura: new Date().toISOString() });
      Toast.success('Você assumiu a responsabilidade pelo registro.');
      await this.atualizarTudo();
    } catch(e) { Toast.error('Erro ao assumir registro: '+e.message); }
  },

  // Alterar Status: abre mini-modal inline
  async alterarStatus(modulo, registroId, notifId) {
    var dbKey = NOTIF_MODULO_DBKEY[modulo];
    if (!dbKey) return;
    var old = document.getElementById('notif-status-modal'); if (old) old.remove();
    var statusOptions = ['ABERTA','EM_ANDAMENTO','AGUARDANDO','RESOLVIDA','CANCELADA'];
    var m = document.createElement('div');
    m.id = 'notif-status-modal';
    m.className = 'modal-overlay open';
    m.style.zIndex = '2000';
    m.innerHTML = '<div class="modal modal-sm">'
      +'<div class="modal-header"><span class="modal-title">Alterar Status</span>'
        +'<button class="modal-close" onclick="document.getElementById(\'notif-status-modal\').remove()" style="background:none;border:none;cursor:pointer;display:flex;color:var(--text-secondary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +'</div>'
      +'<div class="modal-body"><div class="form-group"><label>Novo status</label><select class="select" id="notif-status-sel">'
        +statusOptions.map(function(s){ return '<option value="'+s+'">'+s.replace('_',' ')+'</option>'; }).join('')
      +'</select></div></div>'
      +'<div class="modal-footer">'
        +'<button class="btn btn-secondary" onclick="document.getElementById(\'notif-status-modal\').remove()">Cancelar</button>'
        +'<button class="btn btn-primary" onclick="Notificacoes._confirmarAlterarStatus(\''+dbKey+'\',\''+registroId+'\',\''+notifId+'\')">Salvar</button>'
      +'</div></div>';
    document.body.appendChild(m);
  },

  async _confirmarAlterarStatus(dbKey, registroId, notifId) {
    var novoStatus = document.getElementById('notif-status-sel')?.value;
    if (!novoStatus) return;
    try {
      await DB.update(DB.KEYS[dbKey], registroId, { status: novoStatus });
      await DB.update(DB.KEYS.NOTIFICACOES, notifId, { lida: true, dataLeitura: new Date().toISOString() });
      document.getElementById('notif-status-modal')?.remove();
      Toast.success('Status alterado para: '+novoStatus.replace('_',' '));
      await this.atualizarTudo();
    } catch(e) { Toast.error('Erro: '+e.message); }
  },

  // Marcar como Resolvida diretamente
  async marcarResolvida(modulo, registroId, notifId) {
    var dbKey = NOTIF_MODULO_DBKEY[modulo]; if (!dbKey) return;
    try {
      await DB.update(DB.KEYS[dbKey], registroId, { status: 'RESOLVIDA' });
      await DB.update(DB.KEYS.NOTIFICACOES, notifId, { lida: true, dataLeitura: new Date().toISOString() });
      Toast.success('Registro marcado como Resolvido.');
      await this.atualizarTudo();
    } catch(e) { Toast.error('Erro: '+e.message); }
  },

  // ── Abrir/fechar painel ──────────────────────────────────────
  async togglePanel() {
    var panel = document.getElementById('notif-panel');
    if (!panel) return;
    this._panelOpen = !this._panelOpen;
    panel.classList.toggle('open', this._panelOpen);
    var overlay = document.getElementById('notif-overlay');
    if (overlay) overlay.classList.toggle('open', this._panelOpen);
    if (this._panelOpen) {
      // Reseta filtros ao abrir
      document.getElementById('notif-filtro-lida') && (document.getElementById('notif-filtro-lida').value = '');
      this._filtros = {};
      await this.renderPanel();
    }
  },

  closePanel() {
    this._panelOpen = false;
    var p = document.getElementById('notif-panel'); if (p) p.classList.remove('open');
    var o = document.getElementById('notif-overlay'); if (o) o.classList.remove('open');
    var m = document.getElementById('notif-status-modal'); if (m) m.remove();
  },

  // ── Renderizar painel ─────────────────────────────────────────
  _filtros: {},
  async renderPanel() {
    var content = document.getElementById('notif-content');
    if (!content) return;
    var lista;
    var mostrando = this._filtros.arquivada === true ? 'arquivadas' : 'ativas';
    var filtros = Object.assign({}, this._filtros);
    try {
      lista = await this.buscar(filtros);
    } catch(e) {
      console.warn('[Notificacoes] renderPanel erro:', e.message);
      content.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">Notificações temporariamente indisponíveis.</div>';
      return;
    }
    var naoLidas = mostrando === 'ativas' ? lista.filter(function(n){ return !n.lida; }).length : 0;

    var countEl = document.getElementById('notif-panel-count');
    if (countEl) {
      countEl.textContent = mostrando === 'arquivadas'
        ? lista.length + ' arquivada(s)'
        : (naoLidas > 0 ? naoLidas + ' não lida(s)' : 'Tudo lido');
    }

    if (!lista.length) {
      var msg = mostrando === 'arquivadas' ? 'Nenhuma notificação arquivada.' : 'Nenhuma notificação.';
      content.innerHTML = '<div style="text-align:center;padding:48px 20px;color:var(--text-muted)"><div style="font-size:36px;margin-bottom:12px">🔔</div><p style="font-size:13px">'+msg+'</p></div>';
      return;
    }

    var self = this;
    var isAdminUser = false;
    try { var u = await getUsuarioAtual(); isAdminUser = u && u.perfil === 'ADMINISTRADOR'; } catch(e) {}

    content.innerHTML = lista.map(function(n) {
      var icone   = NOTIF_ICONES[n.modulo] || '🔔';
      var lida    = n.lida;
      var arquiv  = n.arquivada;

      // Ações de gerenciamento
      var acoesMgmt = '<div style="display:flex;gap:4px;flex-shrink:0;align-items:center">';
      if (!lida)   acoesMgmt += '<button class="btn btn-ghost btn-icon btn-sm" title="Marcar como lida" onclick="Notificacoes.marcarLida(\''+n.id+'\')" style="color:var(--success)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg></button>';
      if (!arquiv) acoesMgmt += '<button class="btn btn-ghost btn-icon btn-sm" title="Arquivar" onclick="Notificacoes.arquivar(\''+n.id+'\')" style="color:var(--text-muted)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg></button>';
      if (arquiv)  acoesMgmt += '<button class="btn btn-ghost btn-icon btn-sm" title="Restaurar" onclick="Notificacoes.restaurar(\''+n.id+'\')" style="color:var(--brand-500)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg></button>';
      if (isAdminUser) acoesMgmt += '<button class="btn btn-ghost btn-icon btn-sm" title="Excluir definitivamente (Admin)" onclick="Notificacoes.excluirDefinitivo(\''+n.id+'\')" style="color:var(--danger)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>';
      acoesMgmt += '</div>';

      // A2: Ações rápidas (apenas notificações ativas)
      var acoesRapidas = !arquiv ? self._buildAcoesRapidas(n) : '';

      return '<div class="notif-item'+(lida?'':' notif-nao-lida')+(arquiv?' notif-arquivada':'')+'" style="border-left:3px solid '+(arquiv?'var(--border)':lida?'transparent':'var(--brand-500)')+';">'
        + '<div class="notif-icone">'+icone+'</div>'
        + '<div class="notif-corpo">'
          + '<div class="notif-titulo">'+n.titulo+'</div>'
          + (n.descricao?'<div class="notif-desc">'+n.descricao+'</div>':'')
          + '<div class="notif-meta">'
            + fmtRelative(n.dataCriacao)
            + (n.registroCodigo?' · <span class="td-code" style="font-size:10px">'+n.registroCodigo+'</span>':'')
            + (n.criadoPorNome?' · '+n.criadoPorNome:'')
            + (arquiv?' · <em>Arquivada</em>':'')
          + '</div>'
          + acoesRapidas
        + '</div>'
        + '<div class="notif-acoes">'+acoesMgmt+'</div>'
        + '</div>';
    }).join('');
  },

  async abrirRegistro(rota, notifId) {
    try { await DB.update(DB.KEYS.NOTIFICACOES, notifId, { lida: true, dataLeitura: new Date().toISOString() }); } catch(e){}
    this.closePanel();
    await App.navigate(rota);
    await this.atualizarContador();
  },

  // ── A1: Filtros do painel (incluindo Arquivadas) ──────────────
  async aplicarFiltros() {
    var busca    = document.getElementById('notif-busca')?.value||'';
    var modulo   = document.getElementById('notif-filtro-modulo')?.value||'';
    var soLidas  = document.getElementById('notif-filtro-lida')?.value||'';

    this._filtros = {};
    if (busca)   this._filtros.busca  = busca;
    if (modulo)  this._filtros.modulo = modulo;

    if (soLidas === 'nao')      { this._filtros.lida = false; }
    else if (soLidas === 'sim') { this._filtros.lida = true; }
    else if (soLidas === 'arq') { this._filtros.arquivada = true; }

    await this.renderPanel();
  },

  // ── Verificação de prazos ─────────────────────────────────────
  async verificarPrazos() {
    var agora = Date.now();
    var h24   = 24*3600000;
    var h48   = 48*3600000;
    try {
      var ocs = (await DB.getAll(DB.KEYS.OCORRENCIAS)).filter(function(o){
        return !o.arquivado && ['ABERTA','EM_ANDAMENTO'].includes(o.status) && (agora-new Date(o.createdAt))>h48;
      });
      for (var o of ocs.slice(0,5)) {
        var recentes = await DB.getAll(DB.KEYS.NOTIFICACOES);
        var ja = recentes.some(function(n){ return n.registroId===o.id && n.tipo==='prazo' && (agora-new Date(n.dataCriacao))<6*3600000; });
        if (!ja) await this.criar({ modulo:'prazo', tipo:'prazo', registroId:o.id, registroCodigo:o.codigo, titulo:'⏰ Devolução sem atualização há 48h', descricao:o.codigo+' — '+(o.tipo||'')+(o.cliente?' · '+o.cliente:'') });
      }
      var reets = (await DB.getAll(DB.KEYS.REENTREGAS)).filter(function(r){
        return !r.arquivado && ['ABERTA','EM_ANDAMENTO','AGUARDANDO'].includes(r.status) && (agora-new Date(r.createdAt))>h24;
      });
      for (var r of reets.slice(0,5)) {
        var rec2 = await DB.getAll(DB.KEYS.NOTIFICACOES);
        var ja2 = rec2.some(function(n){ return n.registroId===r.id && n.tipo==='prazo' && (agora-new Date(n.dataCriacao))<6*3600000; });
        if (!ja2) await this.criar({ modulo:'prazo', tipo:'prazo', registroId:r.id, registroCodigo:r.codigo, titulo:'⏰ Reentrega aguardando há 24h', descricao:r.codigo+' — '+(r.motivo||'')+(r.cliente?' · '+r.cliente:'') });
      }
    } catch(e) { console.warn('Erro ao verificar prazos:', e); }
    await this.atualizarContador();
  },

  // ── A3: Polling para atualizar contadores ────────────────────
  iniciarRealtime() {
    // Polling leve a cada 30s para atualizar contadores e sidebar
    var self = this;
    setInterval(async function() {
      if (document.visibilityState === 'visible') {
        await self.atualizarContador();
        if (typeof App !== 'undefined') await App.renderSidebar();
      }
    }, 30000);
  },
};

// ── Inicialização ─────────────────────────────────────────────
var _notifPrazoInterval = null;
function iniciarVerificacaoPrazos() {
  if (_notifPrazoInterval) clearInterval(_notifPrazoInterval);
  _notifPrazoInterval = setInterval(function(){ Notificacoes.verificarPrazos(); }, 30*60*1000);
}

// ── Página completa de Notificações ─────────────────────────
var NotificacoesPageFull = {
  _filtros: {},

  async load() {
    await this._renderFiltros();
    await this._render();
  },

  async _renderFiltros() {
    var el = document.getElementById('notif-full-filters'); if (!el) return;
    el.innerHTML =
      '<div class="input-group" style="flex:1;min-width:200px">'
        +'<span class="input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>'
        +'<input class="input" id="notif-full-busca" placeholder="Buscar..." style="height:34px;font-size:12.5px" oninput="NotificacoesPageFull._aplicar()">'
      +'</div>'
      +'<select class="select" id="notif-full-modulo" style="height:34px;font-size:12.5px;width:auto" onchange="NotificacoesPageFull._aplicar()">'
        +'<option value="">Todos os módulos</option>'
        +'<option value="devolucao">📦 Devoluções</option>'
        +'<option value="reentrega">🚚 Reentregas</option>'
        +'<option value="atendimento">📋 Atendimentos</option>'
        +'<option value="sobra_falta">⚠️ Sobras/Faltas</option>'
        +'<option value="financeiro">💰 Financeiro</option>'
        +'<option value="responsavel">👤 Responsável</option>'
        +'<option value="tratativa">🔄 Tratativa</option>'
        +'<option value="prazo">⏰ Prazo</option>'
      +'</select>'
      // A1: filtro com Arquivadas
      +'<select class="select" id="notif-full-estado" style="height:34px;font-size:12.5px;width:auto" onchange="NotificacoesPageFull._aplicar()">'
        +'<option value="ativas">Ativas (não arquivadas)</option>'
        +'<option value="nao">Não lidas</option>'
        +'<option value="sim">Lidas</option>'
        +'<option value="arq">Arquivadas</option>'
        +'<option value="todas">Todas</option>'
      +'</select>'
      +'<button class="btn btn-secondary btn-sm" onclick="Notificacoes.marcarTodasLidas()">✓ Marcar todas lidas</button>';
  },

  async _aplicar() {
    var busca  = document.getElementById('notif-full-busca')?.value||'';
    var modulo = document.getElementById('notif-full-modulo')?.value||'';
    var estado = document.getElementById('notif-full-estado')?.value||'ativas';
    this._filtros = {};
    if (busca)  this._filtros.busca  = busca;
    if (modulo) this._filtros.modulo = modulo;
    if (estado === 'nao')    this._filtros.lida = false;
    else if (estado === 'sim') this._filtros.lida = true;
    else if (estado === 'arq') this._filtros.arquivada = true;
    else if (estado === 'todas') this._filtros.incluirArquivadas = true;
    await this._render();
  },

  async _render() {
    var el = document.getElementById('notif-full-content'); if (!el) return;
    var lista;
    try {
      lista = await Notificacoes.buscar(this._filtros);
    } catch(e) {
      console.warn('[NotificacoesPageFull] Erro ao carregar:', e.message);
      el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Não foi possível carregar as notificações. Verifique a conexão.</div>';
      return;
    }
    var naoLidas = lista.filter(function(n){ return !n.lida && !n.arquivada; }).length;
    var cntEl = document.getElementById('notif-full-count');
    if (cntEl) cntEl.textContent = lista.length+' notificação(ões) · '+naoLidas+' não lida(s)';

    if (!lista.length) {
      el.innerHTML = '<div style="text-align:center;padding:64px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:16px">🔔</div><p>Nenhuma notificação encontrada.</p></div>';
      return;
    }

    var isAdminUser = false;
    try { var u = await getUsuarioAtual(); isAdminUser = u && u.perfil === 'ADMINISTRADOR'; } catch(e){}

    el.innerHTML = lista.map(function(n) {
      var icone  = NOTIF_ICONES[n.modulo] || '🔔';
      var rota   = NOTIF_ROTAS[n.modulo] || '';
      var arquiv = n.arquivada;

      var acoes = '<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">';
      if (rota) acoes += '<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="Notificacoes.abrirRegistro(\''+rota+'\',\''+n.id+'\')">Abrir</button>';
      if (!n.lida) acoes += '<button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--success)" onclick="NotificacoesPageFull._marcarLida(\''+n.id+'\')">✓ Lida</button>';
      if (!arquiv) acoes += '<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="NotificacoesPageFull._arquivar(\''+n.id+'\')">Arquivar</button>';
      if (arquiv)  acoes += '<button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--brand-500)" onclick="NotificacoesPageFull._restaurar(\''+n.id+'\')">Restaurar</button>';
      if (isAdminUser) acoes += '<button class="btn btn-ghost btn-sm" style="font-size:11px;color:var(--danger)" onclick="Notificacoes.excluirDefinitivo(\''+n.id+'\')">Excluir</button>';
      acoes += '</div>';

      var acoesRapidas = !arquiv ? Notificacoes._buildAcoesRapidas(n) : '';

      return '<div class="notif-item'+(n.lida?'':' notif-nao-lida')+(arquiv?' notif-arquivada':'')+'" style="border-radius:var(--radius);margin-bottom:4px;border-left:3px solid '+(arquiv?'var(--border)':n.lida?'transparent':'var(--brand-500)')+';">'
        +'<div class="notif-icone">'+icone+'</div>'
        +'<div class="notif-corpo">'
          +'<div class="notif-titulo">'+n.titulo+(arquiv?' <span style="font-size:10px;color:var(--text-muted)">[Arquivada]</span>':'')+'</div>'
          +(n.descricao?'<div class="notif-desc">'+n.descricao+'</div>':'')
          +'<div class="notif-meta">'+fmtDateTime(n.dataCriacao)+(n.registroCodigo?' · <span class="td-code" style="font-size:10px">'+n.registroCodigo+'</span>':'')+(n.criadoPorNome?' · por '+n.criadoPorNome:'')+(n.modulo?' · '+(NOTIF_MODULOS[n.modulo]||n.modulo):'')+'</div>'
          +acoesRapidas
        +'</div>'
        +'<div class="notif-acoes">'+acoes+'</div>'
        +'</div>';
    }).join('');
  },

  async _marcarLida(id)  { await Notificacoes.marcarLida(id);  await this._render(); },
  async _arquivar(id)    { await Notificacoes.arquivar(id);    await this._render(); },
  async _restaurar(id)   { await Notificacoes.restaurar(id);   await this._render(); },
  async marcarTodas()    { await Notificacoes.marcarTodasLidas(); await this._render(); },
};

