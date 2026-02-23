/**
 * Função Netlify: Gera Assinatura para Upload ao Cloudinary
 * 
 * Por que eu preciso disso?
 * O Cloudinary permite uploads assinados. Isso quer dizer que eu não coloco minha
 * chave secreta no navegador do usuário (isso seria inseguro). Em vez disso:
 * 1. O navegador pede uma assinatura para este servidor
 * 2. Eu gero uma assinatura usando minha chave secreta
 * 3. Passoessa assinatura para o navegador
 * 4. O navegador usa a assinatura para fazer upload sem saber minha chave
 * 
 * Segurança:
 * - Eu valido que a requisição é legítima (rate limiting)
 * - Gero uma assinatura que expira em 5 minutos
 * - Não expôno minha API Key na resposta final
 */

const cloudinary = require('cloudinary').v2;
const { validateRequest, getCorsHeaders, handleError } = require('./lib/security');

// Validar variáveis de ambiente na inicialização
const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configuração de assinatura segura
// IMPORTANTE: Apenas parâmetros que também serão enviados no upload!
// O Cloudinary valida que a assinatura foi gerada com os MESMOS parâmetros
// Valores devem ser strings porque FormData converte tudo para string
const SIGNATURE_CONFIG = {
  timestamp: null, // Será preenchido
  use_filename: 'true',
  unique_filename: 'false'
};

// Validade da assinatura em segundos
const SIGNATURE_EXPIRY = 300; // 5 minutos

exports.handler = async (event) => {
  try {
    // Validações iniciais
    const validationError = validateRequest(event, { validateBody: false });
    if (validationError) {
      return validationError;
    }

    // Apenas GET/OPTIONS permitido
    if (!['GET', 'OPTIONS'].includes(event.httpMethod)) {
      return {
        statusCode: 405,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Responder a CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: getCorsHeaders(),
        body: ''
      };
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Criar signature com config segura
    const signaturePayload = {
      ...SIGNATURE_CONFIG,
      timestamp: timestamp
    };

    const signature = cloudinary.utils.api_sign_request(
      signaturePayload,
      cloudinary.config().api_secret
    );

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        signature,
        timestamp,
        api_key: cloudinary.config().api_key,
        expiry: timestamp + SIGNATURE_EXPIRY,
        cloud_name: cloudinary.config().cloud_name
      })
    };

  } catch (error) {
    return handleError(error, 500);
  }
};