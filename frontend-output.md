This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
````
netlify/
  functions/
    send-email.js
index.html
netlify.toml
package.json
README.md
repomix.config.json
send-email.js
````

# Files

## File: repomix.config.json
````json
{
  "$schema": "https://repomix.com/schemas/latest/schema.json",
  "input": {
    "maxFileSize": 52428800
  },
  "output": {
    "filePath": "frontend-output.md",
    "style": "markdown",
    "filePathStyle": "target-relative",
    "parsableStyle": false,
    "fileSummary": true,
    "directoryStructure": true,
    "files": true,
    "removeComments": false,
    "removeEmptyLines": false,
    "compress": false,
    "topFilesLength": 5,
    "showLineNumbers": false,
    "truncateBase64": false,
    "copyToClipboard": false,
    "includeFullDirectoryStructure": false,
    "tokenCountTree": false,
    "git": {
      "sortByChanges": true,
      "sortByChangesMaxCommits": 100,
      "includeDiffs": false,
      "includeLogs": false,
      "includeLogsCount": 50
    }
  },
  "include": [],
  "ignore": {
    "useGitignore": true,
    "useDotIgnore": true,
    "useDefaultPatterns": true,
    "customPatterns": []
  },
  "security": {
    "enableSecurityCheck": true
  },
  "tokenCount": {
    "encoding": "o200k_base"
  }
}
````

## File: netlify.toml
````toml
[build]
  publish = "."
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/send-email"
  to = "/.netlify/functions/send-email"
  status = 200
````

## File: README.md
````markdown
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
````

## File: send-email.js
````javascript
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
````

## File: netlify/functions/send-email.js
````javascript
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
````

## File: package.json
````json
{
  "name": "jornada-app-netlify",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "nodemailer": "^6.9.14"
  }
}
````

