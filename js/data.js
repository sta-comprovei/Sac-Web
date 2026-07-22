
// ===============================================================
// LogiTrack SAC — Permissões, formatação e utilitários de domínio
// (A camada de persistência DB/Session vive em storage.js)
// ===============================================================
//
// IMPORTANTE: O login (ver app.js → handleLogin) consulta
// a coleção "usuarios" via DB.getAll(DB.KEYS.USERS).
// Os dados iniciais são carregados por initDB() em storage.js.
// ===============================================================

var STATUS_OC   = ['ABERTA','EM_ANDAMENTO','AGUARDANDO','RESOLVIDA','CANCELADA'];
var PRIORIDADES = ['CRITICA','ALTA','MEDIA','BAIXA'];

// ── Sistema de Permissões ────────────────────────────────────────
// getUsuarioAtual() busca sempre fresh do localStorage pelo ID da sessão,
// garantindo que permissões atualizadas reflitam na hora, mesmo sem novo login.

var _usuarioAtualCache = null;
var _usuarioAtualCacheTs = 0;

async function getUsuarioAtual() {
  var session = Session.get();
  if (!session || !session.id) return null;

  // Cache curto (2s) para não disparar uma query a cada verificação de permissão
  if (_usuarioAtualCache && (Date.now() - _usuarioAtualCacheTs) < 2000 && _usuarioAtualCache.id === session.id) {
    return _usuarioAtualCache;
  }
  var dbUser = await DB.find(DB.KEYS.USERS, session.id);
  var user = dbUser || session;
  _usuarioAtualCache = user;
  _usuarioAtualCacheTs = Date.now();
  return user;
}

function invalidateUsuarioAtualCache() { _usuarioAtualCache = null; }

async function temPermissao(perm) {
  var user = await getUsuarioAtual();
  if (!user) return false;
  if (PERMISSOES[user.id] && PERMISSOES[user.id][perm] !== undefined) {
    return !!PERMISSOES[user.id][perm];
  }
  if (user[perm] === true) return true;
  if (perm === 'alterarResolucaoDevolucao' && user.podeAlterarResolucao === true) return true;
  var perms = PERMISSOES[user.perfil] || {};
  return !!perms[perm];
}

// Mapa central de permissões por ID de usuário e por perfil
var PERMISSOES = {
  'ADMINISTRADOR': {
    gerenciarUsuarios: true, excluirDefinitivamente: true, restaurarArquivados: true,
    alterarResolucaoDevolucao: false, acessarConfiguracoes: true,
    cadastrarOcorrencias: true, editarOcorrencias: true,
    consultarDashboard: true, consultarRelatorios: true,
    editarFinanceiro: true,
  },
  'SUPERVISOR': {
    gerenciarUsuarios: false, excluirDefinitivamente: false, restaurarArquivados: true,
    alterarResolucaoDevolucao: false, acessarConfiguracoes: false,
    cadastrarOcorrencias: true, editarOcorrencias: true,
    consultarDashboard: true, consultarRelatorios: true,
    editarFinanceiro: true,
  },
  'OPERADOR': {
    gerenciarUsuarios: false, excluirDefinitivamente: false, restaurarArquivados: false,
    alterarResolucaoDevolucao: false, acessarConfiguracoes: false,
    cadastrarOcorrencias: true, editarOcorrencias: true,
    consultarDashboard: false, consultarRelatorios: false,
    editarFinanceiro: false,
  },
  // alterarResolucaoDevolucao NÃO é concedida por perfil (nem Administrador).
  // É exclusiva de usuários com a flag pode_alterar_resolucao=true no banco
  // (ver coluna na tabela "usuarios" — hoje, apenas Joel Marques).
  // A verificação real acontece em temPermissao() via user.podeAlterarResolucao,
  // nunca por perfil — exatamente como exigido pelas regras de negócio.
};

