# 🚨 CONFIGURAÇÃO OBRIGATÓRIA DO NETLIFY

## Problema Atual

O site está quebrado porque as **variáveis de ambiente não estão configuradas** no Netlify.

**Erro identificado:**

```
✗ Metatag cloudinary-name foi injetada
```

Isso significa que `CLOUDINARY_CLOUD_NAME` não foi configurada.

---

## ⚡ Solução Rápida (5 minutos)

### 1. Acessar Dashboard do Netlify

**URL:** https://app.netlify.com/sites/ehluc/settings/env

### 2. Clicar em "Add a variable"

### 3. Adicionar cada variável abaixo:

#### Cloudinary

```
Key: CLOUDINARY_CLOUD_NAME
Value: <SEU_CLOUD_NAME_AQUI>
```

```
Key: CLOUDINARY_API_KEY
Value: <SUA_API_KEY_AQUI>
```

```
Key: CLOUDINARY_API_SECRET
Value: <SEU_API_SECRET_AQUI>
```

#### PostHog (Analytics)

```
Key: POSTHOG_KEY
Value: <SUA_POSTHOG_KEY_AQUI>
```

#### Supabase (Banco de Dados para Links Curtos)

```
Key: SUPABASE_URL
Value: https://<SEU_PROJETO>.supabase.co
```

```
Key: SUPABASE_ANON_KEY
Value: <SUA_SUPABASE_ANON_KEY_AQUI>
```

### 4. Salvar e Aguardar Redeploy

O Netlify vai fazer **redeploy automático** (1-2 minutos).

---

## ✅ Validar Configuração

Após o redeploy terminar:

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

## 🧪 Testar Upload

1. Abrir: https://upae.com.br
2. Arrastar uma imagem
3. Verificar se QR Code é gerado
4. Testar link curto

---

## 🔒 Lembrete de Segurança

⚠️ **As credenciais acima foram EXPOSTAS no chat!**

Após validar que o site funciona, você DEVE:

1. **Cloudinary:** https://console.cloudinary.com/settings/security → Gerar novo API Secret
2. **PostHog:** https://app.posthog.com/project/settings → Revogar key → Gerar nova
3. **Supabase:** https://app.supabase.com/project/REDACTED_SUPABASE_PROJECT/settings/api → Revogar key → Gerar nova

Depois, atualizar as variáveis no Netlify com os **novos valores**.

---

## 📸 Guia Visual

### Passo 1: Acessar Environment Variables

![Netlify Settings](https://app.netlify.com/sites/ehluc/settings/env)

### Passo 2: Adicionar Variável

- Clicar em **"Add a variable"**
- Preencher **Key** (ex: `CLOUDINARY_CLOUD_NAME`)
- Preencher **Value** com sua credencial real (obtenha no dashboard do serviço)
- Clicar em \*\*"Create variable"

### Passo 3: Repetir para Todas

Adicionar as 6 variáveis listadas acima.

### Passo 4: Aguardar Deploy

Ver logs em: https://app.netlify.com/sites/ehluc/deploys

---

## 🆘 Troubleshooting

### Site continua quebrado após configurar?

1. **Verificar se redeploy terminou**
   - Acessar: https://app.netlify.com/sites/ehluc/deploys
   - Status deve estar "Published" (verde)

2. **Limpar cache do navegador**
   - Apertar `Ctrl + Shift + Delete`
   - Selecionar "Cached images and files"
   - Limpar

3. **Verificar logs do Netlify**

   ```powershell
   netlify functions:log render-index
   ```

4. **Testar localmente primeiro**

   ```powershell
   # Criar .env local
   notepad .env

   # Copiar estrutura (substituir pelos seus valores reais):
   CLOUDINARY_CLOUD_NAME=<seu_cloud_name>
   CLOUDINARY_API_KEY=<sua_api_key>
   CLOUDINARY_API_SECRET=<seu_api_secret>
   POSTHOG_KEY=<sua_posthog_key>
   SUPABASE_URL=https://<seu_projeto>.supabase.co
   SUPABASE_ANON_KEY=<sua_anon_key>

   # Rodar localmente
   netlify dev
   ```

---

## ✨ Resumo

**O que estava errado:**

- ❌ Variáveis de ambiente não configuradas no Netlify
- ❌ Redeclaração de `const cloudName` no script.js (CORRIGIDO)

**O que você precisa fazer:**

1. Adicionar 6 variáveis de ambiente no Netlify
2. Aguardar redeploy (2 minutos)
3. Executar `node validate-deploy.js`
4. Testar upload no site

**Tempo total:** 5 minutos

**Depois:** Regenerar todas as credenciais por segurança.
