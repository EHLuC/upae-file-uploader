/**
 * Módulo: Gerenciador de UI
 * Centraliza todas as operações de manipulação de DOM
 */

const DOM_ELEMENTS = {
  fileInput: '#fileInput',
  dropArea: '#dropArea',
  preview: '#preview',
  filePreview: '#filePreview',
  fileName: '#fileName',
  qrCanvas: '#qr',
  linkDisplay: '#link',
  statusDisplay: '#status',
  loader: '#loader',
  previewSection: '#previewSection',
  qrSection: '#qrSection',
  resultSection: '#resultSection',
  copyButton: '#copyButton'
};

// Cache de elementos para não fazer querySelector repetidamente
const cache = {};

/**
 * Obtém elemento cached
 * @param {string} selector - Seletor CSS
 * @returns {Element} Elemento do DOM
 */
const getElement = (selector) => {
  if (!cache[selector]) {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`Element not found: ${selector}`);
      return null;
    }
    cache[selector] = element;
  }
  return cache[selector];
};

/**
 * Mostra a secção de carregamento
 */
const showLoading = () => {
  const loader = getElement(DOM_ELEMENTS.loader);
  if (loader) loader.style.display = 'block';
  hideAllSections();
};

/**
 * Esconde a secção de carregamento
 */
const hideLoading = () => {
  const loader = getElement(DOM_ELEMENTS.loader);
  if (loader) loader.style.display = 'none';
};

/**
 * Mostra mensagem de status
 * @param {string} message - Mensagem
 * @param {string} status - 'loading' | 'success' | 'error'
 */
const showStatus = (message, status = 'loading') => {
  const statusDisplay = getElement(DOM_ELEMENTS.statusDisplay);
  if (!statusDisplay) return;

  const colorMap = {
    loading: '#A6ACCD',
    success: '#4ade80',
    error: '#f87171'
  };

  statusDisplay.style.color = colorMap[status] || colorMap.loading;
  statusDisplay.textContent = message;
  statusDisplay.style.display = 'block';
};

/**
 * Esconde todas as secções de resultado
 */
const hideAllSections = () => {
  [DOM_ELEMENTS.previewSection, DOM_ELEMENTS.qrSection, DOM_ELEMENTS.resultSection]
    .forEach(selector => {
      const el = getElement(selector);
      if (el) el.style.display = 'none';
    });
};

/**
 * Mostra preview de imagem
 * @param {File} file - Arquivo
 */
const showImagePreview = (file) => {
  const preview = getElement(DOM_ELEMENTS.preview);
  const filePreview = getElement(DOM_ELEMENTS.filePreview);
  const previewSection = getElement(DOM_ELEMENTS.previewSection);

  if (!preview || !filePreview || !previewSection) return;

  if (file.type.startsWith('image/')) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    filePreview.style.display = 'none';
  } else {
    const fileNameDisplay = getElement(DOM_ELEMENTS.fileName);
    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    filePreview.style.display = 'block';
    preview.style.display = 'none';
  }

  previewSection.style.display = 'flex';
};

/**
 * Mostra QR Code
 * @param {string} url - URL para gerar QR Code
 */
const showQRCode = (url) => {
  const qrCanvas = getElement(DOM_ELEMENTS.qrCanvas);
  const qrSection = getElement(DOM_ELEMENTS.qrSection);

  if (!qrCanvas || !qrSection) return;

  // Usar biblioteca QRious (já carregada no HTML)
  if (window.QRious) {
    new QRious({
      element: qrCanvas,
      value: url,
      size: 200
    });
  }

  qrSection.style.display = 'block';
};

/**
 * Mostra link de resultados
 * @param {string} shortUrl - URL curta gerada
 */
const showResult = (shortUrl) => {
  const linkDisplay = getElement(DOM_ELEMENTS.linkDisplay);
  const resultSection = getElement(DOM_ELEMENTS.resultSection);

  if (!linkDisplay || !resultSection) return;

  linkDisplay.innerHTML = `<a href="${shortUrl}" target="_blank" rel="noopener noreferrer">${shortUrl}</a>`;
  resultSection.style.display = 'block';
};

/**
 * Configura listeners de drag & drop
 * @param {Function} onFileSelect - Callback quando arquivo é selecionado
 */
const setupDragAndDrop = (onFileSelect) => {
  const dropArea = getElement(DOM_ELEMENTS.dropArea);
  const fileInput = getElement(DOM_ELEMENTS.fileInput);

  if (!dropArea || !fileInput) return;

  // Abrir seletor de arquivo
  dropArea.addEventListener('click', () => fileInput.click());

  // Prevenir comportamento padrão
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Visual feedback
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.style.borderColor = '#4ade80';
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
      dropArea.style.borderColor = '#82AAFF';
    });
  });

  // Handle drop
  dropArea.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  });

  // Handle input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      onFileSelect(fileInput.files[0]);
    }
  });
};

/**
 * Configura botão de copiar
 */
const setupCopyButton = () => {
  const copyButton = getElement(DOM_ELEMENTS.copyButton);
  if (!copyButton) return;

  copyButton.addEventListener('click', async () => {
    const linkElement = getElement(DOM_ELEMENTS.linkDisplay)?.querySelector('a');
    if (!linkElement) return;

    try {
      await navigator.clipboard.writeText(linkElement.href);

      // Feedback visual
      const originalText = copyButton.textContent;
      copyButton.textContent = 'Copiado!';
      copyButton.style.backgroundColor = '#4ade80';

      // Rastrear no PostHog se disponível
      if (window.posthog) {
        posthog.capture('link_copied', { url_copied: linkElement.href });
      }

      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.backgroundColor = '#82AAFF';
      }, 2000);

    } catch (error) {
      showStatus('Erro ao copiar: ' + error.message, 'error');
    }
  });
};

/**
 * Configura paste de imagem
 * @param {Function} onFileSelect - Callback quando arquivo é selecionado
 */
const setupPaste = (onFileSelect) => {
  document.addEventListener('paste', (e) => {
    const items = (e.clipboardData || window.clipboardData).items;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        onFileSelect(blob);
        e.preventDefault();
        return;
      }
    }
  });
};

// Exportar para uso global
window.UIManager = {
  getElement,
  showLoading,
  hideLoading,
  showStatus,
  hideAllSections,
  showImagePreview,
  showQRCode,
  showResult,
  setupDragAndDrop,
  setupCopyButton,
  setupPaste
};
