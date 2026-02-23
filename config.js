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

(async function() {
  try {
    const response = await fetch('/.netlify/functions/config');
    const config = await response.json();
    
    window.__CLOUD_NAME__ = config.cloudName || 'demo-cloud';
    window.__POSTHOG_KEY__ = config.posthogKey || null;
    
    if (window.__POSTHOG_KEY__ && window.posthog) {
      posthog.init(window.__POSTHOG_KEY__, { api_host: 'https://us.i.posthog.com' });
    }
    
    if (window.__CLOUD_NAME__ === 'demo-cloud') {
      console.warn('Usando config de desenvolvimento');
    }
  } catch (error) {
    console.error('Erro ao carregar config:', error);
    window.__CLOUD_NAME__ = 'demo-cloud';
    window.__POSTHOG_KEY__ = null;
  }
})();
