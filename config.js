/**
 * Configuração Global do Aplicativo
 * 
 * Aqui eu leio as informações sensíveis que o servidor injetou como metatags.
 * Isso garante que nenhuma chave secreta fica hardcoded no repositório público.
 * 
 * Fluxo:
 * 1. O servidor (Netlify) injeta metatags com as chaves do ambiente
 * 2. Este script lê as metatags ao carregar
 * 3. Popula window.__CLOUD_NAME__ para uso no resto da aplicação
 * 4. Se alguma chave tiver faltando, fico com um valor de desenvolvimento
 */

(function() {
  // Aqui eu fico seguro que essas variáveis globais existem,
  // independentemente de ter sido injetado pelo servidor ou não
  
  // Leio o Cloud Name do Cloudinary da metatag. Se não tiver,
  // fico com um valor genérico para desenvolvimento
  window.__CLOUD_NAME__ = document.querySelector('meta[name="cloudinary-name"]')?.content || 'demo-cloud';
  
  // Leio também a chave do PostHog, se tiver sido injetada
  window.__POSTHOG_KEY__ = document.querySelector('meta[name="posthog-key"]')?.content || null;
  
  // Log para debug (remover em produção)
  if (window.__CLOUD_NAME__ === 'demo-cloud') {
    console.warn(
      'ℹ️ Usando Cloud Name de desenvolvimento. ' +
      'Em produção, o servidor deve injetar o valor real via metatag.'
    );
  }
  
  // Validação básica para garantir que temos pelo menos um valor configurado
  if (!window.__CLOUD_NAME__) {
    console.error(
      '❌ ERRO: Cloud Name não foi configurado! ' +
      'O servidor deveria ter injetado a metatag com cloudinary-name.'
    );
  }
})();
