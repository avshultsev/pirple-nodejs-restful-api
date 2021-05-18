const createEnvironment = (port = 3000, httpsPort = 3001, envName = 'staging') => {
  return { port, httpsPort, envName };
};

const environments = {
  'staging': createEnvironment(),
  'production': createEnvironment(5000, 5001, 'production'),
};

const { NODE_ENV } = process.env;
const envToExport = environments[NODE_ENV] || environments['staging'];

module.exports = envToExport;