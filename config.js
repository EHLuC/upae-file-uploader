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

/**
 * Configuração Global
 * 
 * Aqui eu busco as variáveis de ambiente do servidor sem deixar elas expostas no código.
 * Faço um fetch pra API que me devolve as configs necessárias tipo cloudinary e posthog.
 * Uso async/await pra garantir que carregou antes de usar no resto do site.
 */

window.configLoaded = (async function() {
  try {
    // Busco as configs do backend
    const response = await fetch('/.netlify/functions/config');
    const config = await response.json();
    
    // Populo as variáveis globais que o resto do site usa
    window.__CLOUD_NAME__ = config.cloudName || 'demo-cloud';
    window.__POSTHOG_KEY__ = config.posthogKey || null;
    
    // Se tiver PostHog, inicializo ele aqui mesmo
    if (window.__POSTHOG_KEY__ && window.posthog) {
      posthog.init(window.__POSTHOG_KEY__, { api_host: 'https://us.i.posthog.com' });
    }
    
    // Aviso se tá usando config fake de desenvolvimento
    if (window.__CLOUD_NAME__ === 'demo-cloud') {
      console.warn('⚠️ Usando config de desenvolvimento');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao carregar config:', error);
    // Fallback pra valores de desenvolvimento se der erro
    window.__CLOUD_NAME__ = 'demo-cloud';
    window.__POSTHOG_KEY__ = null;
    return false;
  }
})();
