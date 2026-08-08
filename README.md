# Registro de Jornada — versión lista para Netlify

Todo en un solo sitio: la página estática (`index.html`) y el envío de email
como una Netlify Function. No necesitas un servidor aparte.

## Estructura

```
.
├── index.html                     ← la app (calendario + generación de Excel)
├── netlify.toml                   ← configuración del deploy
├── package.json                   ← dependencia "resend" para la función
└── netlify/
    └── functions/
        └── send-email.js          ← función serverless que llama a Resend
```

## Subir a Netlify

### Opción A — arrastrar y soltar (la más rápida)

1. Ve a https://app.netlify.com/drop
2. Arrastra esta carpeta completa (con `index.html`, `netlify.toml`,
   `package.json` y `netlify/` dentro).
3. Netlify detecta `netlify.toml` y `netlify/functions/` automáticamente y
   despliega la función junto con el sitio.

Nota: con "drag and drop" Netlify no siempre instala `node_modules` para las
funciones. Si al enviar el email ves un error de tipo "Cannot find module
resend", usa la Opción B (con Git) o sube también la carpeta `node_modules`
tras correr `npm install` localmente.

### Opción B — con un repositorio Git (recomendada)

1. Sube esta carpeta a un repo (GitHub, GitLab o Bitbucket).
2. En Netlify: **Add new site → Import an existing project**, conecta el
   repo.
3. Build command: déjalo vacío (no hay build). Publish directory: `.`
4. Netlify instalará automáticamente las dependencias de
   `netlify/functions` gracias al `package.json` de la raíz.

### Opción C — con la CLI de Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Configurar la API key de Resend

En el panel del sitio: **Site configuration → Environment variables**, añade:

| Variable | Valor |
|---|---|
| `RESEND_API_KEY` | tu API key de https://resend.com/api-keys |
| `FROM_EMAIL` | `onboarding@resend.dev` (pruebas) o un remitente de tu dominio verificado en https://resend.com/domains |

Vuelve a desplegar (o pulsa "Trigger deploy") después de añadir las
variables para que la función las tome.

## Probar

Abre la URL de tu sitio Netlify (algo como `https://tu-sitio.netlify.app`).
El campo "URL de tu backend de envío" ya viene precargado con `/api/send-email`
— gracias a la redirección definida en `netlify.toml`, esa ruta apunta a la
función serverless automáticamente, sin que tengas que cambiar nada.

## Desarrollo local con la función incluida

Si quieres probar la función antes de desplegar:

```bash
npm install -g netlify-cli
npm install
netlify dev
```

Esto levanta la página y la función juntas en `http://localhost:8888`
(crea un archivo `.env` en la raíz con `RESEND_API_KEY` y `FROM_EMAIL` para
que `netlify dev` las cargue).
