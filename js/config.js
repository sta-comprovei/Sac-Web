
// ===============================================================
// LogiTrack SAC -- ARQUIVO CENTRAL DE CONFIGURACOES
// 
// MOTORISTAS: gerenciados via Configuracoes > Importar Frota
//   A lista abaixo e o ponto de partida. Ao importar nova
//   planilha em Configuracoes, a lista e sobrescrita no
//   LocalStorage e fica disponivel imediatamente.
//
// TIPOS DE OCORRENCIA: edite a lista TIPOS_OCORRENCIA_CONFIG
// ===============================================================

// ---------------------------------------------------------------
// MOTORISTAS -- Lista padrao (Frota_ATUALIZADA.xlsx importada)
// Para atualizar: use Configuracoes > Importar Planilha de Frota
// ---------------------------------------------------------------
var MOTORISTAS_PADRAO = [
  { codigo: '1654', nome: 'VANDEIR PIRES' },
  { codigo: '1712', nome: 'RICARDO PEREIRA' },
  { codigo: '1746', nome: 'RAIMUNDO FERNANDES' },
  { codigo: '1812', nome: 'CLEIDER GONZAGA' },
  { codigo: '1824', nome: 'RONALDO NEVES' },
  { codigo: '1832', nome: 'VIVIANY LOPES' },
  { codigo: '1837', nome: 'MAURO SABOIA' },
  { codigo: '1842', nome: 'RUAN RUBENS' },
  { codigo: '1845', nome: 'THIAGO SANTOS' },
  { codigo: '1854', nome: 'DANIEL BATISTA' },
  { codigo: '1870', nome: 'ANTONIO FABIO' },
  { codigo: '1882', nome: 'JAMILTON FERREIRA' },
  { codigo: '1887', nome: 'EDESIO RODRIGUES' },
  { codigo: '1891', nome: 'JACKSON' },
  { codigo: '1906', nome: 'JOSE ELIDIO' },
  { codigo: '1930', nome: 'AQUELSON SANTOS' },
  { codigo: '1958', nome: 'JUNIO PEREIRA' },
  { codigo: '2041', nome: 'PAULO SERGIO' },
  { codigo: '2058', nome: 'MOISES FERNANDES' },
  { codigo: '2163', nome: 'ROBERTO DE SOUSA' },
  { codigo: '2230', nome: 'ALISSON DOS SANTOS' },
  { codigo: '2240', nome: 'WALLACE RIBEIRO' },
  { codigo: '2278', nome: 'JOAO CARLOS' },
  { codigo: '2293', nome: 'ROGERIO ARAUJO' },
  { codigo: '2295', nome: 'HENRIQUE LUCAS' },
  { codigo: '2301', nome: 'THIAGO LUAN' },
  { codigo: '2302', nome: 'KAIO RIBEIRO' },
  { codigo: '2303', nome: 'IRAIAS RIBEIRO' },
  { codigo: '2310', nome: 'GABRIEL DE ARAUJO' },
  { codigo: '2312', nome: 'PAULO ALVES' },
  { codigo: '2315', nome: 'CARLOS KLEVERSON' },
  { codigo: '2317', nome: 'MIKAEL MELO' },
  { codigo: '2349', nome: 'THIAGO FRANCISCO' },
  { codigo: '2394', nome: 'JOHNE JUNIO' },
  { codigo: '2437', nome: 'MATHEUS LEMOS D.S' },
  { codigo: '2450', nome: 'MARCIO DIAS BARBOSA' },
  { codigo: '2471', nome: 'CARLIEL RAGSON' },
  { codigo: '2474', nome: 'ITAILSON SILVA' },
  { codigo: '2475', nome: 'STANLEY LIMA' },
  { codigo: '2476', nome: 'LUIZ CLAUDIO' },
  { codigo: '2477', nome: 'VINICIUS DE CARVALHO' },
  { codigo: '2478', nome: 'RENATA LEITE' },
  { codigo: '2486', nome: 'JERONIMO DINIZ' },
  { codigo: '2487', nome: 'ISAIAS CORREA' },
  { codigo: '2491', nome: 'FLAVIO SILVA' },
  { codigo: '2494', nome: 'JOSE VITOR' },
  { codigo: '2495', nome: 'MICHAEL BRENO' },
  { codigo: '2496', nome: 'LUCIANO DE ANDRDADE' },
  { codigo: '2499', nome: 'CESAR CABRAL' },
  { codigo: '2500', nome: 'AMILTON DA ROCHA' },
  { codigo: '2503', nome: 'LARISSA GALVÃO' },
  { codigo: '2507', nome: 'GILVAN LEAL' },
  { codigo: '2508', nome: 'JOSE MARCOS' },
  { codigo: '2509', nome: 'RODRIGO MAI' },
  { codigo: '2512', nome: 'LUCAS RIBEIRO' },
  { codigo: '2513', nome: 'YURI ERIEL' },
  { codigo: '2516', nome: 'LUAN DAVID' },
  { codigo: '2517', nome: 'RODRIGO LIMA' },
  { codigo: '2519', nome: 'ROGERIO LIMA' },
  { codigo: '2520', nome: 'JOAO LUIZ' },
  { codigo: '2521', nome: 'GARCIEL FERREIRA' },
  { codigo: '2522', nome: 'DOUGLAS GALVAO' },
  { codigo: '2523', nome: 'SAUL MICAELL' },
  { codigo: '2524', nome: 'JOAO GABRIEL' },
  { codigo: '2525', nome: 'GUSTAVO TAVARES' },
  { codigo: '2527', nome: 'CARLOS EDUARDO' },
  { codigo: '2528', nome: 'MARCOS WENDER' },
  { codigo: '2530', nome: 'MOISES WESTTERMAN' },
  { codigo: '2531', nome: 'JEFFERSON RIBEIRO' },
  { codigo: '2534', nome: 'ALISSON JESUS' },
  { codigo: '2535', nome: 'RENIS LEANDRO' },
  { codigo: '2536', nome: 'FERNANDO FERREIRA' },
  { codigo: '2537', nome: 'YURI PORTO' },
  { codigo: '2538', nome: 'ANNA ALICE' },
  { codigo: '2539', nome: 'FRANCISCO BORGES' },
  { codigo: '2540', nome: 'HENRIQUE ALVES' },
  { codigo: '2557', nome: 'GUSTAVO EMANUEL' },
  { codigo: '2558', nome: 'EDINHO' },
  { codigo: '2560', nome: 'RAFAEL CARLOS' },
  { codigo: '2562', nome: 'LUCAS VIEIRA' },
  { codigo: '9002', nome: 'GEOVANE NUNES' },
  { codigo: '9007', nome: 'PEDRO HELIO' },
  { codigo: '9009', nome: 'JOSE GOMES' },
  { codigo: '9012', nome: 'SILVIO LEONARDO' },
  { codigo: '9019', nome: 'CLEOMAR RODRIGUES' },
  { codigo: '9023', nome: 'ALECIO ALVES' },
  { codigo: '9050', nome: 'ANDRE CARVALHO' },
  { codigo: '9083', nome: 'LUIZ HENRIQUE' },
  { codigo: '9184', nome: 'PEDRO JOSE' },
  { codigo: '10009001', nome: 'CELIO GONCALVES' },
  { codigo: '10009023', nome: 'JOSE NECOLAU' },
  { codigo: '10009030', nome: 'MAX JUNIO' },
  { codigo: '10009033', nome: 'FABIO BRAGA' },
  { codigo: '10009034', nome: 'HENRIQUE GAUDINO' },
  { codigo: '10009041', nome: 'JUNIO DE FARIA' },
  { codigo: '10009042', nome: 'ALDINEI DE SOUZA' },
  { codigo: '10009045', nome: 'ELIAS TEIXEIRA' },
  { codigo: '10009077', nome: 'CLEOMILSON' },
  { codigo: '10009084', nome: 'SILVINO BUSSINGUER' },
  { codigo: '10009087', nome: 'JOSE MATHEUS' },
  { codigo: '10009095', nome: 'LEONARDO ALMEIDA' },
  { codigo: '10009105', nome: 'ALEX SANDER MELO' },
  { codigo: '10009113', nome: 'MARCIO HENRIQUE' },
  { codigo: '10009130', nome: 'ELTON JOAQUIM' },
  { codigo: '10009137', nome: 'JOAO PAULO' },
  { codigo: '10009143', nome: 'FRANCISCO TARCISIO' },
  { codigo: '10009157', nome: 'GILSON EDSON' },
  { codigo: '10009192', nome: 'RENATO DE MORAIS' },
  { codigo: '10009202', nome: 'LUCIANO DA ROCHA' },
  { codigo: '10009209', nome: 'GILTON PEREIRA' },
  { codigo: '10009214', nome: 'WESLEY MORAIS' },
  { codigo: '10009242', nome: 'LUCAS RODRIGUES' },
  { codigo: '10009266', nome: 'DEUSVANE' },
  { codigo: '10009277', nome: 'JOSE HILTON' },
  { codigo: '10009324', nome: 'ANDERSON PEREIRA' },
  { codigo: '10009348', nome: 'JANIO LION' },
  { codigo: '10009358', nome: 'ANTONIO ISONEY' },
  { codigo: '10009394', nome: 'AUGUSTO BUSSINGUER' },
  { codigo: '10009401', nome: 'REINALDO RODRIGUES' },
  { codigo: '10009408', nome: 'JOSE MARCOS' },
  { codigo: '10009411', nome: 'HARLEM CAETANO' },
  { codigo: '10009439', nome: 'MAIRTON MARTINS' },
  { codigo: '10009442', nome: 'CLAUDIO NESTOR' },
  { codigo: '10009450', nome: 'JOSE BEZERRA' },
  { codigo: '10009458', nome: 'AMAURI' },
  { codigo: '10009463', nome: 'JARDEL DA COSTA' },
  { codigo: '10009468', nome: 'VALDECI BATISTA' },
  { codigo: '10009476', nome: 'FRANCISCO DE ASSIS' },
  { codigo: '10009495', nome: 'PABLO ALVES' },
  { codigo: '10009503', nome: 'MIVALDO BATISTA' },
  { codigo: '10009506', nome: 'PAULO VITOR' },
  { codigo: '10009509', nome: 'ANDRE LUIS' },
  { codigo: '10009514', nome: 'VAGNER GOMES' },
  { codigo: '10009515', nome: 'ANTONIO DANUETE' },
  { codigo: '10009516', nome: 'VANDERLEI PIRES' },
  { codigo: '10009518', nome: 'EMIVAL SOARES' },
  { codigo: '10009519', nome: 'LAURIMNAR NUNES' },
  { codigo: '10009532', nome: 'ERCENI JOSE' },
  { codigo: '10009534', nome: 'SEBASTIAO PEREIRA' },
  { codigo: '10009542', nome: 'DIEGO MACHADO' },
  { codigo: '10009574', nome: 'ROGERIO DE ARAUJO' },
  { codigo: '10009575', nome: 'JOSE MARDONIO' },
  { codigo: '10009592', nome: 'ANTONIO JOSE' },
  { codigo: '10009606', nome: 'ISAAC ALVES' },
  { codigo: '10009620', nome: 'EULER BATISTA' },
  { codigo: '10009659', nome: 'FABRIZZIO' },
  { codigo: '10009724', nome: 'RONALDO DE ANDRADE' },
  { codigo: '10009730', nome: 'EDSON AZEVEDO' },
  { codigo: '10009738', nome: 'MARIO SABOIA' },
  { codigo: '10009769', nome: 'AGILSON OLIVEIRA' },
  { codigo: '10009775', nome: 'ANTONIO CARLOS' },
  { codigo: '10009778', nome: 'ITAMAR BERNARDO' },
  { codigo: '10009783', nome: 'PEDRO ELVIDIO' },
  { codigo: '10009789', nome: 'FRANCISCO SERGIO' },
  { codigo: '10009813', nome: 'PEDRO ERNANDY' },
  { codigo: '10009824', nome: 'RENATO FRANCISCO' },
  { codigo: '10009831', nome: 'ILDEFONSO RIBEIRO' },
  { codigo: '10009845', nome: 'ADILSON OLIVEIRA' },
  { codigo: '10009867', nome: 'JUNIO CLEZIO' },
  { codigo: '10009875', nome: 'WILSON CAETANO' },
  { codigo: '10009880', nome: 'GEDEAO ARAUJO' },
  { codigo: '10009881', nome: 'GIDEGLAN ARAUJO' },
  { codigo: '10009943', nome: 'CARLOS ADRIANO' }
];

