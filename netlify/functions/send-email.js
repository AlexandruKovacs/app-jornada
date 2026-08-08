// Netlify Function: reemplaza al server.js de Express.
// Se despliega junto al sitio y queda accesible en /.netlify/functions/send-email
// La API key de Resend se guarda como variable de entorno en Netlify (nunca en el navegador).

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

exports.handler = async (event) => {
  // CORS (útil si sirves index.html desde otro dominio; si vive en el mismo
  // sitio de Netlify no es estrictamente necesario, pero no estorba)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Método no permitido' };
  }

  try {
    const { to, filename, base64, year } = JSON.parse(event.body || '{}');

    if (!to || !filename || !base64) {
      return { statusCode: 400, headers, body: 'Faltan campos: to, filename o base64.' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Registro de jornada ${year || ''}`.trim(),
      html: `<p>Adjunto el registro de días presenciales, remotos y de oficina cerrada${year ? ` correspondiente a ${year}` : ''}.</p>`,
      attachments: [
        {
          filename,
          content: base64,
        },
      ],
    });

    if (error) {
      return { statusCode: 502, headers, body: error.message || 'Error al enviar con Resend.' };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, id: data?.id }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: err.message || 'Error interno.' };
  }
};
