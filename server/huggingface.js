/**
 * Hugging Face Inference API — copy and image generation for Asset Studio.
 */
const HF_API = 'https://api-inference.huggingface.co/models';

export function isHuggingFaceConfigured() {
  return Boolean(process.env.HUGGINGFACE_API_TOKEN || process.env.HF_API_TOKEN);
}

function getToken() {
  return process.env.HUGGINGFACE_API_TOKEN || process.env.HF_API_TOKEN || '';
}

export async function generateSocialCopy({ topic, platform, tone = 'professional' }) {
  const token = getToken();
  if (!token) {
    throw new Error('HUGGINGFACE_API_TOKEN no configurado');
  }

  const model =
    process.env.HF_COPY_MODEL || 'HuggingFaceH4/zephyr-7b-beta';

  const prompt = `<|system|>Eres un copywriter experto en marketing digital. Escribe en español.<|endoftext|>
<|user|>Escribe un post para ${platform} sobre: "${topic}".
Tono: ${tone}. Incluye 3-5 hashtags relevantes. Máximo 280 caracteres para Twitter, 2200 para Instagram.
Solo el texto del post, sin explicaciones.<|endoftext|>
<|assistant|>`;

  const res = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 256, return_full_text: false },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data.error || data.estimated_time
      ? `Modelo cargando, reintenta en ${Math.ceil(data.estimated_time || 20)}s`
      : 'Error en Hugging Face';
    throw new Error(typeof data.error === 'string' ? data.error : errMsg);
  }

  let text = '';
  if (Array.isArray(data) && data[0]?.generated_text) {
    text = data[0].generated_text.trim();
  } else if (data.generated_text) {
    text = data.generated_text.trim();
  } else if (typeof data === 'string') {
    text = data.trim();
  }

  if (!text) {
    throw new Error('No se generó texto — prueba otro modelo en HF_COPY_MODEL');
  }

  return text.slice(0, 2200);
}

export async function generateImage({ prompt, ratio = '1:1' }) {
  const token = getToken();
  if (!token) {
    throw new Error('HUGGINGFACE_API_TOKEN no configurado');
  }

  const model = process.env.HF_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';

  const sizeMap = {
    '1:1': { width: 1024, height: 1024 },
    '9:16': { width: 768, height: 1344 },
    '16:9': { width: 1344, height: 768 },
  };
  const size = sizeMap[ratio] || sizeMap['1:1'];

  const res = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'image/png',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { width: size.width, height: size.height },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error generando imagen con Hugging Face');
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    buffer,
    mimeType: 'image/png',
    originalname: `hf-${Date.now()}.png`,
  };
}