// Retorna lista ativa: cache de motoristas importados (Supabase) ou padrao acima
var _motoristasImportadosCache = null;
function getMotoristasAtivos() {
  if (Array.isArray(_motoristasImportadosCache) && _motoristasImportadosCache.length > 0) {
    return _motoristasImportadosCache;
  }
  return MOTORISTAS_PADRAO;
}

// Busca a frota importada no Supabase e atualiza o cache local síncrono.
// Chamado no boot da aplicação e sempre que o admin reimporta a planilha.
async function refreshMotoristasImportados() {
  try {
    // Prioridade 1: frota gerenciada via Configurações > Cadastros (tabela motoristas_cadastro)
    var cadastrados = await DB.getAll(DB.KEYS.MOTORISTAS_CADASTRO);
    var ativos = (cadastrados||[]).filter(function(m){ return m.ativo !== false; });
    if (ativos.length) {
      _motoristasImportadosCache = ativos.map(function(m){ return {codigo:m.codigo, nome:m.nome}; });
      return getMotoristasAtivos();
    }
    // Prioridade 2: frota importada via planilha (tabela motoristas_importados)
    var lista = await MotoristasDB.getAll();
    _motoristasImportadosCache = (lista && lista.length) ? lista : null;
  } catch (e) {
    console.warn('Não foi possível carregar frota importada, usando lista padrão.', e);
    _motoristasImportadosCache = null;
  }
  return getMotoristasAtivos();
}

