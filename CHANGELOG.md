# 📝 CHANGELOG - Histórico de Versões

## [2.0.0] - 2026-02-23

### ✨ Melhorias de Arquitetura

#### Backend

- **`netlify/functions/lib/security.js`** - Camada de segurança centralizada
  - Validação de entrada com regras configuráveis
  - Sanitização de strings
  - Validação de URLs com whitelist
  - Rate limiting por IP (30 req/min)
  - Headers CORS padronizados
  - Error handling centralizado

- **`generate-signature.js`** - Integração de segurança
  - Rate limiting
  - Headers CORS
  - Validação de método HTTP
  - Suporte a preflight OPTIONS

- **`shorten.js`** - Retry inteligente
  - Backoff exponencial
  - Logging estruturado
  - Validação de entrada

- **`redirect.js`** - Otimizações
  - Validação de slug
  - Cache-Control headers
  - Redirecionamento seguro

#### Frontend

- **`js/validation.js`** - Validador de entrada
  - File validation
  - URL validation

- **`js/api-client.js`** - HTTP client robusto
  - Timeout (30-60s)
  - Retry automático
  - AbortController

- **`js/ui-manager.js`** - Gerenciador de UI
  - Manipulação de DOM
  - Event listeners centralizados
  - Suporte a drag & drop

- **`script.js`** - Modularizado
  - Usa novos módulos
  - Fluxo claro: validação → API → UI
  - Tratamento de erro unificado

#### HTTP e Infraestrutura

- **`netlify.toml`** - Headers de segurança
  - Content Security Policy
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options

### 🚀 Novas Funcionalidades

- Timeout em requisições (30-60s)
- Retry automático com backoff
- Rate limiting por IP
- Suite de testes automatizados (28 testes)
- Arquitetura modular no frontend

### 📊 Métricas

| Métrica | Status |
|---------|--------|
| Testes Automatizados | 28/28 ✅ |
| Módulos | 4 especializados |
| Rate Limiting | 30 req/min |
| HTTP Timeout | 30-60s |
| CSP | Configurada |

### 📦 Dependências

- Sem novas dependências de produção
- Dev dependencies: eslint, prettier, nodemon

---

## [1.0.0] - 2025-12-XX

### Versão Inicial

- Upload para Cloudinary
- Encurtador de links com Supabase
- QR Code generation
- Design moderno
- Google Analytics + PostHog
- Netlify deployment