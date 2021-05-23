const http  = require('http');
const https = require('https');
const fs    = require('fs');
const { port: PORT, httpsPort, envName } = require('./config.js');
const userHandlers = require('./lib/userHandlers.js');
const tokenHandlers = require('./lib/tokenHandlers.js');

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
  const urlObj = new URL(`${protocol}://${host}${url}`);
  const queryParams = {};
  const endpoint = urlObj.pathname;
  if (urlObj.search === '') return { queryParams, endpoint };
  for (const [key, value] of urlObj.searchParams.entries()) {
    queryParams[key] = value;
  }
  return { queryParams, endpoint };
};

const routing = {
  '/': {
    get: async () => 'Welcome to the main page!',
  },
  '/ping': {
    get: async () => 'I\'m alive!',
  },
  '/hello': {
    get: async () => 'Hello there! Nice to meet you!',
  },
  '/users': {
    get: userHandlers._get,
    post: userHandlers._post,
    put: userHandlers._put,
    delete: userHandlers._delete,
  },
  '/tokens': {
    get: tokenHandlers._get,
    post: tokenHandlers._post,
    put: tokenHandlers._put,
    delete: tokenHandlers._delete,
  }
};

const notFound = (res) => {
  res.writeHead(404, 'Not Found', {'Content-Type' : 'text/plain'});
  res.end('Not Found');
}

const listener = async (req, res) => {
  const { method } = req;
  const { token } = req.headers;
  const { queryParams, endpoint } = parseQueryParams(req);
  let body = null;
  const route = routing[endpoint];
  if (!route) return notFound(res);
  const handler = route[method.toLowerCase()];
  if (!handler) return notFound(res);
  const bodyRequired = handler.toString().startsWith('async ({ body');
  if (bodyRequired) body = await receiveArgs(req);
  const { result, statusCode } = await handler({ body, queryParams, token});
  res.writeHead(statusCode, {'Content-Type' : 'application/json'});
  res.end(JSON.stringify({ result, body }));
};

const httpsOptions = {
  'key'  : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem'),
};

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