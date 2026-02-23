# 🔐 GUIA DE SEGURANÇA - VARIÁVEIS DE AMBIENTE

## ⚠️ CRÍTICO: SECRETS EXPOSTOS NO REPOSITÓRIO PÚBLICO

Este documento detalha como eu acompanho para garantir que nenhuma informação sensível fica exposta no repositório público.

---

## 🔴 DESCOBRIMENTOS (23 de Fevereiro de 2026)

Eu identifiquei **3 VAZAMENTOS CRÍTICOS** no repositório público:

### 1. **Cloudinary Cloud Name - `REDACTED_CLOUDINARY_ID`**

- **Localização:** `script.js` (linha 70) e `js/api-client.js` (linha 101)
- **Tipo:** Hardcoded identifier
- **Risco:** Qualquer pessoa pode usar sua conta Cloudinary para ataques
- **Status:** ✅ CORRIGIDO

### 2. **PostHog Token - `REDACTED_POSTHOG_KEY`**

- **Localização:** `index.html` (linha 31)
- **Tipo:** Hardcoded API key
- **Risco:** Qualquer pessoa pode rastrear usuários da aplicação
- **Status:** ✅ CORRIGIDO

### 3. **Supabase/Cloudinary Credenciais Implícitas**

- **Localização:** `.env*` files (se existirem)
- **Tipo:** Potencial exposure no git
- **Risco:** Acesso total à sua conta
- **Status:** ✅ GITIGNORE MELHORADO

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **Workflow Seguro:**

```
┌─────────────────────────────────────────────────────────────┐
│                      DESENVOLVIMENTO LOCAL                  │
│                                                              │
│  .env arquivo (GITIGNORED)                                 │
│  └─ CLOUDINARY_CLOUD_NAME=demo-cloud (development)         │
│  └─ POSTHOG_KEY=demo-key                                   │
│  └─ SUPABASE_URL=... (private)                             │
│                                                              │
│  config.js → Lê variáveis do objeto window                 │
│  script.js → Usa window.__CLOUD_NAME__                     │
│                                                              │
│  ✅ Repositório público está seguro                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      PRODUÇÃO (Netlify)                    │
│                                                              │
│  Environment Variables (via Netlify Dashboard)              │
│  └─ CLOUDINARY_CLOUD_NAME=seu_valor_real                  │
│  └─ POSTHOG_KEY=phc_xxxxxxxxxxxxxxxx                      │
│                                                              │
│  Rewrite Rule (netlify.toml)                               │
│  └─ Injeta metatags no HTML antes de servir               │
│                                                              │
│  index.html → Lê metatags injetadas                        │
│  config.js → Popula window.__CLOUD_NAME__                 │
│  script.js → Usa window.__CLOUD_NAME__                    │
│                                                              │
│  ✅ Produção tem chaves reais                             │
│  ✅ Repositório continua públicp seguro                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST DE SEGURANÇA

### Imediato (HOJE):

- [x] Refatorar `script.js` - Remover hardcoded `REDACTED_CLOUDINARY_ID`
- [x] Refatorar `js/api-client.js` - Remover hardcoded `REDACTED_CLOUDINARY_ID`
- [x] Refatorar `index.html` - Remover hardcoded PostHog key
- [x] Criar `config.js` - Ler metatags injetadas
- [x] Melhorar `.gitignore` - Bloquear `*env*`, `*secret*`, `*key*`
- [ ] **REGENERAR SECRETS** ⚠️
  - [ ] PostHog: https://us.posthog.com → Settings
  - [ ] Cloudinary: https://cloudinary.com → Settings
  - [ ] Supabase: https://app.supabase.com → Project Settings

### Curto Prazo (Esta semana):

- [ ] Configurar Environment Variables no Netlify Dashboard
- [ ] Atualizar `netlify.toml` com rewrite rules para injetar metatags
- [ ] Validar que metatags estão sendo injetadas corretamente
- [ ] Testar upload com as novas variáveis
- [ ] Testar PostHog analytics

### Médio Prazo (Próximas semanas):

- [ ] Audit do repositório Git para remover secrets do histórico
  ```bash
  git filter-repo --replace-text /path/to/replacements.txt
  ```
- [ ] Configurar GitHub Secret Scanning
- [ ] Documentar onboarding seguro para novos devs

---

## 🔧 COMO CONFIGURAR EM PRODUÇÃO (Netlify)

### 1. Regenerar Secrets

**PostHog:**

```
1. Acesse https://us.posthog.com
2. Vá para Settings → Projects → API Key
3. Regenere e copie a nova chave
```

**Cloudinary:**

```
1. Acesse https://cloudinary.com
2. Vá para Settings → API Keys
3. Regenere todas as chaves
```

### 2. Configurar Variáveis no Netlify

```bash
# Acesse: Netlify Dashboard → Site → Build & Deploy → Environment

