const userHandlers   = require('./lib/userHandlers.js');
const tokenHandlers  = require('./lib/tokenHandlers.js');
const checksHandlers = require('./lib/checkHandlers.js');

const routing = {
  '/api/ping': {
    get: async () => ({ result: 'I\'m alive!', statusCode: 200 }),
  },
  '/api/hello': {
    get: async () => 'Hello there! Nice to meet you!',
  },
  '/api/users' : userHandlers,
  '/api/tokens': tokenHandlers,
  '/api/checks': checksHandlers,
};

module.exports = routing;