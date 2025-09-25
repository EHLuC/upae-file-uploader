// --- Seleção dos Elementos da Página (DOM) ---
// Guardamos todos os elementos HTML que vamos manipular em constantes para fácil acesso.
const fileInput = document.getElementById("fileInput"), 
      dropArea = document.getElementById("dropArea"), 
      preview = document.getElementById("preview"), 
      filePreview = document.getElementById("filePreview"), 
      fileNameDisplay = document.getElementById("fileName"), 
      qrCanvas = document.getElementById("qr"), 
      linkDisplay = document.getElementById("link"), 
      statusDisplay = document.getElementById("status"), 
      loader = document.getElementById("loader"), 
      previewSection = document.getElementById("previewSection"), 
      qrSection = document.getElementById("qrSection"), 
      resultSection = document.getElementById("resultSection");

// --- Constantes de Configuração ---
const CLOUD_NAME = "dbfrnidmb"; // Seu nome de nuvem do Cloudinary
const SIGNATURE_ENDPOINT = "/.netlify/functions/generate-signature"; // Endereço da nossa função de assinatura
const SHORTEN_ENDPOINT = "/.netlify/functions/shorten"; // Endereço da nossa função de encurtar link

/**
 * Função principal que orquestra todo o processo de upload.
 * @param {File} file - O arquivo que o usuário selecionou.
 */
async function uploadFile(file) {
    // 1. Reseta a interface, mostrando o loader e escondendo resultados antigos.
    loader.style.display = "block";
    statusDisplay.style.display = "none";
    previewSection.style.display = "none";
    qrSection.style.display = "none";
    resultSection.style.display = "none";
    preview.style.display = "none";
    filePreview.style.display = "none";

    try {
        // 2. Determina o tipo de recurso para sermos explícitos com o Cloudinary.
        let resourceType = 'raw'; // Padrão para PDF, ZIP, etc.
        if (file.type.startsWith('image/')) resourceType = 'image';
        if (file.type.startsWith('video/')) resourceType = 'video';
        const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        // 3. Pede a "permissão" (assinatura) para nossa função Netlify.
        statusDisplay.style.color = '#A6ACCD';
        statusDisplay.textContent = "Obtendo permissão para upload...";
        statusDisplay.style.display = "block";
        const signatureResponse = await fetch(SIGNATURE_ENDPOINT);
        if (!signatureResponse.ok) throw new Error('Falha ao obter assinatura do servidor.');
        const signatureData = await signatureResponse.json();

        // 4. Monta o "pacote" de dados (FormData) para enviar ao Cloudinary.
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureData.api_key);
        formData.append("timestamp", signatureData.timestamp);
        formData.append("signature", signatureData.signature);
        formData.append("use_filename", "true"); // Pede para usar o nome original do arquivo
        formData.append("unique_filename", "false"); // Evita adicionar caracteres aleatórios ao nome

        // 5. Envia o arquivo diretamente para o Cloudinary.
        statusDisplay.textContent = "Enviando arquivo...";
        const uploadResponse = await fetch(UPLOAD_URL, { method: "POST", body: formData });
        const uploadedData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadedData.error.message || 'Erro do Cloudinary.');

        // 6. Constrói a URL longa do Cloudinary de forma manual e segura.
        const { version, public_id, format } = uploadedData;
        let finalPublicId = public_id;
        if (format) finalPublicId += `.${format}`; // Adiciona a extensão apenas se ela existir na resposta
        const longUrl = `https://res.cloudinary.com/${CLOUD_NAME}/${uploadedData.resource_type}/upload/v${version}/${finalPublicId}`;

        // 7. Pede para nossa outra função Netlify encurtar o link longo.
        statusDisplay.textContent = "Criando link curto...";
        const shortenResponse = await fetch(SHORTEN_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify({ longUrl: longUrl })
        });
        if (!shortenResponse.ok) throw new Error('Falha ao criar o link curto.');
        const { slug } = await shortenResponse.json();
        const shortUrl = `${window.location.origin}/s/${slug}`;

        // 8. Exibe todos os resultados na tela.
        previewSection.style.display = "flex";
        if (resourceType === "image") {
            preview.src = URL.createObjectURL(file); // Cria um preview local para a imagem
            preview.style.display = "block";
        } else {
            fileNameDisplay.textContent = file.name;
            filePreview.style.display = "block";
        }
        
        linkDisplay.innerHTML = `<a href="${shortUrl}" target="_blank" rel="noopener noreferrer">${shortUrl}</a>`;
        resultSection.style.display = "block";
        
        new QRious({ element: qrCanvas, value: shortUrl, size: 200 }); // Gera o QR Code com o link curto
        qrSection.style.display = "block";
        
        statusDisplay.style.color = '#4ade80';
        statusDisplay.textContent = "Upload realizado com sucesso!";

    } catch (err) {
        // Se qualquer passo acima falhar, mostra uma mensagem de erro.
        statusDisplay.style.color = '#f87171';
        statusDisplay.textContent = "Erro: " + err.message;
        statusDisplay.style.display = "block";
    } finally {
        // Independentemente de sucesso ou falha, esconde o loader no final.
        loader.style.display = "none";
    }
}

