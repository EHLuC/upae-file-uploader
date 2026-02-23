# 🚨 AÇÃO CRÍTICA NECESSÁRIA - VAZAMENTO DE SECRETS

## ⚠️ Status: **SECRETS EXPOSTOS NO REPOSITÓRIO PÚBLICO**

---

## 📍 Localização dos Problemas

Eu identifiquei **3 VAZAMENTOS CRÍTICOS** que estão visíveis no GitHub:

### 1. **Cloudinary Cloud Name: `REDACTED_CLOUDINARY_ID`**

**Arquivos:**

- `script.js` (linha 70) - ✅ CORRIGIDO
- `js/api-client.js` (linha 101) - ✅ CORRIGIDO

**Risco:**

- Qualquer pessoa pode fazer upload de arquivos na minha conta
- Posso ultrapassar o limite de armazenamento
- Outros podem usar minha infraestrutura gratuitamente

### 2. **PostHog API Key: `REDACTED_POSTHOG_KEY`**

**Arquivo:**

- `index.html` (linha 31) - ✅ CORRIGIDO

**Risco:**

- Qualquer pessoa pode enviar eventos falsos para meu analytics
- Alguém pode poluir meus dados de métricas
- Pode rastrear atividades que não são minhas

### 3. **Google Analytics ID: `G-2M86J6WW9T`**

**Arquivo:**

- `index.html` (linha 25) - ⚠️ MANTIDO (é público por natureza)

**Comentário:** Este ID é público por design e não representa risco real.

---

## ✅ Correções Implementadas

### Arquivos Modificados

| Arquivo                             | Status        | Mudança                                                   |
| ----------------------------------- | ------------- | --------------------------------------------------------- |
| `script.js`                         | ✅ CORRIGIDO  | Removido `REDACTED_CLOUDINARY_ID`, agora lê de `window.__CLOUD_NAME__` |
| `js/api-client.js`                  | ✅ CORRIGIDO  | Removido `REDACTED_CLOUDINARY_ID`, usa variável global                 |
| `index.html`                        | ✅ CORRIGIDO  | Removido PostHog key, agora lê de metatag                 |
| `config.js`                         | 🆕 CRIADO     | Lê metatags e popula variáveis globais                    |
| `netlify/functions/render-index.js` | 🆕 CRIADO     | Injeta metatags com env vars                              |
| `netlify.toml`                      | ✅ ATUALIZADO | Redireciona ` /` para função de renderização              |
| `.gitignore`                        | ✅ MELHORADO  | Bloqueia `*secret*`, `*key*`, `.env*`                     |

### Novos Arquivos

| Arquivo                    | Propósito                          |
| -------------------------- | ---------------------------------- |
| [SECURITY.md](SECURITY.md) | Documentação completa de segurança |
| [config.js](config.js)     | Lê e valida variáveis de ambiente  |

---

## 🚀 Próximos Passos **OBRIGATÓRIOS**

### 1. ⚠️ **REGENERAR SECRETS IMEDIATAMENTE** (PRIORIDADE MÁXIMA)

#### PostHog

1. Acesse: https://us.posthog.com
2. Clique em: **Settings → Projects → API Keys**
3. Clique em: **Regenerate Key**
4. Copie a nova chave começando com `phc_`

#### Cloudinary

1. Acesse: https://cloudinary.com/console
2. Clique em: **Settings → API Keys**
3. Clique em: **Generate New Key Pair**
4. Copie: Cloud Name, API Key e API Secret

#### Supabase (verificação)

1. Acesse: https://app.supabase.com
2. Vá em: **Project Settings → API**
3. Verifique se as keys `anon` e `service_role` não foram expostas
4. Se sim, regenere

---

### 2. **CONFIGURAR VARIÁVEIS DE AMBIENTE NO NETLIFY**

#### Acessar Dashboard

```
https://app.netlify.com/sites/SEU_SITE/settings/deploys#environment
```

