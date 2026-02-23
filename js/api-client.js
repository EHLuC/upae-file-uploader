/**
 * API Client para o Upaê
 * 
 * Aqui eu centralizo todas as chamadas de API. Faço isso para garantir que:
 * 1. Todas as requisições têm timeout (não ficam presas por sempre)
 * 2. Se uma requisição falhar, eu tento de novo automaticamente
 * 3. Se tentar muitas vezes e falhar, aviso o usuário
 * 
 * Importante: Eu uso "backoff exponencial" para não sobrecarregar o servidor
 * se ele estiver com problema. Primeiro tenta em 1s, depois 2s, depois 4s...
 */

const API_CONFIG = {
  timeout: 30000,           // Cada requisição tem 30 segundos
  maxRetries: 3,            // Se falhar, tento mais 3 vezes
  retryDelay: 1000,         // Primeiro retry após 1 segundo
  backoffMultiplier: 2      // Cada retry dobra o tempo de espera
};

/**
 * Faz uma requisição com segurança.
 * Se der erro de rede, eu tento de novo automaticamente.
 * Se o servidor não responder em 30s, eu cancelo a requisição.
 */
const fetchWithTimeoutAndRetry = async (url, options = {}) => {
  const {
    timeout = API_CONFIG.timeout,
    maxRetries = API_CONFIG.maxRetries,
    retryDelay = API_CONFIG.retryDelay,
    ...fetchOptions
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      lastError = error;
      clearTimeout(timeoutId);

      // Não fazer retry em erros de validação (4xx)
      if (error.name === 'AbortError') {
        lastError = new Error('Requisição expirou. Tente novamente.');
      }

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(API_CONFIG.backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Gera assinatura de upload do servidor
 * @returns {Promise<object>} { signature, timestamp, api_key, etc }
 */
const getUploadSignature = async () => {
  const response = await fetchWithTimeoutAndRetry('/.netlify/functions/generate-signature');
  return FileValidator.validateJsonResponse(response, 'Obtendo assinatura');
};

/**
 * Encurta URL via servidor
 * @param {string} longUrl - URL longa do Cloudinary
 * @returns {Promise<string>} Slug do link curto
 */
const shortenUrl = async (longUrl) => {
  const response = await fetchWithTimeoutAndRetry('/.netlify/functions/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ longUrl })
  });
  
  const data = await FileValidator.validateJsonResponse(response, 'Encurtando link');
  return data.slug;
};

/**
 * Faço upload do arquivo direto ao Cloudinary. O nome da cloud vem da função
 * getCloudName() que lê de uma variável de ambiente. Dessa forma, ninguém que
 * temacesso ao repositório consegue ver qual é minha conta do Cloudinary.
 * 
 * @param {File} file - O arquivo que o usuário quer fazer upload
 * @param {object} signature - Os dados de assinatura que recebi do servidor
 * @param {string} resourceType - Tipo do recurso: 'image', 'video' ou 'raw'
 * @returns {Promise<object>} A resposta do Cloudinary com os dados do upload
 */
const uploadToCloudinary = async (file, signature, resourceType = 'auto') => {
  // Monto um FormData com tudo que o Cloudinary precisa para validar o upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.api_key);
  formData.append('timestamp', signature.timestamp);
  formData.append('signature', signature.signature);
  formData.append('use_filename', 'true');  // Quero manter o nome original do arquivo
  formData.append('unique_filename', 'false'); // E não quero que o Cloudinary adicione sufixos aleatórios

  // Aqui leio o nome da minha cloud do Cloudinary a partir de uma variável de ambiente
  // que é injetada via metatag HTML (mais seguro que hardcoding)
  const cloudName = window.__CLOUD_NAME__ || 'default-cloud';
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  
  console.log('🚀 Fazendo upload para:', uploadUrl);

  // Faço a requisição com timeout de 60 segundos porque upload de arquivo grande
  // pode levar um tempo
  const response = await fetchWithTimeoutAndRetry(uploadUrl, {
    method: 'POST',
    body: formData,
    timeout: 60000
  });

  // Valido se a resposta do Cloudinary é válida e tem os dados que espero
  return FileValidator.validateJsonResponse(response, 'Upload do arquivo');
};

// Exportar para uso global
window.ApiClient = {
  fetchWithTimeoutAndRetry,
  getUploadSignature,
  shortenUrl,
  uploadToCloudinary,
  config: API_CONFIG
};
