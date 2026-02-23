exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      posthogKey: process.env.POSTHOG_KEY || ''
    })
  };
};
