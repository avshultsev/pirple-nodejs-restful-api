const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const crypto = require('crypto');
const { port: PORT, httpsPort, envName, secret } = require('./config.js');
const { createFile, readFile, updateFile, deleteFile } = require('./lib/crud.js');

const receiveArgs = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const data = Buffer.concat(chunks).toString();
  return JSON.parse(data);
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
    get: async () => {},
    post: async (payload, statusCode) => {
      const required = ['firstName', 'lastName', 'phone', 'password', 'tosAgreement'];
      for (const prop of required) {
        if (!payload[prop]) return {result: 'Missing required fields!', statusCode: 400};
      }
      const { phone, password } = payload;
      // f. ex. 7, could be any other value
      if (phone.length < 7) return {result: 'Phone number too short!', statusCode: 400};
      const data = {...payload};
      const hashedPassword = crypto.createHmac('sha256', secret).update(password).digest('hex');
      data.password = hashedPassword;
      try {
        const result = await createFile('users', `${phone}.json`, data);
        return {result, statusCode};
      } catch (err) {
        console.log(err);
        return {result: 'User already exists!', statusCode: 500};
      }
    },
    put: async () => {},
    delete: async () => {},
  }
};

const notFound = (res) => {
  res.writeHead(404, 'Not Found', {'Content-Type' : 'text/plain'});
  res.end('Not Found');
}

const listener = async (req, res) => {
  const { method, url, headers } = req;
  let body = null;
  if (method === "POST") body = await receiveArgs(req);
  const route = routing[url];
  if (!route) return notFound(res);
  const handler = route[method.toLowerCase()];
  if (!handler) return notFound(res);
  const { result, statusCode } = await handler(body, 200);
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