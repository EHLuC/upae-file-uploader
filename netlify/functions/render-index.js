/**
 * Função Netlify: Renderiza index.html
 * 
 * Por que eu preciso dela?
 * Porque eu não quero hardcoded values no código que fica público no GitHub.
 * Então, o que eu faço é:
 * 1. Leio meu index.html original
 * 2. Injeto as metatags com valores que vêm de environment variables (seguras)
 * 3. Devolvo o HTML modificado para o navegador
 * 
 * Dessa forma, quando o usuário abre https://upae.com.br, ele vê as metatags
 * com os valores reais, mas no repositório elas ficam vazias.
 */

const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Aqui eu leio o arquivo index.html que está na raiz do projeto
    const htmlPath = path.join(__dirname, '..', '..', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    // Pego as variáveis de ambiente. Se não tiverem sido configuradas,
    // fico com valores de fallback
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'demo-cloud';
    const posthogKey = process.env.POSTHOG_KEY || '';
    
    // Aqui eu faço a mágica: troco as metatags vazias pelos valores reais
    html = html.replace(
      '<meta name="cloudinary-name" content="">',
      `<meta name="cloudinary-name" content="${cloudName}">`
    );
    
    html = html.replace(
      '<meta name="posthog-key" content="">',
      `<meta name="posthog-key" content="${posthogKey}">`
    );
    
    // Retorno o HTML modificado para o navegador do usuário
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=300', // Cache por 5 minutos
        
        // Headers de segurança que eu sempre adiciono
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      },
      body: html
    };
    
  } catch (error) {
    // Se algo der errado ao ler o arquivo, logar e retornar erro genérico
    console.error('Erro ao renderizar index.html:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Erro ao carregar página. Tente novamente mais tarde.'
    };
  }
};
