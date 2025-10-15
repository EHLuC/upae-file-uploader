// --- Seleção dos Elementos da Página (DOM) ---
// Eu guardo todos os elementos HTML que vou manipular em constantes para fácil acesso.
const fileInput = document.getElementById("fileInput"), 
      dropArea = document.getElementById("dropArea"), 
      preview = document.getElementById("preview"), 
      filePreview = document.getElementById("filePreview"), 
      fileNameDisplay = document.getElementById("fileName"), 
      qrCanvas = document.getElementById("qr"), 
      linkDisplay = document.getElementById("link"), 
      statusDisplay = document.getElementById("status"), // Versão estável que usa o statusDisplay
      loader = document.getElementById("loader"), 
      previewSection = document.getElementById("previewSection"), 
      qrSection = document.getElementById("qrSection"), 
      resultSection = document.getElementById("resultSection");

// --- Constantes de Configuração ---
const CLOUD_NAME = "dbfrnidmb";
const SIGNATURE_ENDPOINT = "/.netlify/functions/generate-signature";
const SHORTEN_ENDPOINT = "/.netlify/functions/shorten";

async function uploadFile(file) {
    // 1. Eu reseto a interface.
    loader.style.display = "block";
    statusDisplay.style.display = "none";
    previewSection.style.display = "none";
    qrSection.style.display = "none";
    resultSection.style.display = "none";
    preview.style.display = "none";
    filePreview.style.display = "none";

    try {
        // 2. Eu determino o tipo de recurso.
        let resourceType = 'raw';
        if (file.type.startsWith('image/')) resourceType = 'image';
        if (file.type.startsWith('video/')) resourceType = 'video';
        const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        // 3. Eu peço a assinatura.
        statusDisplay.style.color = '#A6ACCD';
        statusDisplay.textContent = "Obtendo permissão para upload...";
        statusDisplay.style.display = "block";
        const signatureResponse = await fetch(SIGNATURE_ENDPOINT);
        if (!signatureResponse.ok) throw new Error('Falha ao obter assinatura do servidor.');
        const signatureData = await signatureResponse.json();

        // 4. Eu monto o FormData.
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureData.api_key);
        formData.append("timestamp", signatureData.timestamp);
        formData.append("signature", signatureData.signature);
        formData.append("use_filename", "true");
        formData.append("unique_filename", "false");

        // 5. Eu envio o arquivo.
        statusDisplay.textContent = "Enviando arquivo...";
        const uploadResponse = await fetch(UPLOAD_URL, { method: "POST", body: formData });
        const uploadedData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadedData.error.message || 'Erro do Cloudinary.');

        // 6. Eu construo a URL longa.
        const { version, public_id, format } = uploadedData;
        let finalPublicId = public_id;
        if (format) finalPublicId += `.${format}`;
        const longUrl = `https://res.cloudinary.com/${CLOUD_NAME}/${uploadedData.resource_type}/upload/v${version}/${finalPublicId}`;

        // 7. Eu encurto o link.
        statusDisplay.textContent = "Criando link curto...";
        const shortenResponse = await fetch(SHORTEN_ENDPOINT, { method: 'POST', body: JSON.stringify({ longUrl: longUrl }) });
        if (!shortenResponse.ok) throw new Error('Falha ao criar o link curto.');
        const { slug } = await shortenResponse.json();
        const shortUrl = `${window.location.origin}/s/${slug}`;
        
        // --- INTEGRAÇÃO POSTHOG: SUCESSO ---
        if (window.posthog) {
            posthog.capture('upload_success', { file_name: file.name, file_size: file.size, file_type: file.type, short_url: shortUrl, long_url: longUrl });
        }

        // 8. Eu exibo os resultados.
        previewSection.style.display = "flex";
        if (resourceType === "image") {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        } else {
            fileNameDisplay.textContent = file.name;
            filePreview.style.display = "block";
        }
        
        linkDisplay.innerHTML = `<a href="${shortUrl}" target="_blank" rel="noopener noreferrer">${shortUrl}</a>`;
        resultSection.style.display = "block";
        
        new QRious({ element: qrCanvas, value: shortUrl, size: 200 });
        qrSection.style.display = "block";
        
        statusDisplay.style.color = '#4ade80';
        statusDisplay.textContent = "Upload realizado com sucesso!";
        statusDisplay.style.display = "block"; // Garante que a mensagem de sucesso seja exibida

    } catch (err) {
        // --- INTEGRAÇÃO POSTHOG: FALHA ---
        if (window.posthog) {
            posthog.capture('upload_failed', { file_name: file ? file.name : 'unknown', file_size: file ? file.size : 0, error_message: err.message });
        }
        
        statusDisplay.style.color = '#f87171';
        statusDisplay.textContent = "Erro: " + err.message;
        statusDisplay.style.display = "block";
    } finally {
        loader.style.display = "none";
    }
}

