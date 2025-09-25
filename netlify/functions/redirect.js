// netlify/functions/redirect.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  // FORMA ANTIGA (REMOVIDA)
  // const slug = event.queryStringParameters.slug;

  // NOVA FORMA, MAIS ROBUSTA: Pega o slug diretamente do caminho da URL
  // Ex: se a URL for "/s/coxinha-feliz", ele pega "coxinha-feliz"
  const slug = event.path.split('/s/')[1];

  if (!slug || slug.trim() === '') {
    // Se não houver slug, redireciona para a página inicial
    return {
      statusCode: 302,
      headers: {
        Location: '/',
      },
      body: '',
    };
  }

  try {
    const { data, error } = await supabase
      .from('links')
      .select('original_url')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new Error('Link não encontrado.');
    }

    // Redireciona para o link longo do Cloudinary
    return {
      statusCode: 302,
      headers: {
        Location: data.original_url,
      },
      body: '',
    };

  } catch (error) {
    console.error('Erro de redirecionamento:', error);
    // Se o slug não for encontrado no banco de dados, retorna um erro 404
    return {
      statusCode: 404,
      body: 'Ops! Este link não existe ou foi removido.',
    };
  }
};