// Alias usado pelo restante do sistema
var MOTORISTAS_CONFIG = MOTORISTAS_PADRAO;

// Busca motorista pelo codigo (atualiza do storage a cada chamada)
function buscarMotoristaPorCodigo(codigo) {
  var lista = getMotoristasAtivos();
  var cod = String(codigo).trim();
  var found = lista.find(function(m) { return m.codigo === cod; });
  if (!found) return null;
  return {
    codigo: found.codigo,
    nome: found.nome,
    display: found.codigo + ' - ' + found.nome
  };
}

// Display para exibicao (aceita "cod - nome" ou codigo puro)
function getMotoristaDisplay(valor) {
  if (!valor) return '—';
  if (/^\d+ - .+/.test(valor)) return valor;
  var found = buscarMotoristaPorCodigo(valor);
  return found ? found.display : valor;
}

function getMotoristaName(valor) {
  if (!valor) return '—';
  if (/^\d+ - .+/.test(valor)) return valor.split(' - ').slice(1).join(' - ');
  var found = buscarMotoristaPorCodigo(valor);
  return found ? found.nome : valor;
}

// ---------------------------------------------------------------
// TIPOS DE OCORRENCIA
// Formato: { codigo: 'NNN', descricao: 'Texto' }
// valor (gerado abaixo): "NNN - Texto" -- formato salvo
// Os tipos também são gerenciados via Configurações > Tipos de Ocorrência.
// Esta lista é o fallback quando o banco ainda não foi consultado.
// ---------------------------------------------------------------
var TIPOS_OCORRENCIA_CONFIG = [
  { codigo: '011', descricao: 'Excesso de Veiculos' },
  { codigo: '012', descricao: 'Fora do horario' },
  { codigo: '013', descricao: 'Estabelecimento fechado' },
  { codigo: '014', descricao: 'Falta de XML' },
  { codigo: '015', descricao: 'Atraso na entrega' },
  { codigo: '016', descricao: 'Carga ultrapassou capacidade do veiculo' },
  { codigo: '017', descricao: 'Feriado Local/Nacional' },
  { codigo: '018', descricao: 'Fora do agendamento' },
  { codigo: '019', descricao: 'Falta de Mercadoria' },
  { codigo: '020', descricao: 'Problema com o pedido' },
  { codigo: '021', descricao: 'Cliente sem sistema' },
  { codigo: '022', descricao: 'Problema no recebimento do cliente' },
  { codigo: '023', descricao: 'Mercadoria avariada' },
  { codigo: '025', descricao: 'Nao recebe no sabado' },
  { codigo: '026', descricao: 'Atraso na entrega RCA' },
  { codigo: '027', descricao: 'Desistencia do cliente' },
  { codigo: '028', descricao: 'Fora de rota' },
  { codigo: '029', descricao: 'Reentrega' },
  { codigo: '030', descricao: 'Erro do RCA / Sem pedido' },
  { codigo: '031', descricao: 'Mercadoria proxima ao vencimento' },
  { codigo: '032', descricao: 'Erro de tributacao' },
  { codigo: '033', descricao: 'Pedido duplicado / Erro do RCA' },
  { codigo: '034', descricao: 'Cliente nao pode pagar' },
  { codigo: '035', descricao: 'Chocolate derretido' },
  { codigo: '036', descricao: 'Mercadoria foi trocada' },
  { codigo: '037', descricao: 'Motorista nao passou no cliente' },
  { codigo: '038', descricao: 'Cliente com problema no cadastro' },
  { codigo: '039', descricao: 'Forma de pagamento divergente' },
  { codigo: '040', descricao: 'Nota denegada' },
  { codigo: '041', descricao: 'Erro Logístico' },
  { codigo: '042', descricao: 'Carregamento Não Liberado' },
  { codigo: '043', descricao: 'Abatimento de Boleto' },
  { codigo: '044', descricao: 'Prorrogação' },
  { codigo: '045', descricao: 'Nota com Produto sem Cadastro' },
  { codigo: '046', descricao: 'Problema com XML' },
  { codigo: '047', descricao: 'Nota Denegada (fiscal)' },
  { codigo: '995', descricao: 'Rota cancelada' },
  { codigo: '998', descricao: 'Motorista nao justificou' },
];

