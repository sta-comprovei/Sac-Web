// ================================================================
// LogiTrack SAC — storage.js  v3
//
// Modo Supabase  : preencha SUPABASE_URL e SUPABASE_ANON_KEY
// Modo Offline   : deixe as duas variáveis em branco
//
// Quando Supabase estiver configurado, TODO o CRUD usa Supabase.
// O localStorage é usado APENAS para sessão e chaves escalares.
// ================================================================

var SUPABASE_URL      = '';  // 'https://SEU-PROJETO.supabase.co'
var SUPABASE_ANON_KEY = '';  // 'eyJhbGci...'

// ── Modo ──────────────────────────────────────────────────────────
function _useSB() {
  return typeof SUPABASE_URL === 'string'
      && SUPABASE_URL.startsWith('https://')
      && typeof SUPABASE_ANON_KEY === 'string'
      && SUPABASE_ANON_KEY.length > 20;
}

// ── Mapeamento camelCase ↔ snake_case ─────────────────────────────
var _C2S = {
  createdAt:'created_at', updatedAt:'updated_at',
  arquivadoEm:'arquivado_em', arquivadaPor:'arquivada_por',
  arquivadaEm:'arquivada_em',
  senhaHash:'senha_hash',
  tratativaCom:'tratativa_com',
  responsavelId:'responsavel_id',
  ocorrenciaId:'ocorrencia_id',
  resolucaoDevolucao:'resolucao_devolucao',
  podeAlterarResolucao:'pode_alterar_resolucao',
  editarFinanceiro:'editar_financeiro',
  motoristaSecundario:'motorista_secundario',
  motoristaId:'motorista_id', motoristaCodigo:'motorista_codigo',
  origemDivergencia:'origem_divergencia',
  statusFinanceiro:'status_financeiro',
  valorIndenizacao:'valor_indenizacao',
  valorReembolso:'valor_reembolso',
  valorCredito:'valor_credito',
  formaPagamento:'forma_pagamento',
  dataPagamento:'data_pagamento',
  contatoNome:'contato_nome',
  contatoTelefone:'contato_telefone',
  contatoEmail:'contato_email',
  usuarioId:'usuario_id',
  criadoPor:'criado_por', criadoPorNome:'criado_por_nome',
  registroId:'registro_id', registroCodigo:'registro_codigo',
  dataLeitura:'data_leitura',
  historicoFinanceiro:'historico_financeiro',
  valorMeta:'valor_meta', valorAtual:'valor_atual',
  entidadeId:'entidade_id', usuarioNome:'usuario_nome',
  _mot1cod:'motorista_principal_codigo',
  _mot2cod:'motorista_secundario_codigo',
  _motCod:'motorista_codigo',
};
var _S2C = {};
Object.keys(_C2S).forEach(function(k){ _S2C[_C2S[k]] = k; });

function _toSnake(s){return s.replace(/([A-Z])/g,function(m){return'_'+m.toLowerCase();});}
function _toCamel(s){return s.replace(/_([a-z])/g,function(_,c){return c.toUpperCase();});}

// Converte objeto JS (camelCase) → objeto para Supabase (snake_case)
// IMPORTANTE: NÃO serializa arrays/objetos — o fetch serializa o body inteiro
function _toDb(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  var out = {};
  Object.keys(obj).forEach(function(k) {
    out[_C2S[k] || _toSnake(k)] = obj[k];   // valor nativo, sem JSON.stringify
  });
  return out;
}

// Converte linha do banco (snake_case) → objeto JS (camelCase)
function _fromDb(row) {
  if (!row || typeof row !== 'object') return row;
  var out = {};
  Object.keys(row).forEach(function(k) {
    var v = row[k];
    // Se o Supabase retornou string que parece JSON, parseia
    if (typeof v === 'string' && v.length > 1 && (v[0]==='['||v[0]==='{')) {
      try { v = JSON.parse(v); } catch(_) {}
    }
    out[_S2C[k] || _toCamel(k)] = v;
  });
  return out;
}
function _fromDbArr(arr){ return (arr||[]).map(_fromDb); }

