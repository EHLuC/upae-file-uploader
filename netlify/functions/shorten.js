// netlify/functions/shorten.js
const { createClient } = require('@supabase/supabase-js');

// Configura a conexão com o banco de dados usando as chaves que salvamos no Netlify
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Nossas listas de palavras para gerar os slugs
const adjetivos = ["rapido", "feliz", "agil", "dourado", "espacial", "secreto", "veloz", "lendario", "magico", "brilhante", "forte", "astuto", "valente", "curioso", "sereno", "vibrante", "epico", "lunar", "solar", "etereo"];
const comidas = ["coxinha", "pastel", "picanha", "brigadeiro", "mandioca", "laranja", "cupuacu", "caju", "tapioca", "vatapa", "acaraje", "feijoada", "caipirinha", "pudim", "churrasco", "pacoca", "guarana", "jabuticaba", "maracuja", "açaí", "farofa", "moqueca", "pirao", "carambola"];

exports.handler = async (event) => {
  // O link longo do Cloudinary virá do nosso site
  const { longUrl } = JSON.parse(event.body);

  if (!longUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL longa não fornecida.' }) };
  }

  try {
    // Gera um slug divertido e único
    let slug;
    let isUnique = false;
    while (!isUnique) {
        const adjetivoAleatorio = adjetivos[Math.floor(Math.random() * adjetivos.length)];
        const comidaAleatoria = comidas[Math.floor(Math.random() * comidas.length)];
        slug = `${comidaAleatoria}-${adjetivoAleatorio}`;

        // Verifica no banco de dados se esse slug já existe
        const { data } = await supabase.from('links').select('slug').eq('slug', slug);
        if (data.length === 0) {
            isUnique = true; // Encontramos um que não existe, podemos usar!
        }
    }

    // Salva o novo link no banco de dados
    const { error } = await supabase
      .from('links')
      .insert({ slug: slug, original_url: longUrl });

    if (error) {
      throw error; // Se der erro ao salvar, joga para o catch
    }

    // Retorna o slug gerado para o nosso site
    return {
      statusCode: 200,
      body: JSON.stringify({ slug: slug }),
    };

  } catch (error) {
    console.error('Erro na função shorten:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Não foi possível encurtar o link.' }),
    };
  }
};