TIPOS_OCORRENCIA_CONFIG.forEach(function(t) {
  t.valor = t.codigo + ' - ' + t.descricao;
});

var TIPOS_OCORRENCIA = TIPOS_OCORRENCIA_CONFIG.map(function(t) { return t.valor; });

// Atualiza lista de tipos a partir do banco (chamado no boot e após salvar tipo)
async function refreshTiposOcorrencia() {
  try {
    var rows = await DB.getAll(DB.KEYS.TIPOS_OCORRENCIA);
    var ativos = rows.filter(function(t){ return t.ativo !== false; })
      .sort(function(a,b){ return (a.codigo||'').localeCompare(b.codigo||'', undefined, {numeric:true}); });
    if (ativos.length) {
      TIPOS_OCORRENCIA_CONFIG = ativos.map(function(t){
        return { codigo: t.codigo, descricao: t.descricao, valor: t.codigo + ' - ' + t.descricao };
      });
      TIPOS_OCORRENCIA = TIPOS_OCORRENCIA_CONFIG.map(function(t){ return t.valor; });
    }
  } catch(e) {
    console.warn('Não foi possível carregar tipos do banco, usando lista padrão.', e);
  }
}

var TIPO_LABEL = {};
TIPOS_OCORRENCIA_CONFIG.forEach(function(t) {
  TIPO_LABEL[t.valor] = t.valor;
});

