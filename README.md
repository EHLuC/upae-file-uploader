# Upaê 📤

Um uploader de arquivos bem simples pra compartilhar coisas rápido. Arrasta e solta, pega o link curto, manda pro celular via QR code. Bem direto.

**Site:** [upae.com.br](https://upae.com.br/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Netlify Status](https://api.netlify.com/api/v1/badges/95a7eac0-b9ce-47f7-9216-5a2441e30301/deploy-status)](https://app.netlify.com/sites/ehluc/deploys)

---

## O que é isso?

Fiz esse projeto pra poder mandar arquivos do meu PC pro celular sem precisar plugar cabo ou ficar mandando por email. A ideia era simples: joga o arquivo, pega um link curto, escaneia o QR code pronto.

Começou com um erro de rede bem chato e foi evoluindo até virar uma aplicação completa com banco de dados, API segura e tal. Acabou virando um bom estudo de caso de arquitetura serverless.

## O que dá pra fazer?

- **Upload de qualquer coisa** - Imagens, PDFs, ZIPs, o que for. Limite de 10MB
- **Link curto automático** - Em vez de uma URL gigante, você tem algo tipo `upae.com.br/s/gato-feliz`  
- **QR Code na hora** - Escaneia e já abre no celular
- **Mantém o nome original** - Útil pra saber o que é o arquivo depois
- **Tema escuro** - Porque clarinho cansa a vista

## Stack

Isso é um Jamstack puro:

- **Frontend**: HTML, CSS e JavaScript vanilla (sem frameworks porque não precisava)
- **Backend**: Netlify Functions rodando Node.js
- **Storage**: Cloudinary pra guardar os arquivos
- **Database**: Supabase (PostgreSQL) pra armazenar os links curtos  
- **Analytics**: PostHog e Google Analytics

## Rodar localmente

Se quiser testar na sua máquina:

```bash
git clone https://github.com/EHLuC/upae-file-uploader.git
cd upae-file-uploader
npm install
```

Vai precisar criar contas gratuitas no Cloudinary, Supabase e PostHog. Depois configura as variáveis de ambiente no Netlify (ou local via `.env`):

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SUPABASE_URL`  
- `SUPABASE_ANON_KEY`
- `POSTHOG_KEY`

Pra rodar:

```bash
netlify dev
```

Abre no `localhost:8888`

## Estrutura do projeto

```
/
├── index.html              # Página principal
├── style.css               # Estilo (tema Palenight)
├── script.js               # Lógica principal de upload  
├── config.js               # Lê variáveis de ambiente
├── js/
│   ├── validation.js       # Valida arquivos antes de enviar
│   ├── api-client.js       # Requests pro backend
│   └── ui-manager.js       # Cuida da interface
└── netlify/functions/
    ├── render-index.js     # Injeta env vars no HTML
    ├── generate-signature.js  # Assina requests pro Cloudinary
    ├── shorten.js          # Cria links curtos
    ├── redirect.js         # Redireciona links curtos
    └── lib/
        └── security.js     # Rate limiting, validação, etc
```

## Segurança

- Rate limiting de 30 requisições por minuto por IP
- CORS configurado direitinho  
- CSP headers sem unsafe-inline
- Nenhuma credencial hardcoded (tudo via env vars)
- Validação de entrada no frontend e backend

## O que quero adicionar depois

- [ ] Autenticação pra ter histórico de uploads
- [ ] Uploads privados com senha
- [ ] Upload de múltiplos arquivos de uma vez
- [ ] Preview de vídeos
- [ ] Expiration automática dos links

## Licença

MIT. Usa como quiser.

---

Feito por **Lucas Cassiano** ([EHLuC](https://github.com/EHLuC)) - Esse foi meu projeto de aprendizado de serverless. A "décima quinta tentativa" não é brincadeira 😅
