
// ===============================================================
// LogiTrack SAC — App Router & Layout
// ===============================================================
var App = {
  currentPage: 'dashboard',
  sidebarCollapsed: false,

  async init() {
    this.showBootScreen('Conectando ao banco de dados...');
    try {
      await initDB();
    } catch (e) {
      this.showBootError(e);
      return;
    }
    Toast.init();
    Theme.init();
    await refreshMotoristasImportados();
    await refreshTiposOcorrencia();
    await refreshTratativas();

    if (!Session.isLogged()) { this.hideBootScreen(); this.showLogin(); return; }
    await this.showApp();
    await this.navigate('dashboard');
    // Notificações
    await Notificacoes.atualizarContador();
    setTimeout(function(){ Notificacoes.verificarPrazos(); iniciarVerificacaoPrazos(); Notificacoes.iniciarRealtime(); }, 5000);
    this.hideBootScreen();
  },

  showBootScreen(msg) {
    var el = document.getElementById('boot-screen');
    if (el) { el.style.display = 'flex'; var t = el.querySelector('.boot-msg'); if (t) t.textContent = msg; }
  },
  hideBootScreen() {
    var el = document.getElementById('boot-screen');
    if (el) el.style.display = 'none';
  },
  showBootError(err) {
    var el = document.getElementById('boot-screen');
    if (!el) { alert('Erro ao conectar ao banco: ' + err.message); return; }
    el.innerHTML =
      '<div style="max-width:420px;text-align:center;padding:24px">' +
      '<div style="font-size:32px;margin-bottom:12px">⚠️</div>' +
      '<h2 style="margin-bottom:8px;color:var(--text-primary)">Não foi possível conectar ao banco de dados</h2>' +
      '<p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Verifique o armazenamento local do navegador (localStorage). Tente recarregar a página.</p>' +
      '<pre style="background:var(--bg-stripe);padding:10px;border-radius:8px;font-size:11px;text-align:left;overflow:auto;color:var(--danger)">' + (err && err.message ? err.message : err) + '</pre>' +
      '<button class="btn btn-primary" style="margin-top:16px" onclick="location.reload()">Tentar novamente</button>' +
      '</div>';
  },

  showLogin() {
    document.getElementById('login-page').style.display='flex';
    document.getElementById('app').style.display='none';
  },

  async showApp() {
    document.getElementById('login-page').style.display='none';
    document.getElementById('app').style.display='flex';
    await refreshUsersCache();
    await this.renderSidebar();
    await this.renderHeader();
    await this.updateAlertBadge();
  },

  async renderSidebar() {
    const user = await getUsuarioAtual();
    const isAdmin = user ? user.perfil==='ADMINISTRADOR' : false;
    const isSup   = user ? (user.perfil==='SUPERVISOR'||isAdmin) : false;
    const alertCount = await this.getAlertCount();

    const nav=[
      { section:'Principal' },
      { id:'dashboard',      label:'Dashboard SAC',        icon:'home',     roles:['all'] },
      { id:'ocorrencias',    label:'Devoluções',           icon:'alert',    roles:['all'],  notifKey:'devolucao' },
      { id:'reentregas',     label:'Reentregas',           icon:'refresh',  roles:['all'],  notifKey:'reentrega' },
      { id:'sobras-faltas',  label:'Sobras / Faltas',      icon:'list',     roles:['all'],  notifKey:'sobra_falta' },
      { id:'atendimentos',   label:'Atendimentos',         icon:'message',  roles:['all'],  notifKey:'atendimento' },
      { id:'nova',           label:'Nova Devolução',       icon:'plus',     roles:['all'] },

      { section:'Análise' },
      { id:'dashboard-exec',  label:'Dashboard Devoluções',  icon:'chart',   roles:['sup'] },
      { id:'dash-reentregas', label:'Dashboard Reentregas',  icon:'chart',   roles:['sup'] },
      { id:'dash-sf',         label:'Dashboard Sobras/Faltas',icon:'chart',  roles:['sup'] },
      { id:'rankings',        label:'Rankings',              icon:'star',    roles:['sup'] },
      { id:'relatorios',      label:'Relatórios',            icon:'file',    roles:['sup'] },

      { section:'Operação' },
      { id:'alertas',        label:'Alertas',              icon:'bell',     roles:['all'], badge:'alerts' },
      { id:'notificacoes',   label:'Notificações',         icon:'bell',     roles:['all'], notifKey:'_total' },
      { id:'metas',          label:'Metas',                icon:'target',   roles:['sup'] },
      { id:'arquivados',     label:'Arquivados',           icon:'shield',   roles:['all'] },
      { id:'auditoria',      label:'Auditoria',            icon:'shield',   roles:['admin'] },

      { section:'Sistema' },
      { id:'cadastros',      label:'Cadastros',            icon:'settings', roles:['admin'] },
      { id:'usuarios',       label:'Usuários',             icon:'user',     roles:['admin'] },
      { id:'configuracoes',  label:'Configurações',        icon:'settings', roles:['admin'] },
    ];

    let html='';
    nav.forEach(item=>{
      if(item.section){ html+=`<div class="nav-section">${item.section}</div>`; return; }
      if(!item.roles.includes('all')){
        if(item.roles.includes('admin')&&!isAdmin) return;
        if(item.roles.includes('sup')&&!isSup) return;
      }
      const badge=item.badge&&alertCount>0?`<span class="badge">${alertCount}</span>`:'';
      // A3: badge de notificações por módulo
      var notifBadge = '';
      if (item.notifKey && typeof Notificacoes !== 'undefined') {
        var cnt = item.notifKey === '_total'
          ? Notificacoes._naoLidas
          : (Notificacoes._countsByModulo[item.notifKey]||0);
        if (cnt > 0) notifBadge = `<span class="badge" style="background:var(--danger);color:#fff;margin-left:auto;min-width:18px;text-align:center">${cnt>99?'99+':cnt}</span>`;
      }
      const iconSvg = item.icon==='message'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
        : Icons.svg(item.icon,18);
      html+=`<div class="nav-item${this.currentPage===item.id?' active':''}" data-page="${item.id}">${iconSvg}<span class="nav-label">${item.label}</span>${badge}${notifBadge}</div>`;
    });

    document.getElementById('sidebar-nav').innerHTML=html;
    document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
      el.addEventListener('click',()=>{
        App.navigate(el.dataset.page);
        if(window.innerWidth<=768) App.closeSidebarMobile();
      });
    });
    if(user){
      document.getElementById('sidebar-user-initials').textContent=getInitials(user.nome);
      document.getElementById('sidebar-user-name').textContent=user.nome;
      document.getElementById('sidebar-user-role').textContent=user.perfil;
    }
  },

  async renderHeader() {
    const user = await getUsuarioAtual();
    document.getElementById('header-user-avatar').textContent=getInitials(user?.nome||'');
  },

  async navigate(pageId) {
    this.currentPage=pageId;
    document.querySelectorAll('.nav-item[data-page]').forEach(el=>{
      el.classList.toggle('active',el.dataset.page===pageId);
    });
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    const el=document.getElementById('page-'+pageId);
    if(el) el.classList.add('active');

    const titles={
      dashboard:'Dashboard SAC', ocorrencias:'Devoluções', nova:'Nova Devolução',
      reentregas:'Reentregas', 'sobras-faltas':'Sobras / Faltas',
      atendimentos:'Atendimentos',
      'dashboard-exec':'Dashboard — Devoluções',
      'dash-reentregas':'Dashboard — Reentregas',
      'dash-sf':'Dashboard — Sobras / Faltas',
      rankings:'Rankings', relatorios:'Relatórios',
      alertas:'Alertas', metas:'Metas', arquivados:'Arquivados', auditoria:'Auditoria',
      notificacoes:'Notificações',
      cadastros:'Cadastros', usuarios:'Usuários', configuracoes:'Configurações',
    };
    document.getElementById('header-title').textContent=titles[pageId]||pageId;

    const loaders={
      dashboard:        ()=>DashboardPage.load(),
      ocorrencias:      ()=>OcorrenciasPage.load(),
      reentregas:       ()=>ReentregasPage.load(),
      'sobras-faltas':  ()=>SobrasFaltasPage.load(),
      atendimentos:     ()=>AtendimentosPage.load(),
      nova:             ()=>NovaOcorrenciaPage.load(),
      'dashboard-exec': ()=>DashDevolucoes.load(),
      'dash-reentregas':()=>DashReentregas.load(),
      'dash-sf':        ()=>DashSobrasFaltasPage.load(),
      rankings:         ()=>RankingsPage.load(),
      relatorios:       ()=>RelatoriosPage.load(),
      alertas:          ()=>AlertasPage.load(),
      notificacoes:     ()=>NotificacoesPageFull.load(),
      metas:            ()=>MetasPage.load(),
      arquivados:       ()=>ArquivadosPage.load(),
      auditoria:        ()=>AuditoriaPage.load(),
      cadastros:        ()=>CadastrosPage.load(),
      usuarios:         ()=>UsuariosPage.load(),
      configuracoes:    ()=>ConfiguracoesPage.load(),
    };
    if(loaders[pageId]) {
      try { await loaders[pageId](); }
      catch(e) { console.error('Erro ao carregar página', pageId, e); Toast.error('Erro ao carregar dados. Tente novamente.'); }
    }
  },

  toggleSidebar() {
    this.sidebarCollapsed=!this.sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed',this.sidebarCollapsed);
  },
  openSidebarMobile()  { document.getElementById('sidebar').classList.add('mobile-open'); document.getElementById('sidebar-overlay').classList.add('open'); },
  closeSidebarMobile() { document.getElementById('sidebar').classList.remove('mobile-open'); document.getElementById('sidebar-overlay').classList.remove('open'); },

  async getAlertCount() {
    const ocs   = await DB.getActive(DB.KEYS.OCORRENCIAS);
    const reets = await DB.getActive(DB.KEYS.REENTREGAS);
    const read  = (await DB.get(DB.KEYS.ALERTS_READ)) || [];
    const criticas=ocs.filter(o=>(o.prioridade==='CRITICA'||o.status==='ABERTA')&&!read.includes(o.id));
    const semMot2=reets.filter(r=>!r.motoristaSecundario&&!['RESOLVIDA','CANCELADA'].includes(r.status)&&!read.includes('reet-semMot2-'+r.id));
    return criticas.length+semMot2.length;
  },

  async updateAlertBadge() {
    const count = await this.getAlertCount();
    const dot=document.getElementById('notif-dot');
    if(dot) dot.style.display=count>0?'block':'none';
    // Atualiza também o badge de notificações
    if (typeof Notificacoes !== 'undefined') await Notificacoes.atualizarContador();
  },

  logout() {
    confirmDialog('Sair','Deseja encerrar a sessão?',()=>{ Session.clear(); location.reload(); },false);
  },
};