// ── Supabase REST helper ──────────────────────────────────────────
function _sb(path, opts) {
  opts = opts || {};
  var base = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
  var h = {
    'apikey':         SUPABASE_ANON_KEY,
    'Authorization':  'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type':   'application/json',
    'Prefer':         opts.prefer || 'return=representation',
  };
  var body = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
  return fetch(base + path, { method: opts.method || 'GET', headers: h, body: body })
    .then(function(resp) {
      if (!resp.ok) {
        return resp.text().then(function(txt) {
          throw new Error('[Supabase ' + resp.status + '] ' + path + ' → ' + txt.slice(0,300));
        });
      }
      if (resp.status === 204) return null;
      return resp.json();
    });
}

// Coluna de ordem por tabela (exceções ao padrão created_at)
var _ORDER = { notificacoes: 'data_criacao' };

// ── Tabelas ───────────────────────────────────────────────────────
var TABLE_MAP = {
  USERS:'usuarios', OCORRENCIAS:'ocorrencias', REENTREGAS:'reentregas',
  SOBRAS_FALTAS:'sobras_faltas', LOGS:'logs', METAS:'metas',
  CONFIGS:'configuracoes', ATENDIMENTOS:'atendimentos',
  TIPOS_OCORRENCIA:'tipos_ocorrencia', MOTORISTAS_CADASTRO:'motoristas_cadastro',
  TRATATIVAS:'tratativas', NOTIFICACOES:'notificacoes',
};

// ── UUID ──────────────────────────────────────────────────────────
function genUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID(); } catch(_) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
  });
}

// ── SHA-256 (pure JS — funciona em file://) ───────────────────────
function sha256Hex(msg) {
  function rr(v,a){return(v>>>a)|(v<<(32-a));}
  var mp=Math.pow,mw=mp(2,32),res='',words=[],abl=msg.length*8;
  var k=[],ph=[],hash=[];
  var ip=function(n){for(var f=2;f*f<=n;f++)if(n%f===0)return false;return n>1;};
  for(var i=0,n=2;k.length<64;n++){if(ip(n)){if(ph.length<8)hash.push((mp(n,.5)*mw)|0);k.push((mp(n,1/3)*mw)|0);ph.push(n);}}
  msg+='\x80';while(msg.length%64!==56)msg+='\x00';
  for(var i=0;i<msg.length;i++){var j=msg.charCodeAt(i);if(j>>8)return'';words[i>>2]|=j<<((3-i)%4)*8;}
  words[words.length]=((abl/mw)|0);words[words.length]=(abl|0);
  for(var j=0;j<words.length;){
    var w=words.slice(j,j+=16),oh=hash.slice();
    for(var i=0;i<64;i++){
      var w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4];
      var t1=hash[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      var t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash=[(t1+t2)|0].concat(hash);hash[4]=(hash[4]+t1)|0;hash.length=8;
    }
    hash=hash.map(function(h,i){return(h+oh[i])|0;});
  }
  hash.forEach(function(h){for(var i=3;i>=0;i--)res+=((h>>(i*8))&255).toString(16).padStart(2,'0');});
  return res;
}

// ── localStorage (APENAS offline e sessão) ────────────────────────
var _LSP = 'lt_';
function _lsRead(t){try{var r=localStorage.getItem(_LSP+t);return r?JSON.parse(r):[];}catch(_){return[];}}
function _lsWrite(t,a){try{localStorage.setItem(_LSP+t,JSON.stringify(a));}catch(_){}}