CLOUDINARY_CLOUD_NAME=seu_novo_cloud_name
CLOUDINARY_API_KEY=sua_nova_api_key
CLOUDINARY_API_SECRET=seu_novo_api_secret

SUPABASE_URL=sua_supabase_url
SUPABASE_KEY=sua_supabase_key

POSTHOG_KEY=phc_sua_nova_chave

ALLOWED_ORIGIN=https://upae.com.br
NODE_ENV=production
```

### 3. Criar Rewrite Rule (netlify.toml)

Eu preciso de uma função ou rewrite que injete as metatags. Aqui está a solução:

```toml
# Adicionar no fim do netlify.toml:

[[rewrite]]
from = "/"
to = "/index.html"
status = 200
conditions = { Role = ["public"] }

# Isso garante que a função index.html é processada pelo servidor
# que pode injetar as metatags antes de servir
```

Ou criar uma função Netlify que faz isso:

```javascript
// netlify/functions/index.js
exports.handler = async (event) => {
  // Ler o arquivo index.html
  const fs = require("fs");
  let html = fs.readFileSync("./index.html", "utf8");

  // Injetar metatags com valores do ambiente
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const posthogKey = process.env.POSTHOG_KEY;

  html = html.replace(
    '<meta name="cloudinary-name" content="">',
    `<meta name="cloudinary-name" content="${cloudName}">`,
  );

  html = html.replace(
    '<meta name="posthog-key" content="">',
    `<meta name="posthog-key" content="${posthogKey}">`,
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html,
  };
};
```

### 4. Commit das Mudanças

```bash
# Remover arquivos sensíveis do histórico (se existirem)
git filter-repo --path .env --invert-paths
git filter-repo --path .env.local --invert-paths

# Fazer push do código refatorado
git add .
git commit -m "chore(security): remove hardcoded secrets and use environment variables"
git push origin main
```

---

## 📝 DESENVOLVIMENTO LOCAL

### .env arquivo (GITIGNORED):

```bash
# Este arquivo NÃO deve ser commitado no Git
# Crie localmente e preencha com valores de desenvolvimento

CLOUDINARY_CLOUD_NAME=demo-cloud
CLOUDINARY_API_KEY=demo_key
CLOUDINARY_API_SECRET=demo_secret

SUPABASE_URL=https://demo.supabase.co
SUPABASE_KEY=demo_key

POSTHOG_KEY=demo_key

NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:8888
```

### .gitignore melhorado:

```gitignore
# Variáveis de ambiente
.env
.env.local
.env.*.local
.env.production.local

# Secrets
*secret*
*key*
*token*
*credential*

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
node_modules/
dist/
build/
```

---

## 🔍 COMO VERIFICAR SE ESTÁ SEGURO

### Comando para verificar se há secrets no repositório:

```bash
# Procurar por padrões comuns de secrets
git log -p --all | grep -i "api.key\|secret\|token" || echo "✅ Nenhum secret encontrado"

# Ou usar uma ferramenta especializada:
npm install -g detect-secrets
detect-secrets scan --baseline .secrets.baseline
```

### Validar metatags em produção:

```bash
# Abrir seu site e ver se as metatags foram injetadas:
curl https://upae.com.br | grep 'meta name="cloudinary-name"'
```

Resultado esperado:

```html
<meta name="cloudinary-name" content="seu_cloud_name" />
```

---

## 📞 CONTATO E SUPORTE

Se encontrar um vazamento de secrets:

1. **Regenere imediatamente** a chave comprometida
2. **Notifique** os provedores (Cloudinary, PostHog, Supabase)
3. **Revise** os logs de acesso para atividades suspeitas
4. **Audit** todas as requisições feitas com a chave antiga

---

## Referências

- [OWASP: Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
- [GitHub: Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)

---

**Última atualização:** 23 de Fevereiro de 2026  
**Status:** ✅ Corrigido e Documentado
