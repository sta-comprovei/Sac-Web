-- ================================================================
-- LogiTrack SAC — Migration INCREMENTAL (002)
-- Execute no SQL Editor do Supabase quando o banco JÁ EXISTE
-- (tabelas, usuários e policies criados por uma execução anterior
-- de sql/migration.sql).
--
-- Esta migration NÃO recria nada:
--   • Não contém nenhum CREATE TABLE (tabelas já existem).
--   • Não contém nenhum INSERT (usuários/tipos/tratativas/config
--     já existem — nenhum dado é reinserido ou duplicado).
--   • Só adiciona colunas que ainda não existem, via
--     ALTER TABLE ... ADD COLUMN IF NOT EXISTS.
--   • Só cria índices que ainda não existem, via
--     CREATE INDEX IF NOT EXISTS.
--   • Recria as 12 policies "allow_all_*" via
--     DROP POLICY IF EXISTS + CREATE POLICY, que é o padrão
--     idempotente correto — Postgres não suporta
--     "CREATE POLICY IF NOT EXISTS", por isso reexecutar o
--     migration.sql original falha com
--     "policy ... already exists".
--
-- Este arquivo pode ser executado quantas vezes forem necessárias,
-- sem erro e sem alterar dados já existentes.
-- ================================================================

-- ── COLUNAS NOVAS (Fase 1 — alinhamento JS ↔ Banco) ────────────────

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

-- ── RLS (idempotente por natureza — ENABLE em tabela já habilitada não gera erro) ──
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

-- ── POLICIES (recriadas de forma idempotente — corrige o erro relatado) ──
-- Postgres não tem "CREATE POLICY IF NOT EXISTS"; o padrão seguro é
-- sempre DROP POLICY IF EXISTS antes de CREATE POLICY. A definição
-- (FOR ALL USING (true) WITH CHECK (true)) é exatamente a mesma já
-- em uso — nenhuma regra de acesso muda, apenas passa a ser segura
-- para reexecução.
DROP POLICY IF EXISTS "allow_all_usuarios" ON usuarios;
CREATE POLICY "allow_all_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_ocorrencias" ON ocorrencias;
CREATE POLICY "allow_all_ocorrencias" ON ocorrencias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_reentregas" ON reentregas;
CREATE POLICY "allow_all_reentregas" ON reentregas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_sobras_faltas" ON sobras_faltas;
CREATE POLICY "allow_all_sobras_faltas" ON sobras_faltas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_atendimentos" ON atendimentos;
CREATE POLICY "allow_all_atendimentos" ON atendimentos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_notificacoes" ON notificacoes;
CREATE POLICY "allow_all_notificacoes" ON notificacoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_logs" ON logs;
CREATE POLICY "allow_all_logs" ON logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_metas" ON metas;
CREATE POLICY "allow_all_metas" ON metas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_configuracoes" ON configuracoes;
CREATE POLICY "allow_all_configuracoes" ON configuracoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_tipos_ocorrencia" ON tipos_ocorrencia;
CREATE POLICY "allow_all_tipos_ocorrencia" ON tipos_ocorrencia FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_tratativas" ON tratativas;
CREATE POLICY "allow_all_tratativas" ON tratativas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_motoristas_cadastro" ON motoristas_cadastro;
CREATE POLICY "allow_all_motoristas_cadastro" ON motoristas_cadastro FOR ALL USING (true) WITH CHECK (true);

-- ================================================================
-- Fim. Nenhuma tabela foi criada, nenhum dado foi inserido ou
-- removido. Apenas colunas/índices ausentes foram adicionados e as
-- policies foram recriadas de forma idempotente com a mesma regra
-- de acesso já vigente.
-- ================================================================
