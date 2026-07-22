-- ================================================================
-- LogiTrack SAC — Migration Completa
-- Execute no SQL Editor do Supabase
-- ================================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── USUARIOS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  TEXT NOT NULL,
  email                 TEXT UNIQUE NOT NULL,
  senha_hash            TEXT NOT NULL,
  perfil                TEXT NOT NULL DEFAULT 'OPERADOR'
                          CHECK (perfil IN ('ADMINISTRADOR','SUPERVISOR','OPERADOR')),
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  pode_alterar_resolucao BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── OCORRENCIAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ocorrencias (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT UNIQUE NOT NULL,
  tipo                  TEXT,
  cliente               TEXT,
  motorista             TEXT,
  motorista_id          TEXT,
  status                TEXT NOT NULL DEFAULT 'ABERTA'
                          CHECK (status IN ('ABERTA','EM_ANDAMENTO','AGUARDANDO','RESOLVIDA','CANCELADA')),
  prioridade            TEXT DEFAULT 'NORMAL'
                          CHECK (prioridade IN ('NORMAL','ALTA','CRITICA')),
  tratativa_com         TEXT,
  resolucao_devolucao   TEXT DEFAULT '',
  responsavel_id        UUID REFERENCES usuarios(id),
  observacao            TEXT DEFAULT '',
  anexos                JSONB DEFAULT '[]',
  historico             JSONB DEFAULT '[]',
  arquivado             BOOLEAN NOT NULL DEFAULT false,
  arquivado_em          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── REENTREGAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reentregas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT UNIQUE NOT NULL,
  ocorrencia_id         UUID REFERENCES ocorrencias(id),
  cliente               TEXT,
  motorista             TEXT,
  motorista_secundario  TEXT,
  motivo                TEXT,
  status                TEXT NOT NULL DEFAULT 'ABERTA'
                          CHECK (status IN ('ABERTA','EM_ANDAMENTO','AGUARDANDO','RESOLVIDA','CANCELADA')),
  tratativa_com         TEXT,
  responsavel_id        UUID REFERENCES usuarios(id),
  observacao            TEXT DEFAULT '',
  historico             JSONB DEFAULT '[]',
  arquivado             BOOLEAN NOT NULL DEFAULT false,
  arquivado_em          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SOBRAS_FALTAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sobras_faltas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT UNIQUE NOT NULL,
  tipo                  TEXT NOT NULL DEFAULT 'SOBRA'
                          CHECK (tipo IN ('SOBRA','FALTA')),
  cliente               TEXT,
  produto               TEXT,
  quantidade            NUMERIC DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'ABERTA'
                          CHECK (status IN ('ABERTA','EM_ANDAMENTO','AGUARDANDO','RESOLVIDA','CANCELADA')),
  origem_divergencia    TEXT,
  tratativa_com         TEXT,
  responsavel_id        UUID REFERENCES usuarios(id),
  observacao            TEXT DEFAULT '',
  historico             JSONB DEFAULT '[]',
  arquivado             BOOLEAN NOT NULL DEFAULT false,
  arquivado_em          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ATENDIMENTOS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atendimentos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT UNIQUE NOT NULL,
  assunto               TEXT NOT NULL,
  contato_nome          TEXT,
  contato_telefone      TEXT,
  contato_email         TEXT,
  status                TEXT NOT NULL DEFAULT 'NOVO'
                          CHECK (status IN ('NOVO','EM_ATENDIMENTO','AGUARDANDO','FINALIZADO','CONVERTIDO')),
  status_financeiro     TEXT DEFAULT 'Pendente',
  valor_indenizacao     NUMERIC DEFAULT 0,
  valor_reembolso       NUMERIC DEFAULT 0,
  valor_credito         NUMERIC DEFAULT 0,
  forma_pagamento       TEXT,
  data_pagamento        DATE,
  responsavel_id        UUID REFERENCES usuarios(id),
  ocorrencia_id         UUID REFERENCES ocorrencias(id),
  observacao            TEXT DEFAULT '',
  anexos                JSONB DEFAULT '[]',
  historico             JSONB DEFAULT '[]',
  arquivado             BOOLEAN NOT NULL DEFAULT false,
  arquivado_em          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── NOTIFICACOES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id            UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_por            UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_por_nome       TEXT DEFAULT '',
  modulo                TEXT DEFAULT '',
  registro_id           TEXT DEFAULT '',
  registro_codigo       TEXT DEFAULT '',
  titulo                TEXT NOT NULL,
  descricao             TEXT DEFAULT '',
  tipo                  TEXT DEFAULT '',
  lida                  BOOLEAN NOT NULL DEFAULT false,
  arquivada             BOOLEAN NOT NULL DEFAULT false,
  data_criacao          TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_leitura          TIMESTAMPTZ,
  arquivada_em          TIMESTAMPTZ,
  arquivada_por         TEXT DEFAULT ''
);

-- ── LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acao                  TEXT NOT NULL,
  entidade              TEXT NOT NULL,
  entidade_id           TEXT DEFAULT '',
  usuario_id            UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nome          TEXT DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── METAS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  TEXT NOT NULL,
  valor_meta            NUMERIC NOT NULL DEFAULT 0,
  valor_atual           NUMERIC NOT NULL DEFAULT 0,
  periodo               TEXT DEFAULT 'mensal',
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── CONFIGURACOES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracoes (
  id                    INTEGER PRIMARY KEY DEFAULT 1,
  empresa               TEXT DEFAULT 'LogiTrack Transportes Ltda.',
  cnpj                  TEXT DEFAULT '',
  telefone              TEXT DEFAULT '',
  email                 TEXT DEFAULT '',
  endereco              TEXT DEFAULT '',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ── TIPOS_OCORRENCIA ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tipos_ocorrencia (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT NOT NULL,
  descricao             TEXT NOT NULL,
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── TRATATIVAS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tratativas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  TEXT NOT NULL,
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── MOTORISTAS_CADASTRO ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS motoristas_cadastro (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                  TEXT NOT NULL,
  cpf                   TEXT,
  telefone              TEXT,
  ativo                 BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================================
-- FASE 1 — Alinhamento de schema (JS ↔ Banco)
-- Adiciona as colunas que os módulos ocorrencias.js, reentregas.js,
-- sobras.js e atendimentos.js já gravam via DB.insert()/DB.update()
-- mas que não existiam nas tabelas acima. Todas as instruções usam
-- ADD COLUMN IF NOT EXISTS — seguras tanto para instalação nova
-- quanto para reexecução sobre um banco já existente.
-- ================================================================

-- OCORRENCIAS
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS descricao            TEXT DEFAULT '';
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS nota_fiscal          TEXT DEFAULT '';
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS local_ocorrencia     TEXT DEFAULT '';
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS valor_mercadoria     NUMERIC DEFAULT 0;
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS observacoes          TEXT DEFAULT '';
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS justificativa        TEXT DEFAULT '';
ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS atendimento_origem_id UUID REFERENCES atendimentos(id);

-- REENTREGAS
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS motorista_principal          TEXT;
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS motorista_principal_codigo   TEXT;
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS motorista_secundario_codigo  TEXT;
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS nota_fiscal                  TEXT DEFAULT '';
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS local_ocorrencia             TEXT DEFAULT '';
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS valor_mercadoria             NUMERIC DEFAULT 0;
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS descricao                    TEXT DEFAULT '';
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS observacoes                  TEXT DEFAULT '';
ALTER TABLE reentregas ADD COLUMN IF NOT EXISTS devolucao_evitada            BOOLEAN DEFAULT false;

-- SOBRAS_FALTAS
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS data              DATE;
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS num_carregamento  TEXT DEFAULT '';
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS nota_fiscal       TEXT DEFAULT '';
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS motorista         TEXT;
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS motorista_codigo  TEXT;
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS conferente        TEXT;
ALTER TABLE sobras_faltas ADD COLUMN IF NOT EXISTS observacoes       TEXT DEFAULT '';

-- ATENDIMENTOS
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS data                    DATE;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS hora_recebimento        TEXT;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS descricao               TEXT DEFAULT '';
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS observacoes_financeiras TEXT DEFAULT '';
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS historico_financeiro    JSONB DEFAULT '[]';
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS hora_abertura           TIMESTAMPTZ;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS hora_encerramento       TIMESTAMPTZ;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS hora_primeira_resp      TIMESTAMPTZ;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS ocorrencia_tipo         TEXT;

-- ── ÍNDICES ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status      ON ocorrencias(status);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_arquivado   ON ocorrencias(arquivado);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_created_at  ON ocorrencias(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reentregas_status       ON reentregas(status);
CREATE INDEX IF NOT EXISTS idx_reentregas_arquivado    ON reentregas(arquivado);
CREATE INDEX IF NOT EXISTS idx_sobras_faltas_status    ON sobras_faltas(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status     ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario    ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida       ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_logs_created_at         ON logs(created_at DESC);

-- ── RLS (Row Level Security) ──────────────────────────────────────
ALTER TABLE usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reentregas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sobras_faltas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_ocorrencia   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratativas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas_cadastro ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (anon key tem acesso total — auth é feita na app)
CREATE POLICY "allow_all_usuarios"           ON usuarios           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ocorrencias"        ON ocorrencias        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reentregas"         ON reentregas         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sobras_faltas"      ON sobras_faltas      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_atendimentos"       ON atendimentos       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notificacoes"       ON notificacoes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_logs"               ON logs               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_metas"              ON metas              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_configuracoes"      ON configuracoes      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tipos_ocorrencia"   ON tipos_ocorrencia   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tratativas"         ON tratativas         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_motoristas_cadastro" ON motoristas_cadastro FOR ALL USING (true) WITH CHECK (true);

-- ── DADOS INICIAIS ────────────────────────────────────────────────

-- Configuração padrão
INSERT INTO configuracoes (id, empresa) VALUES (1, 'LogiTrack Transportes Ltda.')
ON CONFLICT (id) DO NOTHING;

-- Tratativas padrão
INSERT INTO tratativas (nome) VALUES
  ('Motorista'), ('Vendedor'), ('Cliente'), ('Supervisor'), ('Financeiro')
ON CONFLICT DO NOTHING;

-- Tipos de ocorrência
INSERT INTO tipos_ocorrencia (codigo, descricao) VALUES
  ('011','Excesso de Veículos'),('012','Fora do Horário'),('013','Estabelecimento Fechado'),
  ('014','Falta de XML'),('015','Atraso na Entrega'),('016','Carga Ultrapassou Capacidade'),
  ('017','Feriado Local/Nacional'),('018','Fora do Agendamento'),('019','Falta de Mercadoria'),
  ('020','Problema com o Pedido'),('021','Cliente Sem Sistema'),('022','Problema no Recebimento'),
  ('023','Mercadoria Avariada'),('025','Não Recebe no Sábado'),('026','Atraso na Entrega RCA'),
  ('027','Desistência do Cliente'),('028','Fora de Rota'),('029','Reentrega'),
  ('030','Erro do RCA / Sem Pedido'),('031','Mercadoria Próxima ao Vencimento'),
  ('032','Erro de Tributação'),('033','Pedido Duplicado / Erro do RCA'),
  ('034','Cliente Não Pode Pagar'),('035','Chocolate Derretido'),('036','Mercadoria Foi Trocada'),
  ('037','Motorista Não Passou no Cliente'),('038','Cliente com Problema no Cadastro'),
  ('039','Forma de Pagamento Divergente'),('040','Nota Denegada'),('041','Erro Logístico'),
  ('042','Carregamento Não Liberado'),('043','Abatimento de Boleto'),('044','Prorrogação'),
  ('045','Nota com Produto sem Cadastro'),('046','Problema com XML'),('047','Nota Denegada (Fiscal)'),
  ('995','Rota Cancelada'),('998','Motorista Não Justificou')
ON CONFLICT DO NOTHING;

-- ================================================================
-- USUÁRIO ADMINISTRADOR INICIAL
-- Senha: admin123 (troque após o primeiro login)
-- Hash SHA-256 de 'admin123'
-- ================================================================
INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
VALUES (
  'Administrador',
  'admin@logitrack.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'ADMINISTRADOR',
  true
) ON CONFLICT (email) DO NOTHING;

-- Usuário supervisor padrão (senha: 123456)
INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
VALUES (
  'Supervisor',
  'supervisor@logitrack.com',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'SUPERVISOR',
  true
) ON CONFLICT (email) DO NOTHING;
