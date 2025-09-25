# Upaê File Uploader 🚀

![Prévia do Upaê File Uploader](https://upae.com.br/social-preview.png)

> Aplicação web para upload e compartilhamento rápido de arquivos, com encurtador de links próprio. Construído com JavaScript puro e uma arquitetura serverless moderna.

**Acesse o site ao vivo:** **[upae.com.br](https://upae.com.br/)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Netlify Status](https://api.netlify.com/api/v1/badges/95a7eac0-b9ce-47f7-9216-5a2441e30301/deploy-status)](https://app.netlify.com/projects/ehluc/deploys)](https://app.netlify.com/sites/ehluc/deploys)

---

## 📋 Sobre o Projeto

O **Upaê** nasceu de uma jornada de aprendizado, começando com um simples erro de `NetworkError` e evoluindo para uma aplicação web completa. O objetivo é fornecer uma ferramenta minimalista e eficiente para o upload temporário e compartilhamento de arquivos de qualquer tipo, gerando links curtos e QR Codes instantaneamente.

Este projeto foi construído do zero, explorando conceitos de desenvolvimento front-end, back-end serverless, integração com APIs de terceiros e gerenciamento de banco de dados.

## ✨ Principais Funcionalidades

- **Upload de Qualquer Arquivo:** Arraste e solte ou selecione imagens, PDFs, ZIPs, etc. (limite de 10 MB no plano atual).
- **Armazenamento em Nuvem:** Integração segura com o **Cloudinary** para armazenamento robusto de arquivos.
- **Encurtador de Links Próprio:** Gera links curtos e amigáveis (ex: `/s/coxinha-feliz`) para cada upload, com tecnologia **Supabase**.
- **Nomes de Arquivo Originais:** Mantém o nome original do arquivo no link final para fácil identificação.
- **Geração de QR Code:** Cria um QR Code instantâneo para compartilhamento rápido entre desktop e mobile.
- **Design Moderno:** Interface com tema escuro (Palenight), responsiva e amigável.
- **Segurança:** Configurado com cabeçalhos de segurança HTTP para proteção contra ataques comuns, alcançando nota A no Security Headers.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando a filosofia Jamstack, com uma arquitetura serverless.

- **Front-end:** HTML5, CSS3, JavaScript (Vanilla JS)
- **Back-end (Serverless):** Netlify Functions (Node.js)
- **Hospedagem e Deploy:** Netlify
- **Armazenamento de Arquivos:** Cloudinary
- **Banco de Dados:** Supabase (PostgreSQL)
- **Análise de Dados:** Google Analytics

## ⚙️ Como Executar o Projeto Localmente

Para rodar este projeto no seu próprio ambiente:

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/EHLuC/upae-file-uploader.git](https://github.com/EHLuC/upae-file-uploader.git)
    ```
2.  **Entre na pasta do projeto:**
    ```bash
    cd upae-file-uploader
    ```
3.  **Instale as dependências:**
    ```bash
    npm install
    ```
4.  **Configure as Variáveis de Ambiente:**
    Você precisará de contas no Netlify, Cloudinary e Supabase. Configure as seguintes variáveis de ambiente no painel do seu site no Netlify (ou em um arquivo `.env` para teste local):

    - `CLOUDINARY_CLOUD_NAME`
    - `CLOUDINARY_API_KEY`
    - `CLOUDINARY_API_SECRET`
    - `SUPABASE_URL`
    - `SUPABASE_KEY` (use a chave `service_role`)

5.  **Inicie o servidor de desenvolvimento:**
    ```bash
    netlify dev
    ```

## 📄 Licença

Este projeto está sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Feito com ❤️ por **Lucas Cassiano** ([EHLuC](https://github.com/EHLuC)).
