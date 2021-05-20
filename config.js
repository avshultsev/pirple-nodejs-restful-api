const createEnvironment = (secret, port = 3000, httpsPort = 3001, envName = 'staging') => {
  return { port, httpsPort, envName, secret };
};

const environments = {
  'staging': createEnvironment('HTTPsecret'),
  'production': createEnvironment('HTTPSsecret', 5000, 5001, 'production'),
};

const { NODE_ENV } = process.env;
const envToExport = environments[NODE_ENV] || environments['staging'];

module.exports = envToExport;