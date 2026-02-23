/**
 * Script Principal - Controlador de Upload
 * Refatorado com separação de responsabilidades e segurança
 * 
 * Dependências:
 * - js/validation.js (FileValidator)
 * - js/api-client.js (ApiClient)
 * - js/ui-manager.js (UIManager)
 */

/**
 * Principais mudanças na arquitetura:
 * 1. Separação clara entre validação, API e UI
 * 2. Tratamento de erro centralizado
 * 3. Retry automático com backoff exponencial
 * 4. Timeouts em requisições
 * 5. Logs estruturados para debugging
 * 6. Sem hardcoding de valores sensíveis
 */

/**
 * Função principal de upload
 * Orquestra todo o fluxo: validação -> assinatura -> upload -> encurtador
 * Complexidade: O(1) operações sequenciais
 */
const handleUpload = async (file) => {
  try {
    // --- VALIDAÇÃO ---
    const validation = FileValidator.validate(file);
    if (!validation.isValid) {
      UIManager.showStatus('Erro: ' + validation.error, 'error');
      return;
    }

    // Agora eu preciso saber qual é o tipo de recurso para fazer o upload certo.
    // Se for imagem, vou pedir ao Cloudinary para otimizar como imagem.
    // Se for vídeo, ele vai processar como vídeo. Se for outro arquivo qualquer,
    // eu coloco como "raw".
    let resourceType = 'auto'; // Deixo o Cloudinary decidir automaticamente
    
    // Aqui leio o nome da minha cloud do Cloudinary. Eu coloco isso em uma metatag
    // no HTML para que o navegador possa acessar, sem expor no repositório público
    const cloudName = window.__CLOUD_NAME__ || 'default-cloud';
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    // Faço uma requisição para o servidor pedir a assinatura. Preciso disso porque
    // não posso colocar minhas credenciais do Cloudinary no frontend
    UIManager.showStatus('Obtendo permissão para upload...', 'loading');
    let signatureData;
    try {
      signatureData = await ApiClient.getUploadSignature();
    } catch (error) {
      throw new Error(`Falha ao obter assinatura: ${error.message}`);
    }

    // --- VALIDAR RESPOSTA DA ASSINATURA ---
    if (!signatureData.signature || !signatureData.api_key || !signatureData.timestamp) {
      throw new Error('Dados de assinatura incompletos');
    }

    // --- FAZER UPLOAD ---
    UIManager.showStatus('Enviando arquivo...', 'loading');
    let cloudinaryResponse;
    try {
      cloudinaryResponse = await ApiClient.uploadToCloudinary(file, signatureData);
    } catch (error) {
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }

    // --- VALIDAR RESPOSTA DO CLOUDINARY ---
    const { public_id, format, version, resource_type } = cloudinaryResponse;
    if (!public_id) {
      throw new Error('Cloudinary retornou dados inválidos');
    }

    // --- CONSTRUIR URL LONGA ---
    // Eu reuso a variável cloudName que já declarei lá em cima (linha 43)
    // para construir a URL final do arquivo no Cloudinary
    const formatSuffix = format ? `.${format}` : '';
    const longUrl = `https://res.cloudinary.com/${cloudName}/${resource_type}/upload/v${version}/${public_id}${formatSuffix}`;

    // Valido se a URL foi construída correctamente e é segura
    if (!FileValidator.isSafeUrl(longUrl)) {
      throw new Error('URL gerada não é segura');
    }

    // --- ENCURTAR LINK ---
    UIManager.showStatus('Criando link curto...', 'loading');
    let slug;
    try {
      slug = await ApiClient.shortenUrl(longUrl);
    } catch (error) {
      throw new Error(`Falha ao encurtar link: ${error.message}`);
    }

    // Validar slug
    if (!slug || typeof slug !== 'string' || slug.length < 3) {
      throw new Error('Slug gerado é inválido');
    }

    const shortUrl = `${window.location.origin}/s/${slug}`;

    // --- REGISTRO DE SUCESSO ---
    if (window.posthog) {
      posthog.capture('upload_success', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        short_url: shortUrl,
        long_url: longUrl
      });
    }

    // --- EXIBIR RESULTADOS ---
    UIManager.showImagePreview(file);
    UIManager.showQRCode(shortUrl);
    UIManager.showResult(shortUrl);
    UIManager.showStatus('Upload realizado com sucesso!', 'success');

  } catch (error) {
    // --- TRATAMENTO DE ERRO ---
    const errorMessage = error.message || 'Erro desconhecido';

    // Registrar erro
    if (window.posthog) {
      posthog.capture('upload_failed', {
        file_name: file?.name || 'unknown',
        file_size: file?.size || 0,
        error_message: errorMessage
      });
    }

    UIManager.showStatus(`Erro: ${errorMessage}`, 'error');
    console.error('Upload failed:', error);

  } finally {
    UIManager.hideLoading();
  }
};

/**
 * Função para gerar frase aleatória no rodapé
 */
const loadRandomFooter = () => {
  const frasesPessoais = [
    "Feito com ❤️ por Lucas Cassiano.",
    "A 15ª tentativa é a que vale!",
    "Com ❤️, código e alguns loops por Lucas Cassiano."
  ];

  const frasesDeTech = [
    "Trocando bits por sorrisos.",
    "Hospedado na nuvem, com os pés no chão.",
    "Cuidado: este site pode conter traços de código.",
    "Transformando café em código desde 2025.",
    "404: Sono não encontrado.",
    "Versão estável (por enquanto).",
    "Não é mágica, é tecnologia (mas às vezes parece)."
  ];

  const frasesUpae = [
    "Dando um 'upa' nos seus arquivos.",
    "Upaê! Seu link chegou na velocidade de um clique.",
    "Salvando arquivos do limbo do seu desktop.",
    "Conectando meu PC e meu celular, um QR code de cada vez.",
    "Simples. Rápido. Compartilhado."
  ];

  const todasAsFrases = [...frasesPessoais, ...frasesDeTech, ...frasesUpae];
  const fraseAleatoria = todasAsFrases[Math.floor(Math.random() * todasAsFrases.length)];

  const footerElement = document.getElementById('dynamic-footer');
  if (footerElement) {
    footerElement.textContent = fraseAleatoria;
  }
};

/**
 * Inicialização quando DOM está pronto
 */
document.addEventListener('DOMContentLoaded', () => {
  // Carregar frase do rodapé
  loadRandomFooter();

  // Configurar handlers de arquivo
  UIManager.setupDragAndDrop(handleUpload);
  UIManager.setupCopyButton();
  UIManager.setupPaste(handleUpload);

  console.log('✅ Upload interface initialized');
});