# Setup das Variáveis de Ambiente

Se o site não tá funcionando, provavelmente é porque as variáveis de ambiente não foram configuradas no Netlify. Isso aqui é bem rápido de resolver.

## Como resolver

Você vai precisar adicionar algumas variáveis no painel do Netlify. Leva uns 5 minutos no máximo.

### 1. Entrar no dashboard do Netlify

Vai em: https://app.netlify.com/sites/ehluc/settings/env

### 2. Adicionar as variáveis

Clica em "Add a variable" e adiciona essas 6 variáveis:

**Cloudinary** (pra armazenar os arquivos):
- `CLOUDINARY_CLOUD_NAME` - Pega no dashboard do Cloudinary
- `CLOUDINARY_API_KEY` - Também no dashboard
- `CLOUDINARY_API_SECRET` - Fica em Settings → Access Keys

**PostHog** (analytics):
- `POSTHOG_KEY` - Começa com `phc_`, pega em Project Settings

**Supabase** (banco de dados pros links curtos):  
- `SUPABASE_URL` - URL do seu projeto  
- `SUPABASE_ANON_KEY` - A chave pública (anon/public)

### 3. Esperar o redeploy

Depois de salvar, o Netlify faz redeploy automático. Leva 1-2 minutos.

## Testar se funcionou

Depois disso, pode rodar:

```bash
node validate-deploy.js
```

Ou simplesmente tentar fazer upload de um arquivo em https://upae.com.br

## Se ainda não funcionar

**Cache do navegador pode estar zuando:**
- `Ctrl + Shift + R` pra recarregar forçando

**Ver os logs do deploy:**
- https://app.netlify.com/sites/ehluc/deploys
- Procura por erros em vermelho

**Testar localmente primeiro:**
```bash
# Cria um .env local com suas credenciais
echo "CLOUDINARY_CLOUD_NAME=seu_cloud_name" > .env
echo "CLOUDINARY_API_KEY=sua_api_key" >> .env  
echo "CLOUDINARY_API_SECRET=seu_secret" >> .env
echo "POSTHOG_KEY=sua_key" >> .env
echo "SUPABASE_URL=https://seu_projeto.supabase.co" >> .env
echo "SUPABASE_ANON_KEY=sua_anon_key" >> .env

# Roda localmente
netlify dev
```

## Onde pegar cada credencial

**Cloudinary:**
- Login: https://console.cloudinary.com/console
- Cloud Name tá ali no topo
- API Key e Secret em Settings → Access Keys

**PostHog:**
- Login: https://app.posthog.com/project/settings  
- Project API Key na seção "Project Variables"

**Supabase:**
- Login: https://app.supabase.com/project/_/settings/api
- URL do projeto e Anon Key tão ali

## Nota sobre segurança

Se você expôs suas credenciais em algum lugar (chat, commit do git, etc), roda no painel de cada serviço e gera novas. Melhor prevenir.
