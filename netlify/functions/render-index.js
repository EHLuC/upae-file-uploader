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
    const htmlPath = path.join(__dirname, '..', '..', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    const posthogKey = process.env.POSTHOG_KEY || '';
    
    console.log('Env vars:', {
      cloudName: cloudName ? `${cloudName.substring(0, 3)}...` : 'VAZIO',
      posthogKey: posthogKey ? 'tem valor' : 'VAZIO'
    });
    
    if (!cloudName) {
      console.error('CLOUDINARY_CLOUD_NAME não configurada!');
    }
    
    html = html.replace(
      '<meta name="cloudinary-name" content="">',
      `<meta name="cloudinary-name" content="${cloudName}">`
    );
    
    html = html.replace(
      '<meta name="posthog-key" content="">',
      `<meta name="posthog-key" content="${posthogKey}">`
    );
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
      },
      body: html
    };
    
  } catch (error) {
    console.error('Erro ao renderizar:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Erro ao carregar página'
    };
  }
};
