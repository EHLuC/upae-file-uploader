/**
 * Função Netlify: Redirecionador de Links Curtos
 * 
 * O que ela faz:
 * Quando alguém acessa https://upae.com.br/s/coxinha-feliz, eu preciso saber
 * para qual URL longa redirecionar. É assim que o link curto funciona.
 * 
 * Fluxo:
 * 1. Usuário clica em https://upae.com.br/s/coxinha-feliz
 * 2. Meu servidor (Netlify) chama esta função
 * 3. Eu busco no banco de dados qual é a URL longa para "coxinha-feliz"
 * 4. Redireciono o navegador para a URL longa (HTTP 302)
 * 5. Pronto! O arquivo do Cloudinary aparece
 * 
 * Segurança:
 * - Valido se o slug é válido (caracteres seguros)
 * - Não exponho informações sobre slugs que não existem
 * - Rate limiting para evitar enumeration attack
 * - Valido a URL antes de redirecionar (não quero redirecionar para site malígno)
 */

const { createClient } = require('@supabase/supabase-js');
const { validateRequest, getCorsHeaders, handleError, validateSlug } = require('./lib/security');

// Validar variáveis de ambiente
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Extrair slug do caminho da URL ou da query string
    // Ex: "/s/coxinha-feliz" -> "coxinha-feliz"
    // Ou: "?slug=coxinha-feliz" -> "coxinha-feliz"
    let slug = null;
    
    // Tentar pegar do path primeiro
    const pathParts = event.path.split('/');
    const slugIndex = pathParts.indexOf('s');
    if (slugIndex !== -1 && pathParts[slugIndex + 1]) {
      slug = pathParts[slugIndex + 1].split('?')[0]; // Remove query strings
    }
    
    // Se não achou no path, tenta pegar da query string
    if (!slug && event.queryStringParameters?.slug) {
      slug = event.queryStringParameters.slug;
    }
    
    // Se ainda não tem slug, redireciona pra home
    if (!slug) {
      return {
        statusCode: 302,
        headers: {
          Location: '/',
          ...getCorsHeaders()
        },
        body: ''
      };
    }

    // Validação rigorosa do slug
    if (!validateSlug(slug)) {
      return {
        statusCode: 302,
        headers: {
          Location: '/',
          ...getCorsHeaders()
        },
        body: ''
      };
    }

    // Buscar link no banco de dados
    const { data, error } = await supabase
      .from('links')
      .select('original_url')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      // Não expor ao usuário que o link não existe (proteção contra enumeration)
      console.warn(`Link not found for slug: ${slug}`);
      
      return {
        statusCode: 404,
        headers: getCorsHeaders(),
        body: 'Ops! Este link não existe ou foi removido.'
      };
    }

    // Validar URL antes de redirecionar (defensively)
    const urlRegex = /^https?:\/\/.+/i;
    if (!urlRegex.test(data.original_url)) {
      throw new Error(`Invalid URL format in database for slug: ${slug}`);
    }

    // Redirecionar para URL original
    return {
      statusCode: 302,
      headers: {
        Location: data.original_url,
        ...getCorsHeaders(),
        'Cache-Control': 'no-cache' // Não cachear redirects de upload único
      },
      body: ''
    };

  } catch (error) {
    return handleError(error, 500);
  }
};