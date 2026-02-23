exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cloudinary_cloud_name_exists: !!process.env.CLOUDINARY_CLOUD_NAME,
      cloudinary_cloud_name_length: process.env.CLOUDINARY_CLOUD_NAME?.length || 0,
      cloudinary_cloud_name_first3: process.env.CLOUDINARY_CLOUD_NAME?.substring(0, 3) || 'vazio',
      posthog_exists: !!process.env.POSTHOG_KEY,
      all_env_keys: Object.keys(process.env).filter(k => k.includes('CLOUD') || k.includes('POSTHOG'))
    })
  };
};