// ── DB ────────────────────────────────────────────────────────────
var DB = {

  KEYS: {
    USERS:'USERS', OCORRENCIAS:'OCORRENCIAS', REENTREGAS:'REENTREGAS',
    SOBRAS_FALTAS:'SOBRAS_FALTAS', LOGS:'LOGS', METAS:'METAS', CONFIGS:'CONFIGS',
    ATENDIMENTOS:'ATENDIMENTOS', TIPOS_OCORRENCIA:'TIPOS_OCORRENCIA',
    MOTORISTAS_CADASTRO:'MOTORISTAS_CADASTRO', TRATATIVAS:'TRATATIVAS',
    NOTIFICACOES:'NOTIFICACOES',
    SESSION:'lt_session', ALERTS_READ:'lt_alerts_read',
  },

  async getAll(key) {
    var t = TABLE_MAP[key]; if (!t) return [];
    if (_useSB()) {
      var ord = _ORDER[t] || 'created_at';
      return _fromDbArr(await _sb('/'+t+'?select=*&order='+ord+'.desc'));
    }
    return _lsRead(t);
  },

  async getActive(key) {
    var t = TABLE_MAP[key]; if (!t) return [];
    if (_useSB()) {
      var ord = _ORDER[t] || 'created_at';
      return _fromDbArr(await _sb('/'+t+'?select=*&arquivado=eq.false&order='+ord+'.desc'));
    }
    return _lsRead(t).filter(function(r){return !r.arquivado;});
  },

  async find(key, id) {
    var t = TABLE_MAP[key]; if (!t) return null;
    if (_useSB()) {
      var rows = await _sb('/'+t+'?select=*&id=eq.'+id);
      return rows && rows.length ? _fromDb(rows[0]) : null;
    }
    return _lsRead(t).find(function(r){return r.id===id;})||null;
  },

  async insert(key, obj) {
    var t = TABLE_MAP[key]; if (!t) return null;
    var now = new Date().toISOString();
    var rec = Object.assign({}, obj, {
      id:        obj.id || genUUID(),
      createdAt: obj.createdAt || now,
      updatedAt: now,
    });
    if (_useSB()) {
      // Remove campos undefined para não enviar null desnecessário
      var payload = _toDb(rec);
      Object.keys(payload).forEach(function(k){ if(payload[k]===undefined) delete payload[k]; });
      var res = await _sb('/'+t, {method:'POST', body:payload});
      return res ? _fromDb(Array.isArray(res)?res[0]:res) : rec;
    }
    var rows = _lsRead(t); rows.push(rec); _lsWrite(t, rows); return rec;
  },

  async update(key, id, changes) {
    var t = TABLE_MAP[key]; if (!t) return null;
    if (_useSB()) {
      var payload = _toDb(Object.assign({}, changes, {updatedAt:new Date().toISOString()}));
      delete payload.id;
      Object.keys(payload).forEach(function(k){ if(payload[k]===undefined) delete payload[k]; });
      var res = await _sb('/'+t+'?id=eq.'+id, {method:'PATCH', body:payload});
      return res && res.length ? _fromDb(res[0]) : await this.find(key, id);
    }
    var all = _lsRead(t), idx = all.findIndex(function(r){return r.id===id;});
    if (idx===-1) return null;
    var up = Object.assign({}, all[idx], changes, {updatedAt:new Date().toISOString()});
    all[idx]=up; _lsWrite(t,all); return up;
  },

  async delete(key, id) {
    return this.update(key, id, {arquivado:true, arquivadoEm:new Date().toISOString()});
  },

  async hardDelete(key, id) {
    var t = TABLE_MAP[key]; if (!t) return;
    if (_useSB()) {
      await _sb('/'+t+'?id=eq.'+id, {method:'DELETE', prefer:'return=minimal'});
      return;
    }
    _lsWrite(t, _lsRead(t).filter(function(r){return r.id!==id;}));
  },

  async restore(key, id) {
    return this.update(key, id, {arquivado:false, arquivadoEm:null});
  },

  async replaceAll(key, arr) {
    var t = TABLE_MAP[key]; if (!t) return;
    if (_useSB()) {
      await _sb('/'+t+'?id=neq.00000000-0000-0000-0000-000000000000',
        {method:'DELETE', prefer:'return=minimal'});
      if (arr && arr.length) {
        var payload = arr.map(function(o){
          var p=_toDb(o);
          Object.keys(p).forEach(function(k){if(p[k]===undefined)delete p[k];});
          return p;
        });
        await _sb('/'+t, {method:'POST', body:payload});
      }
      return;
    }
    _lsWrite(t, arr||[]);
  },

  // Chaves escalares — sempre localStorage (dados de UI, não de negócio)
  async get(rawKey) {
    try { var r=localStorage.getItem(rawKey); return r?JSON.parse(r):null; } catch(_){return null;}
  },
  async set(rawKey, val) {
    try { localStorage.setItem(rawKey, JSON.stringify(val)); } catch(_){}
  },

  async getConfig() {
    if (_useSB()) {
      var rows = await _sb('/configuracoes?id=eq.1&select=*');
      return rows && rows[0] ? _fromDb(rows[0]) : {};
    }
    var rows = _lsRead('configuracoes'); return rows[0]||{};
  },

  async setConfig(changes) {
    if (_useSB()) {
      var payload = _toDb(Object.assign({}, changes, {updatedAt:new Date().toISOString()}));
      delete payload.id;
      await _sb('/configuracoes?id=eq.1', {method:'PATCH', body:payload});
      return;
    }
    var rows = _lsRead('configuracoes');
    var cfg = Object.assign({}, rows[0]||{}, changes); cfg.id=1;
    _lsWrite('configuracoes', [cfg]);
  },

  _invalidateCache:function(){}, _cache:{}, _cacheTTL:0,
};