async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var senha = document.getElementById('login-senha').value;
  var errEl = document.getElementById('login-error');
  if(errEl) errEl.textContent = '';

  var usuarios;
  try {
    usuarios = await DB.getAll(DB.KEYS.USERS);
  } catch(e1) {
    console.error('Erro ao consultar usuarios:', e1);
    if(errEl) errEl.textContent = 'Não foi possível conectar ao banco de dados. Tente novamente.';
    return;
  }

  var user = (usuarios||[]).find(function(u){ return (u.email||'').toLowerCase()===email; });

  if(!user || user.ativo===false || user.senhaHash !== sha256Hex(senha)){
    if(errEl) errEl.textContent='E-mail ou senha inválidos.';
    return;
  }

  Session.set({
    id:user.id, nome:user.nome, email:user.email, perfil:user.perfil,
    ativo:user.ativo, podeAlterarResolucao:!!user.podeAlterarResolucao,
    editarFinanceiro: user.perfil!=='OPERADOR',
  });

  try {
    await App.showApp();
    await App.navigate('dashboard');
    await Notificacoes.atualizarContador();
    setTimeout(function(){ Notificacoes.verificarPrazos(); iniciarVerificacaoPrazos(); Notificacoes.iniciarRealtime(); }, 3000);
    App.hideBootScreen();
  } catch(e3){
    console.error('Erro ao abrir app:', e3);
    // Fallback manual
    var lp = document.getElementById('login-page');
    var ap = document.getElementById('app');
    var bs = document.getElementById('boot-screen');
    if(lp) lp.style.display='none';
    if(ap) ap.style.display='flex';
    if(bs) bs.style.display='none';
  }
}

// ── Reset completo — limpa todos os dados locais ──
function loginResetDB() {
  if(!confirm('Isso irá apagar TODOS os dados locais e recriar os usuários padrão.\n\nContinuar?')) return;
  localStorage.clear();
  alert('Dados limpos. A página será recarregada.');
  location.reload();
}

document.addEventListener('DOMContentLoaded',()=>App.init());