// ── Tratativas (dinâmico) ──────────────────────────────────────
// Fallback estático para quando o banco ainda não foi consultado
var TRATATIVAS_CONFIG = [
  { nome: 'Motorista' },
  { nome: 'Vendedor' },
  { nome: 'Cliente' },
  { nome: 'Supervisor' },
  { nome: 'Financeiro' },
];

async function refreshTratativas() {
  try {
    var rows = await DB.getAll(DB.KEYS.TRATATIVAS);
    var ativos = rows.filter(function(t){ return t.ativo !== false; })
      .sort(function(a,b){ return a.nome.localeCompare(b.nome, 'pt-BR'); });
    if (ativos.length) {
      TRATATIVAS_CONFIG = ativos;
    }
  } catch(e) {
    console.warn('Não foi possível carregar tratativas do banco, usando lista padrão.', e);
  }
  return TRATATIVAS_CONFIG;
}

// Retorna o <select> HTML de tratativas (com opção vazia)
function buildTratativaSelect(id, selectedNome, extraStyle) {
  var style = extraStyle || '';
  var opts = '<option value="">Selecionar...</option>'
    + TRATATIVAS_CONFIG.map(function(t){
        return '<option value="'+t.nome+'"'+(t.nome===selectedNome?' selected':'')+'>'+t.nome+'</option>';
      }).join('');
  return '<select class="select" id="'+id+'"'+(style?' style="'+style+'"':'')+'>'+opts+'</select>';
}

