const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

exports.handler = async (event) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  try {
    // A assinatura agora também incluirá as novas regras
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        use_filename: true,         // <-- ADICIONADO: Diz para usar o nome do arquivo original
        unique_filename: false,     // <-- ADICIONADO: Impede o Cloudinary de adicionar caracteres aleatórios
      },
      cloudinary.config().api_secret
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        signature: signature,
        timestamp: timestamp,
        api_key: cloudinary.config().api_key,
      }),
    };
  } catch (error) {
    console.error('Erro ao gerar a assinatura:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao gerar a assinatura de upload.' }),
    };
  }
};