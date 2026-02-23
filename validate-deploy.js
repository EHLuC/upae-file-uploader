/**
 * Script de Validação Pós-Deploy
 * 
 * Eu uso isso para testar se o site está funcionando corretamente após o deploy.
 * Testo:
 * 1. Se a página inicial carrega
 * 2. Se as metatags foram injetadas corretamente
 * 3. Se o config.js consegue ler as metatags
 * 4. Se os endpoints das functions estão respondendo
 */

const https = require('https');

const SITE_URL = 'https://upae.com.br';

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Faz uma requisição HTTP e retorna a resposta
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

/**
 * Testa uma condição e mostra resultado
 */
function test(name, condition) {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗${colors.reset} ${name}`);
  }
}

/**
 * Validações
 */
async function validate() {
  console.log(`\n${colors.blue}=== VALIDAÇÃO PÓS-DEPLOY ===${colors.reset}\n`);
  
  try {
    // Teste 1: Página inicial carrega
    console.log(`${colors.yellow}Testando página inicial...${colors.reset}`);
    const homeResponse = await httpGet(SITE_URL);
    test('Página inicial responde com 200', homeResponse.statusCode === 200);
    
    const html = homeResponse.body;
    
    // Teste 2: Metatags foram injetadas
    console.log(`\n${colors.yellow}Testando injeção de metatags...${colors.reset}`);
    const hasCloudinaryMeta = html.includes('meta name="cloudinary-name"') && 
                               html.includes('content="') && 
                               !html.includes('content=""');
    test('Metatag cloudinary-name foi injetada', hasCloudinaryMeta);
    
    const hasPosthogMeta = html.includes('meta name="posthog-key"');
    test('Metatag posthog-key existe', hasPosthogMeta);
    
    // Teste 3: Scripts necessários presentes
    console.log(`\n${colors.yellow}Testando presença de scripts...${colors.reset}`);
    test('config.js está carregado', html.includes('src="/config.js"'));
    test('validation.js está carregado', html.includes('src="/js/validation.js"'));
    test('api-client.js está carregado', html.includes('src="/js/api-client.js"'));
    test('ui-manager.js está carregado', html.includes('src="/js/ui-manager.js"'));
    test('script.js está carregado', html.includes('src="/script.js"'));
    
    // Teste 4: Nenhum secret hardcoded visível
    console.log(`\n${colors.yellow}Testando ausência de secrets hardcoded...${colors.reset}`);
    test('Nenhum "dbfrnidmb" hardcoded', !html.includes('dbfrnidmb'));
    test('Nenhum "phc_aFsJ" hardcoded', !html.includes('phc_aFsJ1AJ3CMKrVbNw5KojUWgRcksH1HVbsulfOoG3FEG'));
    
    // Teste 5: Headers de segurança
    console.log(`\n${colors.yellow}Testando headers de segurança...${colors.reset}`);
    test('Header X-Content-Type-Options presente', homeResponse.headers['x-content-type-options'] !== undefined);
    test('Header X-Frame-Options presente', homeResponse.headers['x-frame-options'] !== undefined);
    test('Header Strict-Transport-Security presente', homeResponse.headers['strict-transport-security'] !== undefined);
    
    // Teste 6: Endpoint de signature responde
    console.log(`\n${colors.yellow}Testando endpoints das functions...${colors.reset}`);
    try {
      const signatureResponse = await httpGet(`${SITE_URL}/.netlify/functions/generate-signature`);
      test('Endpoint generate-signature responde', signatureResponse.statusCode === 200 || signatureResponse.statusCode === 405);
    } catch (e) {
      test('Endpoint generate-signature responde', false);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}Erro durante validação:${colors.reset}`, error.message);
  }
  
  // Resumo
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}RESULTADO DA VALIDAÇÃO${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
  
  console.log(`Total: ${colors.yellow}${testsRun}${colors.reset}`);
  console.log(`Passou: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`Falhou: ${colors.red}${testsFailed}${colors.reset}\n`);
  
  if (testsFailed === 0) {
    console.log(`${colors.green}✅ SITE FUNCIONANDO CORRETAMENTE!${colors.reset}\n`);
    
    console.log(`${colors.yellow}Próximos passos:${colors.reset}`);
    console.log(`1. Testar upload de arquivo em: ${SITE_URL}`);
    console.log(`2. Verificar se QR Code é gerado`);
    console.log(`3. Testar se link curto funciona`);
    console.log(`4. Verificar analytics no PostHog\n`);
    
    console.log(`${colors.red}⚠️ LEMBRETE CRÍTICO:${colors.reset}`);
    console.log(`As credenciais foram expostas no chat!`);
    console.log(`Você DEVE regenerá-las NOVAMENTE e atualizar no Netlify.\n`);
    
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ ${testsFailed} teste(s) falharam!${colors.reset}`);
    console.log(`${colors.yellow}Verifique os erros acima e corrija.${colors.reset}\n`);
    process.exit(1);
  }
}

// Executar validação
console.log(`${colors.blue}Aguardando alguns segundos para o Netlify terminar o deploy...${colors.reset}`);
setTimeout(validate, 5000); // Aguarda 5 segundos antes de começar
