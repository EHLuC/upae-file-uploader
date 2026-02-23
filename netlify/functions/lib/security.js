/**
 * Segurança Centralizada
 * 
 * Aqui eu coloco toda a lógica de segurança que uso em minhas APIs.
 * Tudo em um lugar torna mais fácil auditar e atualizar as regras de segurança.
 * 
 * O que eu protejo aqui:
 * 1. Valido todas as entradas do usuário
 * 2. Faço sanitização para remover caracteres perigosos (XSS)
 * 3. Implemento rate limiting por IP para evitar abuso
 * 4. Configuro CORS para permitir apenas requisições seguras
 * 5. Tratamento de erros que não expõe detalhes internos
 */

const RATE_LIMIT_WINDOW = 60 * 1000; // Janela de 1 minuto para contar requisições
const RATE_LIMIT_MAX_REQUESTS = 30;   // Máximo 30 requisições por minuto por IP
const requestCounts = new Map();       // Aqui eu conto as requisições no servidor

/**
 * Eu valido se uma string é segura para usar.
 * Checo: comprimento, padrão, caracteres inválidos
 */
const validateInput = (input, options = {}) => {
  const {
    maxLength = 500,
    pattern = /^[\w\-\.\/]+$/,
    allowEmpty = false
  } = options;

  if (!input) {
    return allowEmpty;
  }

  if (typeof input !== 'string') {
    return false;
  }

  if (input.length > maxLength) {
    return false;
  }

  return pattern.test(input);
};

/**
 * Sanitiza string removendo caracteres perigosos
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizada
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>\"'`]/g, '') // Remove XSS patterns
    .replace(/[^a-zA-Z0-9\-_.]/g, '') // Apenas caracteres seguros
    .slice(0, 100); // Limite de comprimento
};

/**
 * Implementa rate limiting por IP
 * @param {string} ip - Endereço IP do cliente
 * @returns {boolean} true se está dentro do limite
 */
const checkRateLimit = (ip) => {
  const now = Date.now();
  const userKey = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
  
  const count = requestCounts.get(userKey) || 0;
  
  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  requestCounts.set(userKey, count + 1);
  
  // Limpeza de cache antigo
  if (requestCounts.size > 10000) {
    for (const [key] of requestCounts) {
      const [, timestamp] = key.split(':');
      if (now - parseInt(timestamp) * RATE_LIMIT_WINDOW > RATE_LIMIT_WINDOW * 2) {
        requestCounts.delete(key);
      }
    }
  }
  
  return true;
};

/**
 * Extrai o IP real do cliente (considerando proxies)
 * @param {object} headers - Headers do evento Netlify
 * @returns {string} IP do cliente
 */
const getClientIP = (headers) => {
  return (
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['x-client-ip'] ||
    headers['cf-connecting-ip'] ||
    'unknown'
  );
};

/**
 * Valida URL (Cloudinary)
 * @param {string} url - URL a validar
 * @returns {boolean} true se válida
 */
const validateUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Apenas permitir HTTPS e domínios de nuvem conhecidos
    if (parsed.protocol !== 'https:') return false;
    
    const allowedDomains = [
      'res.cloudinary.com',
      'api.cloudinary.com',
      'upae.com.br'
    ];
    
    return allowedDomains.some(domain => parsed.hostname.includes(domain));
  } catch {
    return false;
  }
};

/**
 * Validação de slug (caracteres permitidos)
 * @param {string} slug - Slug a validar
 * @returns {boolean} true se válido
 */
const validateSlug = (slug) => {
  return /^[a-z0-9\-]{1,50}$/.test(slug);
};

/**
 * Retorna headers CORS seguro
 * @returns {object} Headers CORS
 */
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://upae.com.br',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '300',
  'Content-Type': 'application/json'
});

/**
 * Tratamento de erro centralizado
 * @param {Error} error - Erro ocorrido
 * @param {number} statusCode - Status HTTP
 * @returns {object} Response formatado
 */
const handleError = (error, statusCode = 500) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  console.error('ERROR:', {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: isDev ? error.stack : undefined
  });

  // Lista de mensagens seguras para expor em produção
  // Essas não revelam detalhes internos do sistema
  const safeMessages = [
    'Invalid JSON body',
    'URL longa não fornecida ou é inválida',
    'URL inválida ou não permitida',
    'Failed to generate unique slug after maximum attempts',
    'Generated slug does not meet requirements',
    'Failed to save shortened link',
    'Slug não encontrado',
    'Method not allowed',
    'Rate limit exceeded'
  ];
  
  // Se a mensagem está na lista segura, mostro ela
  // Senão, mostro mensagem genérica
  const message = (isDev || safeMessages.includes(error.message))
    ? error.message 
    : 'Erro ao processar requisição';

  return {
    statusCode,
    headers: getCorsHeaders(),
    body: JSON.stringify({ error: message })
  };
};

/**
 * Middleware que agrupa todas as validações
 * @param {object} event - Evento Netlify
 * @param {object} options - { validateBody: bool, validateAuth: bool }
 * @returns {object|null} null se válido, ou erro response
 */
const validateRequest = (event, options = {}) => {
  const { validateBody = true, requireAuth = false } = options;
  
  const ip = getClientIP(event.headers);
  
  // Rate limiting
  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers: getCorsHeaders(),
      body: JSON.stringify({ error: 'Rate limit exceeded' })
    };
  }
  
  // Validação do body se necessário
  if (validateBody && event.body) {
    try {
      JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }
  }
  
  return null; // Válido
};

module.exports = {
  validateInput,
  sanitizeString,
  checkRateLimit,
  getClientIP,
  validateUrl,
  validateSlug,
  getCorsHeaders,
  handleError,
  validateRequest
};
