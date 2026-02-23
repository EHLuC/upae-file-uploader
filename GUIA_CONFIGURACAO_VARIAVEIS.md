# 🚨 AÇÃO OBRIGATÓRIA: CONFIGURAR VARIÁVEIS DE AMBIENTE

## O que aconteceu?

O deploy estava sendo bloqueado pelo **Netlify Secrets Scanner** porque os arquivos de documentação continham valores reais de credenciais.

**Correções aplicadas:**
- ✅ Removidos valores reais dos arquivos CONFIGURAR_NETLIFY.md e DEPLOY_CHECKLIST.md
- ✅ Histórico do Git limpo (secrets removidos de todos os commits)
- ✅ Force push realizado (commit `3767a51`)
- ✅ Backup criado em: `../backup-repo-20260223-011951.git`

---

## ⚡ O QUE VOCÊ PRECISA FAZER AGORA

### Passo 1: Obter Suas Credenciais Reais

Você **DEVE** obter suas credenciais nos dashboards dos serviços:

#### 1.1 Cloudinary
**Acessar:** https://console.cloudinary.com/console

- **Cloud Name**: Aparece no topo do dashboard
- **API Key**: Em Settings → Access Keys → API Key
- **API Secret**: Em Settings → Access Keys → API Secret

#### 1.2 PostHog
**Acessar:** https://app.posthog.com/project/settings

- **Project API Key**: Na seção "Project Variables"
- Copiar o valor que começa com `phc_`

#### 1.3 Supabase
**Acessar:** https://app.supabase.com/project/_/settings/api

- **URL**: Na seção "Configuration" → Project URL
- **Anon Key**: Na seção "Project API keys" → `anon` `public`

---

### Passo 2: Configurar no Netlify

**Acessar:** https://app.netlify.com/sites/ehluc/settings/env

Para cada variável, clicar em **"Add a variable"** e adicionar:

#### Cloudinary (3 variáveis)
```
Key: CLOUDINARY_CLOUD_NAME
Value: <seu cloud name do passo 1.1>
```

```
Key: CLOUDINARY_API_KEY
Value: <sua api key do passo 1.1>
```

```
Key: CLOUDINARY_API_SECRET
Value: <seu api secret do passo 1.1>
```

#### PostHog (1 variável)
```
Key: POSTHOG_KEY
Value: <sua project api key do passo 1.2>
```

#### Supabase (2 variáveis)
```
Key: SUPABASE_URL
Value: <sua url do passo 1.3>
```

```
Key: SUPABASE_ANON_KEY
Value: <sua anon key do passo 1.3>
```

**Total:** 6 variáveis

---

### Passo 3: Aguardar Redeploy

Após salvar as variáveis, o Netlify fará **redeploy automático**.

**Monitorar:** https://app.netlify.com/sites/ehluc/deploys

Aguardar status **"Published"** (verde) - leva 2-3 minutos.

---

### Passo 4: Validar

Depois que o deploy terminar:

```powershell
node validate-deploy.js
```

**Resultado esperado:**
```
✓ Metatag cloudinary-name foi injetada
Total: 14
Passou: 14
Falhou: 0
✅ SITE FUNCIONANDO CORRETAMENTE!
```

---

## 🧪 Testar Funcionalidade

1. Abrir https://upae.com.br
2. Arrastar uma imagem para área de drop
3. Verificar se upload completa
4. Verificar se QR Code é gerado
5. Testar link curto

---

## 🔒 Importante Sobre Segurança

As credenciais que você **usou anteriormente** foram expostas em:
- Conversa do chat
- Commits anteriores do Git

**Recomendação FORTE:**

Após validar que o site funciona corretamente com as credenciais configuradas no Netlify, você **DEVE** regenerar todas elas:

1. **Cloudinary:** Gerar novo API Secret
2. **PostHog:** Revogar e gerar nova Project API Key
3. **Supabase:** Revogar e gerar nova Anon Key

Depois de regenerar, atualizar as variáveis no Netlify novamente.

---

## 🆘 Troubleshooting

### Deploy continua falhando?

**Verificar logs:** https://app.netlify.com/sites/ehluc/deploys

### Site não carrega?

1. Verificar se todas as 6 variáveis foram configuradas
2. Verificar se os valores estão corretos (sem espaços extras)
3. Limpar cache do navegador (`Ctrl + Shift + R`)

### Upload não funciona?

1. Abrir console do navegador (`F12`)
2. Verificar erros em vermelho
3. Verificar se `window.__CLOUD_NAME__` está definido:
   ```javascript
   console.log(window.__CLOUD_NAME__)
   ```

### Testar localmente antes do deploy?

```powershell
# Instalar Netlify CLI (se ainda não tiver)
npm install -g netlify-cli

# Criar arquivo .env local (NUNCA commitar)
notepad .env

# Adicionar suas credenciais reais no .env:
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
POSTHOG_KEY=sua_posthog_key
SUPABASE_URL=https://seu_projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key

# Rodar localmente
netlify dev
```

O site abrirá em `http://localhost:8888`

---

## 📋 Checklist Rápido

- [ ] Obtive minhas credenciais nos dashboards dos serviços
- [ ] Configurei as 6 variáveis no Netlify
- [ ] Aguardei o deploy terminar (status "Published")
- [ ] Executei `node validate-deploy.js` (14/14 passando)
- [ ] Testei upload de arquivo no site
- [ ] Testei QR Code e link curto
- [ ] Vou regenerar as credenciais antigas por segurança

---

## ✅ Resumo

**Problema:** Netlify bloqueou deploy por detectar secrets nos arquivos

**Solução:** 
1. Valores removidos dos arquivos ✅
2. Histórico do Git limpo ✅
3. Force push realizado ✅

**Próximo passo:** Você precisa configurar as variáveis de ambiente no Netlify com SUAS credenciais reais (obtidas nos dashboards dos serviços).

**Tempo estimado:** 10 minutos

---

## 📞 Links Úteis

- **Netlify Env Vars:** https://app.netlify.com/sites/ehluc/settings/env
- **Netlify Deploys:** https://app.netlify.com/sites/ehluc/deploys
- **Cloudinary Dashboard:** https://console.cloudinary.com/console
- **PostHog Settings:** https://app.posthog.com/project/settings
- **Supabase API:** https://app.supabase.com/project/_/settings/api
