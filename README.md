# LogiTrack SAC — Sistema de Gestão de Ocorrências

Plataforma web para gestão de devoluções, reentregas, sobras/faltas e atendimentos logísticos.

---

## 🚀 Como publicar no Netlify

1. Faça upload do ZIP no [Netlify Drop](https://app.netlify.com/drop)
2. Ou conecte ao seu repositório GitHub e aponte para a pasta raiz

---

## 🗄️ Como configurar o Supabase

### 1. Criar projeto
- Acesse [supabase.com](https://supabase.com) → **New Project**
- Anote a **URL** e a **anon public key**

### 2. Executar a migration
- No painel Supabase → **SQL Editor**
- Abra o arquivo `sql/migration.sql`
- Cole o conteúdo e clique em **Run**

### 3. Configurar as credenciais no projeto
Edite o arquivo `js/storage.js` e preencha:

```js
var SUPABASE_URL  = 'https://SEU-PROJETO.supabase.co';
var SUPABASE_ANON_KEY = 'SUA-ANON-KEY';
```

---

## 👤 Primeiro login

Após executar a migration, use:

| Campo | Valor |
|---|---|
| E-mail | `admin@logitrack.com` |
| Senha | `admin123` |

Ou:

| Campo | Valor |
|---|---|
| E-mail | `supervisor@logitrack.com` |
| Senha | `123456` |

> **Importante:** troque as senhas após o primeiro acesso em **Configurações → Usuários**.

---

## 📁 Estrutura do projeto

```
logitrack-sac/
├── index.html          ← Arquivo principal
├── css/
│   └── style.css       ← Todos os estilos
├── js/
│   ├── chart.js        ← Gráficos (Chart.js bundled)
│   ├── storage.js      ← Banco de dados (localStorage offline / Supabase online)
│   ├── config.js       ← Configurações globais, tipos, tratativas
│   ├── data.js         ← Utilitários, formatação, permissões
│   ├── ui.js           ← Componentes de UI (Toast, Modal, Icons)
│   ├── notificacoes.js ← Sistema de notificações
│   ├── dashboard.js    ← Dashboards e KPIs
│   ├── ocorrencias.js  ← Módulo de devoluções
│   ├── reentregas.js   ← Módulo de reentregas
│   ├── sobras.js       ← Módulo de sobras/faltas
│   ├── atendimentos.js ← Módulo de atendimentos
│   ├── pages.js        ← Páginas estáticas (rankings, relatórios, alertas)
│   ├── admin.js        ← Administração (usuários, cadastros)
│   └── app.js          ← Roteador principal, inicialização
├── sql/
│   └── migration.sql   ← Script SQL completo para Supabase
└── README.md
```

---

## 🔄 Como funciona o armazenamento

O sistema usa **localStorage** como banco principal (funciona offline e sem configuração).

Para usar o **Supabase** (produção com múltiplos usuários):
1. Execute a migration SQL
2. Preencha as credenciais em `js/storage.js`
3. As leituras/escritas passarão automaticamente para o Supabase

---

## 🔐 Perfis de acesso

| Perfil | Acesso |
|---|---|
| **ADMINISTRADOR** | Tudo, incluindo usuários e configurações |
| **SUPERVISOR** | Dashboards, rankings, relatórios, operação completa |
| **OPERADOR** | Cadastro e edição de ocorrências, reentregas, sobras, atendimentos |

---

## 📈 Futuras atualizações

Para atualizar o sistema:
1. Faça o deploy do novo ZIP no Netlify
2. Se houver mudanças no banco, execute um novo arquivo SQL incremental no Supabase
3. Os dados existentes são preservados
