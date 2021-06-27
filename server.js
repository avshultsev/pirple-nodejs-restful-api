const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { port: PORT, httpsPort, envName, globals } = require('./config.js');
const routing = require('./routing.js');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const PAGE_SPECIFIC_PLACEHOLDERS = {
  '/index.html': {
    'head.title': 'Main Page',
  },
  '/session/create.html': {
    'head.title': 'Create session',
  },
  '/account/create.html': {
    'head.title': 'Create an account',
  },
};

const cache = new Map();
const staticPath = path.join(__dirname, 'public');
const retreiveFile = async (fileName) => {
  const filePath = path.join(staticPath, fileName);
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.log(err);
  });
  let data = '';
  for await (const chunk of stream) data += chunk;
  return data;
};

const getHeaderAndFooter = () => {
  const arr = ['__header.html', '__footer.html'];
  const promises = arr.map(retreiveFile);
  return Promise.all(promises).then(([__header, __footer]) => {
    cache.set('__header', __header);
    cache.set('__footer', __footer);
    return [__header, __footer];
  });
};

const removePlaceholders = (rawHtml = '', fileName = '') => {
  const pageData = PAGE_SPECIFIC_PLACEHOLDERS[fileName] || {'head.title': 'Not Found'};
  const str = Object.keys(pageData).reduce((acc, key) => {
    return acc.replace(`{${key}}`, pageData[key])
  }, rawHtml);
  return Object.keys(globals).reduce((acc, key) => {
    const placeholder = '{globals.'+ key + '}';
    const value = globals[key];
    return acc.replace(placeholder, value);
  }, str);
};

const serveFile = async (name, ext) => {
  const isHTML = ext === 'html';
  let content = cache.get(name);
  if (!content) {
    try {
      content = await retreiveFile(name);
      if (isHTML) cache.set(name, content); // cache only markup
    } catch (err) {
      content = isHTML ? '<h1>Page you\'re looking for does not exist!</h1>' : '';
    }
  }
  if (!isHTML) return content;
  let header = cache.get('__header');
  let footer = cache.get('__footer');
  if (!header || !footer) {
    [header, footer] = await getHeaderAndFooter();
    cache.set('__header', header);
    cache.set('__footer', footer);
  }
  return removePlaceholders(header + content + footer, name);
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
    return res.end(JSON.stringify({ result, statusCode }));
  }
  let fileName = url === '/' ? '/index.html' : url;
  let fileExt = path.extname(fileName).substring(1);
  if (!fileExt) { // so that 'http://localhost:3000/page1' and 'http://localhost:3000/page1.html' both return same result
    fileExt = 'html';
    fileName += ('.' + fileExt);
  };
  const type = MIME_TYPES[fileExt] || MIME_TYPES.html;
  const content = await serveFile(fileName, fileExt);
  if (content === '') {
    res.writeHead(404, 'Not Found!');
    res.end();
  }
  res.writeHead(200, { 'Content-Type': type });
  res.end(content);
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