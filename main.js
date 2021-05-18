const http  = require('http');
const https = require('https');
const fs    = require('fs');
const { port: PORT, httpsPort, envName } = require('./config.js');
const { createFile, readFile, updateFile, deleteFile } = require('./lib/crud.js');

deleteFile('test', 'newFile.json');

const receiveArgs = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const data = Buffer.concat(chunks).toString();
  return JSON.parse(data);
};

const routing = {
  '/': async () => 'Welcome to the main page!',
  '/ping': async () => 'I\'m alive!',
  '/hello': async () => 'Hello there! Nice to meet you!',
};

const listener = async (req, res) => {
  const { method, url, headers } = req;
  let body = null;
  if (method === "POST") body = receiveArgs(req);
  const handler = routing[url];
  if (!handler) {
    res.writeHead(404, 'Not Found', {'Content-Type' : 'text/plain'});
    res.end('Not Found');
    return;
  }
  const result = await handler();
  res.writeHead(200, {'Content-Type' : 'application/json'});
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