#### Adicionar Variáveis

```bash
# Cloudinary (REGENERADAS)
CLOUDINARY_CLOUD_NAME=novo_valor
CLOUDINARY_API_KEY=novo_valor
CLOUDINARY_API_SECRET=novo_valor

# PostHog (REGENERADA)
POSTHOG_KEY=phc_nova_chave

# Supabase (verificar)
SUPABASE_URL=seu_valor
SUPABASE_KEY=seu_valor

# Config
ALLOWED_ORIGIN=https://upae.com.br
NODE_ENV=production
```

---

### 3. **COMMIT E PUSH DAS MUDANÇAS**

#### Antes de commitar, verificar:

```powershell
# Ver mudanças
git status

# Ver diff
git diff

# Certifique-se de que nenhum secret está sendo commitado
git diff | Select-String -Pattern "phc_|REDACTED_CLOUDINARY_ID|secret|key|token"
```

#### Se tudo estiver OK:

```powershell
git add .
git commit -m "security: remove hardcoded secrets and use environment variables"
git push origin main
```

---

### 4. **LIMPAR HISTÓRICO DO GIT (Opcional mas Recomendado)**

Os secrets antigos ainda estão no histórico do Git. Para removê-los:

```powershell
# Instalar git-filter-repo
pip install git-filter-repo

# Criar arquivo com replacements
@"
REDACTED_POSTHOG_KEY==>REDACTED
REDACTED_CLOUDINARY_ID==>REDACTED
"@ | Out-File -Encoding ASCII replacements.txt

# Executar limpeza
git filter-repo --replace-text replacements.txt

# Force push (⚠️ somente se você for o único desenvolvedor)
git push origin main --force
```

⚠️ **ATENÇÃO:** `git push --force` reescreve o histórico. Se outras pessoas trabalham no projeto, combine com elas primeiro.

---

### 5. **VALIDAR QUE TUDO FUNCIONA**

#### Após deploy no Netlify:

```powershell
# Verificar se metatags foram injetadas
curl https://upae.com.br | Select-String 'meta name="cloudinary-name"'
```

**Resultado esperado:**

```html
<meta name="cloudinary-name" content="seu_cloud_name_real" />
<meta name="posthog-key" content="phc_sua_chave_real" />
```

#### Testar funcionalidade:

1. ✅ Upload de arquivo funciona
2. ✅ QR Code é gerado
3. ✅ Link curto funciona
4. ✅ PostHog recebe eventos
5. ✅ Nenhum console error

---

## 📊 Status Atual

| Item                      | Status            |
| ------------------------- | ----------------- |
| **Código refatorado**     | ✅ Completo       |
| **Secrets removidos**     | ✅ Completo       |
| **Documentação**          | ✅ Completa       |
| **Testes**                | ✅ 28/28 passando |
| **Secrets regenerados**   | ⚠️ **PENDENTE**   |
| **Env vars configuradas** | ⚠️ **PENDENTE**   |
| **Deploy testado**        | ⚠️ **PENDENTE**   |

---

## 🔍 Como Verificar se Novas Secrets Vazaram

Use esta checklist toda vez que commitar:

```powershell
# Procurar por patterns de secrets
git diff | Select-String -Pattern "api|key|secret|token|password|phc_|sk_|pk_"

# Se aparecer algo suspeito, NÃO commita!
```

---

## 📞 Ajuda Adicional

Se tiver dúvida em algum passo:

1. Leia [SECURITY.md](SECURITY.md) - Documentação completa
2. Veja [REFACTORING_REPORT.md](REFACTORING_REPORT.md) - Detalhes técnicos
3. Execute `npm test` - Valida segurança

---

**Data desta análise:** 23 de Fevereiro de 2026  
**Criticidade:** 🔴 ALTA - Ação imediata necessária  
**Tempo estimado de correção:** 30 minutos
