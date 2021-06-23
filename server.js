const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { port: PORT, httpsPort, envName } = require('./config.js');
const userHandlers   = require('./lib/userHandlers.js');
const tokenHandlers  = require('./lib/tokenHandlers.js');
const checksHandlers = require('./lib/checkHandlers.js');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const staticPath = path.join(__dirname, 'public');
const serveFile = (name) => {
  const filePath = path.join(staticPath, name);
  const stream = fs.createReadStream(filePath);
  return stream;
};

const receiveArgs = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const data = Buffer.concat(chunks).toString();
  return JSON.parse(data);
};

const parseQueryParams = ({ url, headers }) => {
  const { host } = headers;
  const port = host.split(':')[1];
  const protocol = port.includes('1') ? 'https' : 'http';
  const urlObj = new URL(`${protocol}://${host}${url}`); // ${http}://${localhost:3000}${/api/users?phone=123456789}
  const queryParams = {};
  const endpoint = urlObj.pathname;
  if (urlObj.search === '') return { queryParams, endpoint };
  for (const [key, value] of urlObj.searchParams.entries()) {
    queryParams[key] = value;
  }
  return { queryParams, endpoint };
};

const routing = {
  '/ping': {
    get: async () => 'I\'m alive!',
  },
  '/hello': {
    get: async () => 'Hello there! Nice to meet you!',
  },
  '/api/users' : userHandlers,
  '/api/tokens': tokenHandlers,
  '/api/checks': checksHandlers,
};

const notFound = (res) => {
  res.writeHead(404, 'Not Found', {'Content-Type' : 'text/plain'});
  res.end('Not Found');
}

const listener = async (req, res) => {
  const { method, url, headers } = req;
  const { token } = headers;
  const { queryParams, endpoint } = parseQueryParams({ url, headers });
  if (url.startsWith('/api')) {
    let body = null;
    const route = routing[endpoint];
    if (!route) return notFound(res);
    const handler = route[method.toLowerCase()];
    if (!handler) return notFound(res);
    const bodyRequired = handler.toString().startsWith('async ({ body');
    if (bodyRequired) body = await receiveArgs(req);
    const { result, statusCode } = await handler({ body, queryParams, token });
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ result, body }));
  }
  const name = url === '/' ? '/index.html' : url; // try 'index.html' (without slash)
  const fileExt = path.extname(name).substring(1) || 'html';
  const type = MIME_TYPES[fileExt] || MIME_TYPES.html;
  const stream = serveFile(name);
  stream.on('error', () => {
    res.writeHead(404, 'Not Found!');
    res.end();
  });
  res.writeHead(200, { 'Content-Type': type });
  stream.pipe(res);
};

const httpsOptions = {
  'key'  : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem'),
};

module.exports = () => {
  http
    .createServer(listener)
    .listen(PORT, () => {
      console.log(`Server started on ${PORT} in ${envName} mode!`);
    });

  https
    .createServer(httpsOptions, listener)
    .listen(httpsPort, () => {
      console.log(`HTTPS Server started on ${httpsPort} in ${envName} mode!`);
  });
};