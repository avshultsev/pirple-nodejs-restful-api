const initServer  = require('./server.js');
const initChecker = require('./lib/checker.js');

const app = {
  init: () => {
    initServer();
    initChecker();
  },
};

app.init();
module.exports = app;