// --- Lógica de Manipulação de Arquivos e Eventos ---

// Limite de tamanho de arquivo em Megabytes
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Função "porteiro" que verifica o tamanho do arquivo antes de iniciar o upload.
 * @param {File} file - O arquivo a ser verificado.
 */
const handleFile = (file) => {
    if (!file) return;

    // Verifica se o tamanho do arquivo excede o limite
    if (file.size > MAX_SIZE_BYTES) {
        statusDisplay.style.color = '#f87171';
        statusDisplay.textContent = `Erro: O arquivo é muito grande. O limite é de ${MAX_SIZE_MB} MB.`;
        statusDisplay.style.display = 'block';
        return; // Para a execução aqui
    }
    
    // Se o tamanho estiver OK, prossegue com o upload.
    uploadFile(file);
};

// Evento: quando um arquivo é selecionado pelo botão
fileInput.addEventListener("change", () => { if (fileInput.files.length > 0) handleFile(fileInput.files[0]); });

// Evento: quando a área de upload é clicada, ativa o botão escondido
dropArea.addEventListener('click', () => fileInput.click());

// Eventos para o efeito visual de arrastar e soltar (drag and drop)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }));
['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.style.borderColor = '#4ade80'));
['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.style.borderColor = '#82AAFF'));
dropArea.addEventListener("drop", (e) => { if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });

// Evento: quando uma imagem é colada na página (Ctrl+V)
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

// Lógica para o botão de "Copiar Link"
const copyButton = document.getElementById('copyButton');
if (copyButton) {
    copyButton.addEventListener('click', () => {
        const linkElement = document.getElementById('link').querySelector('a');
        if (linkElement && navigator.clipboard) {
            navigator.clipboard.writeText(linkElement.href).then(() => {
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


// BLOCO DE CÓDIGO PARA O RODAPÉ DINÂMICO
document.addEventListener('DOMContentLoaded', () => {
    // Categoria 1: Frases que contam a história do projeto e do criador.
    const frasesPessoais = [
        "Feito com ❤️ por Lucas Cassiano.",
        "A 15ª tentativa é a que vale!",
        "Com ❤️, código e alguns loops por Lucas Cassiano.",
    ];

    // Categoria 2: Frases divertidas e referências para quem é de tecnologia.
    const frasesDeTech = [
        "Trocando bits por sorrisos.",
        "Hospedado na nuvem, com os pés no chão.",
        "Cuidado: este site pode conter traços de código.",
        "Transformando café em código desde 2025.",
        "404: Sono não encontrado.",
        "Versão estável (por enquanto).",
        "Não é mágica, é tecnologia (mas às vezes parece)."
    ];

    // Categoria 3: Frases que reforçam a marca e a utilidade do "Upaê".
    const frasesUpae = [
        "Dando um 'upa' nos seus arquivos.",
        "Upaê! Seu link chegou na velocidade de um clique.",
        "Salvando arquivos do limbo do seu desktop.",
        "Conectando seu PC e seu celular, um QR code de cada vez.",
        "Simples. Rápido. Compartilhado."
    ];

    // Junta todas as frases em uma única lista para o sorteio.
    // Adicionamos as frases pessoais duas vezes para que elas tenham mais chance de aparecer!
    const frasesDivertidas = [
        ...frasesPessoais, 
        ...frasesDeTech, 
        ...frasesUpae, 
        ...frasesPessoais // Adicionadas novamente para aumentar a frequência
    ];

    // O resto da lógica continua a mesma
    const footerElement = document.getElementById('dynamic-footer');
    if (footerElement) {
        const indiceAleatorio = Math.floor(Math.random() * frasesDivertidas.length);
        footerElement.textContent = frasesDivertidas[indiceAleatorio];
    }
});

// TODO: Adicionar um alerta mais bonito em vez do 'statusDisplay' padrão.

// TODO: Investigar o add-on de antivírus do Cloudinary para mais segurança.

// TODO: Permitir o upload de múltiplos arquivos de uma vez.