// --- Lógica de Manipulação de Arquivos e Eventos ---
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const handleFile = (file) => {
    if (!file) return;
    if (file.size > MAX_SIZE_BYTES) {
        statusDisplay.style.color = '#f87171';
        statusDisplay.textContent = `Erro: O arquivo é muito grande. O limite é de ${MAX_SIZE_MB} MB.`;
        statusDisplay.style.display = 'block';
        return;
    }
    uploadFile(file);
};

// Listeners de evento
fileInput.addEventListener("change", () => { if (fileInput.files.length > 0) handleFile(fileInput.files[0]); });
dropArea.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }));
['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.style.borderColor = '#4ade80'));
['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.style.borderColor = '#82AAFF'));
dropArea.addEventListener("drop", (e) => { if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });

document.body.addEventListener('paste', (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            handleFile(blob);
            e.preventDefault();
            return;
        }
    }
});

const copyButton = document.getElementById('copyButton');
if (copyButton) {
    copyButton.addEventListener('click', () => {
        const linkElement = document.getElementById('link').querySelector('a');
        if (linkElement && navigator.clipboard) {
            navigator.clipboard.writeText(linkElement.href).then(() => {
                if (window.posthog) {
                    posthog.capture('link_copied', { url_copied: linkElement.href });
                }
                copyButton.textContent = 'Copiado!';
                copyButton.style.backgroundColor = '#4ade80';
                setTimeout(() => {
                    copyButton.textContent = 'Copiar Link';
                    copyButton.style.backgroundColor = '#82AAFF';
                }, 2000);
            });
        }
    });
}

// Lógica para o rodapé
document.addEventListener('DOMContentLoaded', () => {
    const frasesPessoais = ["Feito com ❤️ por Lucas Cassiano.", "A 15ª tentativa é a que vale!", "Com ❤️, código e alguns loops por Lucas Cassiano."];
    const frasesDeTech = ["Trocando bits por sorrisos.", "Hospedado na nuvem, com os pés no chão.", "Cuidado: este site pode conter traços de código.", "Transformando café em código desde 2025.", "404: Sono não encontrado.", "Versão estável (por enquanto).", "Não é mágica, é tecnologia (mas às vezes parece)."];
    const frasesUpae = ["Dando um 'upa' nos seus arquivos.", "Upaê! Seu link chegou na velocidade de um clique.", "Salvando arquivos do limbo do seu desktop.", "Conectando meu PC e meu celular, um QR code de cada vez.", "Simples. Rápido. Compartilhado."];
    const frasesDivertidas = [...frasesPessoais, ...frasesDeTech, ...frasesUpae, ...frasesPessoais];
    const footerElement = document.getElementById('dynamic-footer');
    if (footerElement) {
        const indiceAleatorio = Math.floor(Math.random() * frasesDivertidas.length);
        footerElement.textContent = frasesDivertidas[indiceAleatorio];
    }
});