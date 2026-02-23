/**
 * Função Netlify: Encurtador de Links
 * 
 * O que ela faz:
 * Pegauma URL longa do Cloudinary e cria um link curto e amigável.
 * Por exemplo: https://res.cloudinary.com/.../muito/longo/arquivo.jpg
 * Vira: https://upae.com.br/s/coxinha-feliz
 * 
 * Como funciona:
 * 1. Valido se a URL é realmente do Cloudinary (segurança)
 * 2. Gero um slug aleatório mas amigável (ex: "coxinha-feliz")
 * 3. Checo se esse slug já existe no banco de dados
 * 4. Se existir, tento outro slug (até 10 vezes)
 * 5. Guardo no banco de dados: slug → URL longa
 * 6. Pronto! Agora o link curto funciona
 * 
 * Segurança:
 * - Validação rigorosa de URL de entrada
 * - Não aceito URLs que apontam para outro lugar
 * - Rate limiting para evitar que alguém crie millions de links
 */

const { createClient } = require('@supabase/supabase-js');
const { validateRequest, getCorsHeaders, handleError, validateUrl, sanitizeString } = require('./lib/security');

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

// Listas de palavras para gerar slugs amigáveis
const adjetivos = [
  "rapido", "feliz", "agil", "dourado", "espacial", "secreto", "veloz", 
  "lendario", "magico", "brilhante", "forte", "astuto", "valente", "curioso", 
  "sereno", "vibrante", "epico", "lunar", "solar", "etereo"
];

const comidas = [
  "coxinha", "pastel", "picanha", "brigadeiro", "mandioca", "laranja", 
  "cupuacu", "caju", "tapioca", "vatapa", "acaraje", "feijoada", "caipirinha", 
  "pudim", "churrasco", "pacoca", "guarana", "jabuticaba", "maracuja", "acai", 
  "farofa", "moqueca", "pirao", "carambola"
];

const MAX_RETRY_ATTEMPTS = 10;

/**
 * Gera um slug único validado
 * @param {number} attempts - Tentativas atuais
 * @returns {Promise<string>} Slug gerado
 */
const generateUniqueSlug = async (attempts = 0) => {
  if (attempts > MAX_RETRY_ATTEMPTS) {
    throw new Error('Failed to generate unique slug after maximum attempts');
  }

  const adjetivoAleatorio = adjetivos[Math.floor(Math.random() * adjetivos.length)];
  const comidaAleatoria = comidas[Math.floor(Math.random() * comidas.length)];
  const slug = `${comidaAleatoria}-${adjetivoAleatorio}`;

  // Verificar unicidade no banco de dados
  const { data, error } = await supabase
    .from('links')
    .select('slug', { count: 'exact' })
    .eq('slug', slug)
    .single();

  // Se erro é PGRST116, significa que nenhum registro foi achado (slug é único)
  const isUnique = error?.code === 'PGRST116' || !data;

  if (isUnique) {
    return slug;
  }

  // Recursivamente tenta novamente com retry exponencial
  return generateUniqueSlug(attempts + 1);
};

exports.handler = async (event) => {
  try {
    // Validações iniciais
    const validationError = validateRequest(event, { validateBody: true });
    if (validationError) {
      return validationError;
    }

    // Apenas POST permitido
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'OPTIONS') {
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

    // Extrair e validar body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }

    const { longUrl } = requestBody;

    // Validação rigorosa da URL
    if (!longUrl || typeof longUrl !== 'string') {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'URL longa não fornecida ou é inválida' })
      };
    }

    if (!validateUrl(longUrl)) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({ error: 'URL inválida ou não permitida' })
      };
    }

    // Gera slug único
    const slug = await generateUniqueSlug();

    // Valida slug gerado (defensive programming)
    if (!slug || slug.length < 3 || slug.length > 50) {
      throw new Error('Generated slug does not meet requirements');
    }

    // Inserir no banco de dados
    const { error: insertError } = await supabase
      .from('links')
      .insert({
        slug: slug,
        original_url: longUrl,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Database error:', insertError);
      throw new Error('Failed to save shortened link');
    }

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({ slug: slug })
    };

  } catch (error) {
    return handleError(error, 500);
  }
};