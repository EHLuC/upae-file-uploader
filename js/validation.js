/**
 * Validação de Arquivo no Frontend
 * 
 * Aqui eu coloco a primeira camada de validação. Antes de enviar o arquivo
 * para o servidor, eu checo se tudo está de acordo com as regras.
 * Isso é para dar feedback rápido ao usuário sem esperar o servidor responder.
 * 
 * ⚠️ IMPORTANTE: Esta validação NÃO substitui a validação no servidor!
 * O servidor também valida tudo porque o cliente pode ser contornado.
 */

const VALIDATION_CONFIG = {
  // Meu limite é 10 MB. Se o arquivo for maior, não deixo fazer upload
  maxFileSize: 10 * 1024 * 1024,
  
  // Estes são os tipos de arquivo que eu aceito. Outros tipos são bloqueados
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'text/plain', 'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'video/mp4', 'video/webm'
  ],
  
  // Nomes de arquivo muito longos podem causar problemas em alguns sistemas
  fileNameMaxLength: 255,
  
  // O nome deve ter apenas caracteres seguros, sem caracteres especiais perigosos
  fileNamePattern: /^[\w\s\-\.()]+$/
};

/**
 * Eu valido se um arquivo pode ser feito upload.
 * Retorno um objeto dizendo se está válido ou qual é o erro.
 */
const validateFile = (file) => {
  // Primeira coisa: o arquivo existe mesmo?
  if (!file) {
    return { isValid: false, error: 'Nenhum arquivo foi selecionado' };
  }

  // Segundo: o tipo de arquivo é permitido?
  if (!VALIDATION_CONFIG.allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Arquivo do tipo "${file.type}" não é permitido`
    };
  }

  // Terceiro: o arquivo não é muito grande demais?
  if (file.size > VALIDATION_CONFIG.maxFileSize) {
    const maxSizeMB = VALIDATION_CONFIG.maxFileSize / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `Arquivo muito grande. Máximo é ${maxSizeMB} MB, seu arquivo tem ${fileSizeMB} MB`
    };
  }

  // Quarto: o nome do arquivo é válido?
  if (!VALIDATION_CONFIG.fileNamePattern.test(file.name)) {
    return {
      isValid: false,
      error: 'Nome do arquivo contém caracteres não permitidos'
    };
  }

  // Quinto: o nome não é muito longo?
  if (file.name.length > VALIDATION_CONFIG.fileNameMaxLength) {
    return {
      isValid: false,
      error: `Nome muito longo. Máximo é ${VALIDATION_CONFIG.fileNameMaxLength} caracteres`
    };
  }

  // Se chegou aqui, tudo está OK!
  return { isValid: true };
};

/**
 * Aqui eu checo se a URL é segura. Uma URL segura deve ser HTTPS
 * e não pode ter caracteres malformados.
 */
const isSafeUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Eu só aceito HTTPS porque HTTP é inseguro (dados podem ser interceptados)
    return parsed.protocol === 'https:';
  } catch {
    // Se a URL não pode nem ser parseada, ela não é válida
    return false;
  }
};

/**
 * Função auxiliar que garante que qualquer erro vira string legível.
 * Isso evita o maldito [object Object] que aparece quando tento fazer throw de objeto.
 */
const serializeError = (error) => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && error.error) return String(error.error);
  if (error && error.message) return String(error.message);
  try {
    return JSON.stringify(error);
  } catch {
    return String(error) || 'Erro desconhecido';
  }
};

/**
 * Quando eu recebo uma resposta do servidor em JSON, eu preciso validar
 * se ela é realmente JSON válido e se o status HTTP foi de sucesso.
 */
const validateJsonResponse = async (response, context) => {
  if (!response.ok) {
    let errorMsg = `Erro ${response.status}`;
    try {
      const errorData = await response.json();
      errorMsg = serializeError(errorData.error || errorData.message || errorData);
    } catch {
      try {
        const textError = await response.text();
        if (textError) errorMsg = textError;
      } catch {}
    }
    throw new Error(errorMsg);
  }

  return await response.json();
};

// Eu exponho essas funções como um objeto global para todo o resto da app usar
window.FileValidator = {
  validate: validateFile,
  isSafeUrl,
  validateJsonResponse,
  serializeError,
  config: VALIDATION_CONFIG
};
