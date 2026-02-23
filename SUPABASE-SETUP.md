# Configuração do Supabase

## Problema Atual

A função shorten está falhando com erro genérico. Provavelmente a tabela `links` não existe no Supabase.

## Como Verificar

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute este comando para ver se a tabela existe:

```sql
SELECT * FROM information_schema.tables
WHERE table_name = 'links';
```

## Criar a Tabela

Se a tabela não existir, execute este SQL no **SQL Editor** do Supabase:

```sql
-- Cria a tabela de links encurtados
CREATE TABLE IF NOT EXISTS links (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visits INTEGER DEFAULT 0
);

-- Índice para buscas rápidas por slug
CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer um pode ler links (para redirecionamento)
CREATE POLICY "Allow public read access" ON links
  FOR SELECT USING (true);

-- Política: Apenas authenticated users podem inserir (ajuste conforme necessário)
-- Para permitir inserção anônima (necessário pro seu site), use:
CREATE POLICY "Allow anonymous insert" ON links
  FOR INSERT WITH CHECK (true);
```

## Verificar Variáveis de Ambiente no Netlify

As seguintes variáveis devem estar configuradas no Netlify:

1. **SUPABASE_URL**: URL do seu projeto Supabase (ex: https://xyz.supabase.co)
2. **SUPABASE_KEY**: Chave anon/public do Supabase

Para encontrar essas credenciais:

1. Dashboard do Supabase > Settings > API
2. Copie **Project URL** → `SUPABASE_URL`
3. Copie **anon public** key → `SUPABASE_KEY`

## Testar Depois de Configurar

Depois de criar a tabela e configurar as variáveis:

1. Aguarde o Netlify fazer redeploy (ou force um deploy)
2. Teste o upload: https://upae.com.br
3. Se der erro, verifique os logs: Netlify Dashboard > Functions > shorten
