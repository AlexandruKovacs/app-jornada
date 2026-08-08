// Netlify Function: envía el email con el Excel adjunto usando Gmail (Nodemailer),
// sin depender de Resend ni de verificar ningún dominio.
// El correo sale literalmente desde tu propia cuenta de Gmail.

const nodemailer = require('nodemailer');

exports.handler = async (event) => {
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

  if (!event.body) {
    return { statusCode: 400, headers, body: 'Falta el cuerpo de la petición' };
  }

  let to, filename, base64, year;
  try {
    const bodyString = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    ({ to, filename, base64, year } = JSON.parse(bodyString));
  } catch (err) {
    return { statusCode: 400, headers, body: 'JSON inválido' };
  }

  if (!to || !filename || !base64) {
    return { statusCode: 400, headers, body: 'Faltan campos: to, filename o base64.' };
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return {
      statusCode: 500,
      headers,
      body: 'Faltan las variables de entorno GMAIL_USER o GMAIL_APP_PASSWORD en Netlify.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // App Password de Google, no tu contraseña normal
      },
    });

    await transporter.sendMail({
      from: `"Registro de jornada" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Registro de jornada ${year || ''}`.trim(),
      html: `<p>Adjunto el registro de días presenciales, remotos y de oficina cerrada${year ? ` correspondiente a ${year}` : ''}.</p>`,
      attachments: [
        {
          filename,
          content: base64,
          encoding: 'base64',
        },
      ],
    });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 502, headers, body: err.message || 'Error al enviar el correo.' };
  }
};