async function podeAlterarResolucao() { return temPermissao('alterarResolucaoDevolucao'); }
async function isAdmin() { var u = await getUsuarioAtual(); return u ? u.perfil === 'ADMINISTRADOR' : false; }
async function isSupervisor() { var u = await getUsuarioAtual(); return u ? (u.perfil==='SUPERVISOR'||u.perfil==='ADMINISTRADOR') : false; }

// ── Inicialização ──────────────────────────────────────────────
// Com Supabase, "inicializar" significa apenas validar a conexão.
// Usuários e dados já existem no banco (criados via schema.sql).
// Timeout de 10s evita que a tela de boot fique presa indefinidamente
// em caso de rede lenta, instável ou indisponível.
// [initDB Supabase removida — substituída pela versão localStorage em storage.js]

// ── Log de auditoria ──────────────────────────────────────────
async function logAction(acao, entidade, entidadeId) {
  var user = Session.get();
  try {
    await DB.insert(DB.KEYS.LOGS, {
      acao: acao, entidade: entidade || '', entidadeId: entidadeId || '',
      usuarioId: user ? user.id : null, usuarioNome: user ? user.nome : 'Sistema',
      ip: '',
    });
  } catch (e) {
    console.warn('Falha ao registrar log de auditoria:', e);
  }
}

// ── Formatação ─────────────────────────────────────────────────
function fmtDate(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function fmtDateTime(iso){
  if(!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function fmtRelative(iso){
  if(!iso) return '';
  var diff=Date.now()-new Date(iso).getTime(), mins=Math.floor(diff/60000);
  if(mins<1) return 'agora';
  if(mins<60) return mins+'min';
  var hrs=Math.floor(mins/60);
  if(hrs<24) return hrs+'h';
  var days=Math.floor(hrs/24);
  return days<30?days+'d':fmtDate(iso);
}
function fmtMoney(val){
  return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(val||0);
}
function getInitials(nome){
  return (nome||'').split(' ').slice(0,2).map(function(n){return n[0]||'';}).join('').toUpperCase();
}
function getCliente(v)    { return {nome:v||'—'}; }
function getMotorista(v)  { return {nome:getMotoristaDisplay(v)}; }
function getConferente(v) { return {nome:v||'—'}; }

// getUser agora precisa de cache local de usuários para uso síncrono em templates.
// _usersCache é populado por refreshUsersCache() chamado ao navegar para telas relevantes.
var _usersCache = [];
async function refreshUsersCache() {
  try { _usersCache = await DB.getAll(DB.KEYS.USERS); } catch(e) { _usersCache = []; }
  return _usersCache;
}
function getUser(id) {
  return _usersCache.find(function(u){return u.id===id;}) || {nome:'—'};
}

function badgeStatus(s){
  var m={ABERTA:'aberta',EM_ANDAMENTO:'andamento',AGUARDANDO:'aguardando',RESOLVIDA:'resolvida',CANCELADA:'cancelada'};
  var l={ABERTA:'Aberta',EM_ANDAMENTO:'Em Andamento',AGUARDANDO:'Aguardando',RESOLVIDA:'Resolvida',CANCELADA:'Cancelada'};
  return '<span class="badge badge-'+(m[s]||'aberta')+'">'+(l[s]||s)+'</span>';
}
function badgePrioridade(p){
  var m={CRITICA:'critica',ALTA:'alta',MEDIA:'media',BAIXA:'baixa'};
  var l={CRITICA:'Crítica',ALTA:'Alta',MEDIA:'Média',BAIXA:'Baixa'};
  return '<span class="badge badge-'+(m[p]||'media')+'">'+(l[p]||p)+'</span>';
}

// ── Histórico ─────────────────────────────────────────────────
function pushHistorico(historico,campos,user){
  campos.forEach(function(c){
    if(String(c[1]||'')!==String(c[2]||'')){
      historico.push({
        data:new Date().toISOString(), usuario:user?user.nome:'Sistema',
        usuarioId:user?user.id:'',
        acao:'Campo "'+c[0]+'" alterado',
        campo:c[0], valorAnterior:String(c[1]||''), novoValor:String(c[2]||''),
      });
    }
  });
  return historico;
}