## File: index.html
````html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Registro de Jornada · Presencial / Remoto</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<style>
  :root{
    --bg: #f5f6f4;
    --panel: #ffffff;
    --ink: #1c2321;
    --ink-soft: #5b655f;
    --line: #dfe3de;
    --presencial: #2f6f4f;
    --presencial-bg: #e3f0e6;
    --remoto: #2f5c8f;
    --remoto-bg: #e4edf7;
    --cerrada: #a13d3d;
    --cerrada-bg: #f6e4e2;
    --accent: #2f6f4f;
    --radius: 10px;
    --mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
    --sans: "IBM Plex Sans", "Segoe UI", Arial, sans-serif;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    background:var(--bg);
    color:var(--ink);
    font-family:var(--sans);
    -webkit-font-smoothing:antialiased;
  }
  header{
    padding:28px 32px 18px;
    border-bottom:1px solid var(--line);
    background:var(--panel);
  }
  header h1{
    margin:0 0 4px;
    font-size:22px;
    letter-spacing:-0.01em;
  }
  header p{
    margin:0;
    color:var(--ink-soft);
    font-size:14px;
  }
  .eyebrow{
    font-family:var(--mono);
    font-size:11px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--accent);
    margin-bottom:6px;
    display:block;
  }
  main{
    max-width:980px;
    margin:0 auto;
    padding:28px 24px 80px;
  }
  .toolbar{
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-wrap:wrap;
    gap:12px;
    margin-bottom:20px;
  }
  .year-control{
    display:flex;
    align-items:center;
    gap:8px;
    font-family:var(--mono);
    font-size:13px;
  }
  .year-control button{
    width:28px;height:28px;
    border:1px solid var(--line);
    background:var(--panel);
    border-radius:6px;
    cursor:pointer;
    font-size:14px;
    line-height:1;
    color:var(--ink);
  }
  .year-control button:hover{ border-color:var(--accent); color:var(--accent); }
  .year-control span{ font-weight:600; font-size:16px; min-width:52px; text-align:center; }

  .months-nav{
    display:flex;
    flex-wrap:wrap;
    gap:6px;
    margin-bottom:22px;
  }
  .months-nav button{
    border:1px solid var(--line);
    background:var(--panel);
    padding:7px 12px;
    border-radius:999px;
    font-size:12.5px;
    font-family:var(--mono);
    letter-spacing:.02em;
    cursor:pointer;
    color:var(--ink-soft);
  }
  .months-nav button.active{
    background:var(--ink);
    color:#fff;
    border-color:var(--ink);
  }
  .months-nav button:hover:not(.active){ border-color:var(--accent); color:var(--accent); }

  .panel{
    background:var(--panel);
    border:1px solid var(--line);
    border-radius:var(--radius);
    padding:22px;
    margin-bottom:20px;
  }
  .panel h2{
    margin:0 0 2px;
    font-size:18px;
  }
  .panel .sub{
    color:var(--ink-soft);
    font-size:13px;
    margin:0 0 16px;
  }

  .legend{
    display:flex;
    gap:14px;
    flex-wrap:wrap;
    margin-bottom:18px;
    font-size:12.5px;
  }
  .legend span{
    display:inline-flex;
    align-items:center;
    gap:6px;
    color:var(--ink-soft);
  }
  .dot{ width:10px;height:10px;border-radius:3px;display:inline-block; }

  .weekdays{
    display:grid;
    grid-template-columns:repeat(7,1fr);
    gap:6px;
    margin-bottom:6px;
  }
  .weekdays div{
    text-align:center;
    font-family:var(--mono);
    font-size:11px;
    color:var(--ink-soft);
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .grid{
    display:grid;
    grid-template-columns:repeat(7,1fr);
    gap:6px;
  }
  .day{
    aspect-ratio:1/1;
    border-radius:8px;
    border:1px solid var(--line);
    background:#fafbf9;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    user-select:none;
    transition:transform .06s ease;
    font-family:var(--mono);
    font-size:13px;
    color:var(--ink);
    position:relative;
  }
  .day:hover{ transform:translateY(-1px); border-color:var(--accent); }
  .day.empty{ visibility:hidden; cursor:default; }
  .day.weekend{ background:#f1f2ef; color:var(--ink-soft); }
  .day .tag{
    font-size:8.5px;
    letter-spacing:.04em;
    text-transform:uppercase;
    margin-top:2px;
    font-weight:600;
  }
  .day.presencial{ background:var(--presencial-bg); border-color:var(--presencial); color:var(--presencial); }
  .day.remoto{ background:var(--remoto-bg); border-color:var(--remoto); color:var(--remoto); }
  .day.cerrada{ background:var(--cerrada-bg); border-color:var(--cerrada); color:var(--cerrada); }

  .summary{
    display:flex;
    gap:22px;
    margin-top:18px;
    padding-top:16px;
    border-top:1px dashed var(--line);
    font-size:13px;
    flex-wrap:wrap;
  }
  .summary div strong{ display:block; font-size:20px; font-family:var(--mono); }

  .actions{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    align-items:center;
  }
  .btn{
    border:none;
    border-radius:8px;
    padding:11px 18px;
    font-size:13.5px;
    font-weight:600;
    cursor:pointer;
    font-family:var(--sans);
  }
  .btn-primary{ background:var(--ink); color:#fff; }
  .btn-primary:hover{ background:#000; }
  .btn-secondary{ background:transparent; color:var(--ink); border:1px solid var(--line); }
  .btn-secondary:hover{ border-color:var(--accent); color:var(--accent); }

  .send-form{
    display:grid;
    gap:12px;
    max-width:460px;
  }
  .send-form label{
    font-size:12.5px;
    color:var(--ink-soft);
    display:block;
    margin-bottom:5px;
    font-family:var(--mono);
  }
  .send-form input, .send-form textarea{
    width:100%;
    padding:10px 12px;
    border:1px solid var(--line);
    border-radius:8px;
    font-size:14px;
    font-family:var(--sans);
    background:#fbfcfa;
  }
  .send-form input:focus, .send-form textarea:focus{ outline:2px solid var(--accent); outline-offset:1px; }
  .note{
    font-size:12px;
    color:var(--ink-soft);
    line-height:1.5;
    background:#fbfaf5;
    border:1px solid var(--line);
    border-left:3px solid var(--accent);
    padding:10px 12px;
    border-radius:6px;
  }
  #status{
    font-size:13px;
    margin-top:10px;
    font-family:var(--mono);
  }
  #status.ok{ color:var(--presencial); }
  #status.err{ color:var(--cerrada); }
  #status.pending{ color:var(--ink-soft); }
  footer{
    text-align:center;
    color:var(--ink-soft);
    font-size:12px;
    padding:20px;
  }
</style>
</head>
<body>

<header>
  <span class="eyebrow">Panel de asistencia</span>
  <h1>Registro de jornada — Presencial · Remoto · Oficina cerrada</h1>
  <p>Marca cada día del año y exporta o envía el resumen en Excel.</p>
</header>

<main>

  <div class="toolbar">
    <div class="year-control">
      <button id="yearPrev" aria-label="Año anterior">‹</button>
      <span id="yearLabel"></span>
      <button id="yearNext" aria-label="Año siguiente">›</button>
    </div>
    <div class="actions">
      <button class="btn btn-secondary" id="clearMonthBtn">Vaciar mes</button>
      <button class="btn btn-primary" id="downloadBtn">Descargar Excel</button>
    </div>
  </div>

  <div class="months-nav" id="monthsNav"></div>

  <section class="panel">
    <h2 id="monthTitle"></h2>
    <p class="sub">Haz clic sobre un día para pasar entre Presencial → Remoto → Oficina cerrada → Sin marcar.</p>

    <div class="legend">
      <span><i class="dot" style="background:var(--presencial)"></i>Presencial</span>
      <span><i class="dot" style="background:var(--remoto)"></i>Remoto</span>
      <span><i class="dot" style="background:var(--cerrada)"></i>Oficina cerrada</span>
      <span><i class="dot" style="background:#e4e6e1;border:1px solid var(--line)"></i>Sin marcar</span>
    </div>

    <div class="weekdays">
      <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
    </div>
    <div class="grid" id="calendarGrid"></div>

    <div class="summary" id="summary"></div>
  </section>

  <section class="panel">
    <h2>Enviar por email</h2>
    <p class="sub">Genera el Excel del año completo y lo envía como adjunto.</p>

    <form class="send-form" id="sendForm">
      <div>
        <label for="toEmail">Destinatario</label>
        <input type="email" id="toEmail" placeholder="persona@empresa.com" required>
      </div>
      <div>
        <button type="submit" class="btn btn-primary">Generar y enviar Excel</button>
      </div>
      <div id="status"></div>
    </form>
  </section>

</main>

<footer>Los datos se guardan solo en este navegador (localStorage). Nada se envía hasta que pulsas "Enviar".</footer>

<script>
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const STATES = ["", "presencial", "remoto", "cerrada"];
const STATE_LABEL = { presencial:"Presencial", remoto:"Remoto", cerrada:"Oficina cerrada" };

let year = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let data = {}; // data[year][month][day] = state

function storageKey(){ return "jornada-data-v1"; }

function loadData(){
  try{
    const raw = localStorage.getItem(storageKey());
    data = raw ? JSON.parse(raw) : {};
  }catch(e){ data = {}; }
}
function saveData(){
  localStorage.setItem(storageKey(), JSON.stringify(data));
}
function ensureYear(y){
  if(!data[y]) data[y] = {};
}
function getDayState(y,m,d){
  ensureYear(y);
  return (data[y][m] && data[y][m][d]) || "";
}
function setDayState(y,m,d,state){
  ensureYear(y);
  if(!data[y][m]) data[y][m] = {};
  if(state === "") delete data[y][m][d];
  else data[y][m][d] = state;
  saveData();
}

function renderMonthsNav(){
  const nav = document.getElementById('monthsNav');
  nav.innerHTML = "";
  MONTHS.forEach((name, idx) => {
    const b = document.createElement('button');
    b.textContent = name.slice(0,3);
    if(idx === currentMonth) b.classList.add('active');
    b.addEventListener('click', () => { currentMonth = idx; renderAll(); });
    nav.appendChild(b);
  });
}

function renderYear(){
  document.getElementById('yearLabel').textContent = year;
}

function renderCalendar(){
  document.getElementById('monthTitle').textContent = `${MONTHS[currentMonth]} ${year}`;
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = "";

  const firstDay = new Date(year, currentMonth, 1);
  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  // JS getDay(): 0=Sun..6=Sat. We want Monday-first columns.
  let startOffset = firstDay.getDay() - 1;
  if(startOffset < 0) startOffset = 6;

  for(let i=0;i<startOffset;i++){
    const empty = document.createElement('div');
    empty.className = 'day empty';
    grid.appendChild(empty);
  }

  for(let d=1; d<=daysInMonth; d++){
    const cell = document.createElement('div');
    const dow = new Date(year, currentMonth, d).getDay();
    const isWeekend = (dow === 0 || dow === 6);
    const state = getDayState(year, currentMonth, d);
    cell.className = 'day' + (isWeekend && !state ? ' weekend' : '') + (state ? ' ' + state : '');
    cell.innerHTML = `<span>${d}</span>` + (state ? `<span class="tag">${STATE_LABEL[state].split(' ')[0]}</span>` : '');
    cell.addEventListener('click', () => {
      const cur = getDayState(year, currentMonth, d);
      const next = STATES[(STATES.indexOf(cur) + 1) % STATES.length];
      setDayState(year, currentMonth, d, next);
      renderCalendar();
      renderSummary();
    });
    grid.appendChild(cell);
  }
}

function renderSummary(){
  const summary = document.getElementById('summary');
  const counts = { presencial:0, remoto:0, cerrada:0 };
  ensureYear(year);
  const monthData = data[year][currentMonth] || {};
  Object.values(monthData).forEach(s => { if(counts[s] !== undefined) counts[s]++; });
  summary.innerHTML = `
    <div><strong>${counts.presencial}</strong>Presencial</div>
    <div><strong>${counts.remoto}</strong>Remoto</div>
    <div><strong>${counts.cerrada}</strong>Oficina cerrada</div>
  `;
}

function renderAll(){
  renderYear();
  renderMonthsNav();
  renderCalendar();
  renderSummary();
}

document.getElementById('yearPrev').addEventListener('click', () => { year--; renderAll(); });
document.getElementById('yearNext').addEventListener('click', () => { year++; renderAll(); });
document.getElementById('clearMonthBtn').addEventListener('click', () => {
  ensureYear(year);
  data[year][currentMonth] = {};
  saveData();
  renderCalendar();
  renderSummary();
});

// ---------- Excel generation ----------
function buildWorkbook(){
  const wb = XLSX.utils.book_new();
  const weekdayNames = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const summaryRows = [["Mes","Presencial","Remoto","Oficina cerrada","Sin marcar"]];

  ensureYear(year);

  MONTHS.forEach((monthName, m) => {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const rows = [["Día","Día de la semana","Estado"]];
    const counts = { presencial:0, remoto:0, cerrada:0, sinmarcar:0 };

    for(let d=1; d<=daysInMonth; d++){
      const dow = new Date(year, m, d).getDay();
      const state = getDayState(year, m, d);
      const label = state ? STATE_LABEL[state] : "";
      rows.push([d, weekdayNames[dow], label]);
      if(state) counts[state]++; else counts.sinmarcar++;
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:6},{wch:16},{wch:18}];
    XLSX.utils.book_append_sheet(wb, ws, monthName.slice(0,10));

    summaryRows.push([monthName, counts.presencial, counts.remoto, counts.cerrada, counts.sinmarcar]);
  });

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs['!cols'] = [{wch:14},{wch:12},{wch:10},{wch:16},{wch:12}];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen");
  // Move summary sheet first
  wb.SheetNames.unshift(wb.SheetNames.pop());

  return wb;
}

document.getElementById('downloadBtn').addEventListener('click', () => {
  const wb = buildWorkbook();
  XLSX.writeFile(wb, `jornada-${year}.xlsx`);
});

// ---------- Send via backend / Resend ----------
document.getElementById('sendForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('status');
  const toEmail = document.getElementById('toEmail').value.trim();
  const endpoint = document.getElementById('endpoint').value.trim();

  status.className = 'pending';
  status.textContent = 'Generando Excel y enviando…';

  try{
    const wb = buildWorkbook();
    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const filename = `jornada-${year}.xlsx`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toEmail, filename, base64, year })
    });

    if(!res.ok){
      const text = await res.text();
      throw new Error(text || `Error HTTP ${res.status}`);
    }

    status.className = 'ok';
    status.textContent = `✓ Enviado correctamente a ${toEmail}`;
  }catch(err){
    status.className = 'err';
    status.textContent = `✗ No se pudo enviar: ${err.message}. Revisa que el backend (carpeta server/) esté en marcha.`;
  }
});

loadData();
renderAll();
</script>
</body>
</html>
````
