/**
 * Test Suite - Validação de Segurança e Funcionalidade
 * Executa testes da camada de segurança (backend)
 */

// Importar módulo de segurança
const security = require('./netlify/functions/lib/security');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Testa uma asserção
 */
const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
  }
};

/**
 * Agrupa testes por categoria
 */
const describe = (category, tests) => {
  console.log(`\n${colors.blue}${category}${colors.reset}`);
  tests();
};

// ============ TESTES DE VALIDAÇÃO ============

describe('Validação de Input', () => {
  // Teste 1: Input válido
  assert(
    security.validateInput('valid-slug-123', { maxLength: 50 }),
    'Aceita slug válido'
  );

  // Teste 2: Input muito longo
  assert(
    !security.validateInput('a'.repeat(501), { maxLength: 500 }),
    'Rejeita input muito longo'
  );

  // Teste 3: Input vazio
  assert(
    !security.validateInput('', { allowEmpty: false }),
    'Rejeita input vazio quando não permitido'
  );

  // Teste 4: Input vazio permitido
  assert(
    security.validateInput('', { allowEmpty: true }),
    'Aceita input vazio quando permitido'
  );

  // Teste 5: Input com caracteres inválidos
  assert(
    !security.validateInput('invalid<script>', { pattern: /^[\w\-]+$/ }),
    'Rejeita caracteres perigosos'
  );
});

// ============ TESTES DE SANITIZAÇÃO ============

describe('Sanitização de String', () => {
  // Teste 1: Remove tags XSS
  const sanitized1 = security.sanitizeString('<script>alert("xss")</script>');
  assert(
    !sanitized1.includes('<') && !sanitized1.includes('>'),
    'Remove tags < e >'
  );

  // Teste 2: Remove quoted
  const sanitized2 = security.sanitizeString('test"string\'with`quotes');
  assert(
    !sanitized2.includes('"') && !sanitized2.includes("'") && !sanitized2.includes('`'),
    'Remove tags de quote'
  );

  // Teste 3: Trim de espaços
  const sanitized3 = security.sanitizeString('  hello  ');
  assert(
    sanitized3 === 'hello',
    'Remove espaços em branco'
  );

  // Teste 4: Limite de comprimento
  const sanitized4 = security.sanitizeString('a'.repeat(200));
    assert(
    sanitized4.length === 100,
    'Limita string em 100 caracteres'
  );
});

// ============ TESTES DE VALIDAÇÃO DE SLUG ============

describe('Validação de Slug', () => {
  // Teste 1: Slug válido
  assert(
    security.validateSlug('coxinha-feliz'),
    'Aceita slug válido com hífen'
  );

  // Teste 2: Slug muito longo
  assert(
    !security.validateSlug('a'.repeat(51)),
    'Rejeita slug com mais de 50 caracteres'
  );

  // Teste 3: Slug vazio
  assert(
    !security.validateSlug(''),
    'Rejeita slug vazio'
  );

  // Teste 4: Slug com caracteres inválidos
  assert(
    !security.validateSlug('invalid_slug'),
    'Rejeita underscore'
  );

  // Teste 5: Slug com números
  assert(
    security.validateSlug('slug-123'),
    'Aceita números'
  );
});

// ============ TESTES DE VALIDAÇÃO DE URL ============

describe('Validação de URL', () => {
  // Teste 1: URL válida HTTPS
  assert(
    security.validateUrl('https://res.cloudinary.com/test/image.jpg'),
    'Aceita URL HTTPS válida do Cloudinary'
  );

  // Teste 2: URL HTTP (insegura)
  assert(
    !security.validateUrl('http://res.cloudinary.com/test/image.jpg'),
    'Rejeita URL HTTP'
  );

  // Teste 3: URL de domínio não permitido
  assert(
    !security.validateUrl('https://exemplo.com/arquivo'),
    'Rejeita domínio não autorizado'
  );

  // Teste 4: String inválida como URL
  assert(
    !security.validateUrl('not a url'),
    'Rejeita string inválida'
  );

  // Teste 5: URL com Supabase (não autorizado)
  assert(
    !security.validateUrl('https://supabase.com/api'),
    'Rejeita URLs de terceiros não autorizadas'
  );
});

// ============ TESTES DE RATE LIMITING ============

describe('Rate Limiting', () => {
  // Reset para teste
  for (let i = 0; i < 35; i++) {
    security.checkRateLimit('test-ip-1');
  }

  // Teste 1: Rate limit ativado após limite
  const limitExceeded = !security.checkRateLimit('test-ip-1');
  assert(
    limitExceeded,
    'Bloqueia requisições após limiar'
  );

  // Teste 2: IP diferente não é afetado
  assert(
    security.checkRateLimit('test-ip-2'),
    'Limita por IP (não afeta outros IPs)'
  );
});

// ============ TESTES DE CORS HEADERS ============

describe('CORS Headers', () => {
  const headers = security.getCorsHeaders();

  // Teste 1: Headers básicos presentes
  assert(
    headers['Access-Control-Allow-Origin'] !== undefined,
    'CORS origin header presente'
  );

  // Teste 2: Headers de método presentes
  assert(
    headers['Access-Control-Allow-Methods'] !== undefined,
    'CORS methods header presente'
  );

  // Teste 3: Content-Type configurado
  assert(
    headers['Content-Type'] === 'application/json',
    'Content-Type é JSON'
  );

  // Teste 4: Origin é HTTPS
  assert(
    headers['Access-Control-Allow-Origin'].includes('https'),
    'Origin configurado como HTTPS'
  );
});

// ============ TESTES DE ERROR HANDLING ============

describe('Error Handling', () => {
  // Teste 1: Error response com status correto
  const error = new Error('Test error');
  const response = security.handleError(error, 400);
  assert(
    response.statusCode === 400,
    'Retorna status code correto'
  );

  // Teste 2: Response tem estrutura correta
  assert(
    response.headers && response.body,
    'Response tem headers e body'
  );

  // Teste 3: Body é JSON válido
  try {
    const parsed = JSON.parse(response.body);
    assert(
      parsed.error !== undefined,
      'Body possui campo error'
    );
  } catch {
    assert(false, 'Body não é JSON válido');
  }
});

// ============ RESUMO ============

console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.blue}Resultado dos Testes${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);

console.log(`Total: ${colors.yellow}${totalTests}${colors.reset}`);
console.log(`Passou: ${colors.green}${passedTests}${colors.reset}`);
console.log(`Falhou: ${colors.red}${failedTests}${colors.reset}\n`);

if (failedTests === 0) {
  console.log(`${colors.green}✅ Todos os testes passaram!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}❌ ${failedTests} teste(s) falharam!${colors.reset}\n`);
  process.exit(1);
}
