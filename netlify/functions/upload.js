const FormData = require('form-data');
const fetch = require('node-fetch');

// Lista de serviços de upload que tentaremos em ordem
const UPLOAD_SERVICES = [
  {
    name: 'freeimage.host',
    url: 'https://freeimage.host/api/1/upload',
    buildForm: (imageBuffer, apiKey) => {
      const form = new FormData();
      form.append('key', apiKey);
      form.append('action', 'upload');
      form.append('source', imageBuffer, { filename: 'upload.png' });
      form.append('format', 'json');
      return form;
    },
    parseResponse: async (response) => {
      const data = await response.json();
      if (!data.image || !data.image.url) throw new Error('Resposta inesperada do freeimage.host');
      return data.image.url;
    }
  },
  {
    name: '0x0.st',
    url: 'https://0x0.st',
    buildForm: (imageBuffer) => {
      const form = new FormData();
      form.append('file', imageBuffer, { filename: 'upload.png' });
      return form;
    },
    parseResponse: async (response) => response.text()
  }
];

// Chave de API para o freeimage.host, se necessário
const FREEIMAGE_API_KEY = "6d207e02198a847aa98d0a2a901485a5";

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { image } = JSON.parse(event.body);
  const imageBuffer = Buffer.from(image, 'base64');

  for (const service of UPLOAD_SERVICES) {
    try {
      console.log(`Tentando upload com: ${service.name}`);
      const form = service.buildForm(imageBuffer, FREEIMAGE_API_KEY);
      const response = await fetch(service.url, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Falha no serviço ${service.name}. Status: ${response.status}`);
      }
      
      const imageUrl = await service.parseResponse(response);
      console.log(`Sucesso com ${service.name}: ${imageUrl}`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ image: { url: imageUrl.trim() } }),
      };

    } catch (error) {
      console.error(`Erro ao usar ${service.name}:`, error.message);
    }
  }

  console.error("Todos os serviços de upload falharam.");
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Todos os serviços de upload estão indisponíveis. Tente novamente mais tarde.' }),
  };
};