// ── Session (sempre localStorage — dados de UI) ────────────────────
var Session = {
  get:      function(){try{return JSON.parse(localStorage.getItem('lt_session')||'null');}catch(_){return null;}},
  set:      function(u){localStorage.setItem('lt_session',JSON.stringify(u));},
  clear:    function(){localStorage.removeItem('lt_session');},
  isLogged: function(){return !!this.get();},
};

// ── MotoristasDB ──────────────────────────────────────────────────
var MotoristasDB = {
  async getAll() {
    if (_useSB()) return _fromDbArr(await _sb('/motoristas_importados?select=*&order=created_at.desc'));
    return _lsRead('motoristas_importados');
  },
  async replaceAll(arr) {
    if (_useSB()) {
      await _sb('/motoristas_importados?id=neq.00000000-0000-0000-0000-000000000000',
        {method:'DELETE',prefer:'return=minimal'});
      if (arr&&arr.length) await _sb('/motoristas_importados',{method:'POST',body:arr.map(_toDb)});
      return;
    }
    _lsWrite('motoristas_importados', arr);
  },
};

// ── SupabaseStorage (anexos — base64 em localStorage) ─────────────
var SupabaseStorage = {
  upload: function(file, atId) {
    return new Promise(function(resolve, reject) {
      var r = new FileReader();
      r.onload = function(e) {
        var url = e.target.result;
        var safe = file.name.replace(/[^a-zA-Z0-9_\-\.]/g,'_');
        var path = atId+'/'+Date.now()+'-'+safe;
        var k = _LSP+'attach_'+path.replace(/\//g,'_');
        try { localStorage.setItem(k, url); } catch(err) { console.warn('Anexo grande:', file.name); }
        resolve({path:path, nome:file.name, tipo:file.type||'application/octet-stream',
                 tamanho:file.size, uploadedAt:new Date().toISOString(), lsKey:k});
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  },
  getSignedUrl: async function(path) {
    return localStorage.getItem(_LSP+'attach_'+path.replace(/\//g,'_'))||null;
  },
  remove: async function(path) {
    localStorage.removeItem(_LSP+'attach_'+path.replace(/\//g,'_'));
  },
};

// ── initDB ────────────────────────────────────────────────────────
var DB_VERSION = '5';

async function initDB() {
  if (_useSB()) {
    // Verificar conectividade — lança erro se não conseguir
    await _sb('/usuarios?select=id&limit=1');
    console.log('[initDB] Supabase conectado ✅ — modo online');
    return;
  }

  // Offline: seed localStorage
  var ver = localStorage.getItem('lt_db_version');
  var ex  = _lsRead('usuarios');
  var tem = Array.isArray(ex) && ex.length > 0;
  var h   = sha256Hex('123456');
  var ok  = tem && ex.some(function(u){return u.email==='supervisor@logitrack.com'&&u.senhaHash===h;});

  if (!tem || ver !== DB_VERSION || !ok) {
    localStorage.setItem('lt_db_version', DB_VERSION);
    var now = new Date().toISOString();
    _lsWrite('usuarios',[
      {id:'a0000000-0000-0000-0000-000000000001',nome:'Carlos Mendes', email:'admin@logitrack.com',     senhaHash:sha256Hex('admin123'),perfil:'ADMINISTRADOR',ativo:true,podeAlterarResolucao:false,createdAt:now,updatedAt:now},
      {id:'a0000000-0000-0000-0000-000000000002',nome:'Ana Costa',     email:'supervisor@logitrack.com',senhaHash:sha256Hex('123456'),  perfil:'SUPERVISOR',   ativo:true,podeAlterarResolucao:false,createdAt:now,updatedAt:now},
      {id:'a0000000-0000-0000-0000-000000000003',nome:'João Oliveira', email:'operador@logitrack.com',  senhaHash:sha256Hex('oper123'), perfil:'OPERADOR',     ativo:true,podeAlterarResolucao:false,createdAt:now,updatedAt:now},
      {id:'a0000000-0000-0000-0000-000000000004',nome:'Maria Santos',  email:'maria@logitrack.com',     senhaHash:sha256Hex('maria123'),perfil:'OPERADOR',     ativo:true,podeAlterarResolucao:false,createdAt:now,updatedAt:now},
      {id:'a0000000-0000-0000-0000-000000000005',nome:'Joel Marques',  email:'joel@logitrack.com',      senhaHash:sha256Hex('joel123'), perfil:'SUPERVISOR',   ativo:true,podeAlterarResolucao:true, createdAt:now,updatedAt:now},
    ]);
    _lsWrite('tratativas',[
      {id:genUUID(),nome:'Motorista', ativo:true,createdAt:now,updatedAt:now},
      {id:genUUID(),nome:'Vendedor',  ativo:true,createdAt:now,updatedAt:now},
      {id:genUUID(),nome:'Cliente',   ativo:true,createdAt:now,updatedAt:now},
      {id:genUUID(),nome:'Supervisor',ativo:true,createdAt:now,updatedAt:now},
      {id:genUUID(),nome:'Financeiro',ativo:true,createdAt:now,updatedAt:now},
    ]);
    _lsWrite('configuracoes',[{id:1,empresa:'LogiTrack Transportes Ltda.',cnpj:'',telefone:'',email:'',endereco:'',updatedAt:now}]);
    var tipos=[['011','Excesso de Veículos'],['012','Fora do Horário'],['013','Estabelecimento Fechado'],
      ['014','Falta de XML'],['015','Atraso na Entrega'],['016','Carga Ultrapassou Capacidade'],
      ['017','Feriado Local/Nacional'],['018','Fora do Agendamento'],['019','Falta de Mercadoria'],
      ['020','Problema com o Pedido'],['021','Cliente Sem Sistema'],['022','Problema no Recebimento'],
      ['023','Mercadoria Avariada'],['025','Não Recebe no Sábado'],['026','Atraso na Entrega RCA'],
      ['027','Desistência do Cliente'],['028','Fora de Rota'],['029','Reentrega'],
      ['030','Erro do RCA / Sem Pedido'],['031','Mercadoria Próxima ao Vencimento'],
      ['032','Erro de Tributação'],['033','Pedido Duplicado'],['034','Cliente Não Pode Pagar'],
      ['035','Chocolate Derretido'],['036','Mercadoria Trocada'],['037','Motorista Não Passou'],
      ['038','Problema no Cadastro'],['039','Forma de Pagamento Divergente'],['040','Nota Denegada'],
      ['041','Erro Logístico'],['042','Carregamento Não Liberado'],['043','Abatimento de Boleto'],
      ['044','Prorrogação'],['045','Produto sem Cadastro'],['046','Problema com XML'],
      ['047','Nota Denegada (Fiscal)'],['995','Rota Cancelada'],['998','Motorista Não Justificou'],
    ].map(function(t){return{id:genUUID(),codigo:t[0],descricao:t[1],ativo:true,createdAt:now,updatedAt:now};});
    _lsWrite('tipos_ocorrencia',tipos);
    ['ocorrencias','reentregas','sobras_faltas','logs','metas','atendimentos',
     'notificacoes','motoristas_cadastro','motoristas_importados'].forEach(function(t){
      if(!localStorage.getItem(_LSP+t))_lsWrite(t,[]);
    });
    console.log('[initDB] Dados iniciais criados no localStorage — modo offline');
  }
}

// ── logAction ─────────────────────────────────────────────────────
async function logAction(acao, entidade, entidadeId) {
  var u = Session.get();
  try {
    await DB.insert(DB.KEYS.LOGS, {
      id:genUUID(), acao:acao, entidade:entidade,
      entidadeId:entidadeId||'',
      usuarioId:u?u.id:'', usuarioNome:u?u.nome:'Sistema',
      createdAt:new Date().toISOString(),
    });
  } catch(_) {}
}
