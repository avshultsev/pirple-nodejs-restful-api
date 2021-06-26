const createEnvironment = (secret, globals = {}, port = 3000, httpsPort = 3001, envName = 'staging') => {
  return { port, httpsPort, envName, secret, globals };
};

const stagingGlobals = {
  baseUrl: 'http://localhost:3000',
  appName: 'Uptime Checker',
  yearCreated: '2021',
  companyName: 'FakeCompany, Inc.',
};

const environments = {
  'staging': createEnvironment('HTTPsecret', stagingGlobals),
  'production': createEnvironment('HTTPSsecret', {}, 5000, 5001, 'production'),
};

const { NODE_ENV } = process.env;
const envToExport = environments[NODE_ENV] || environments['staging'];

module.exports = envToExport;