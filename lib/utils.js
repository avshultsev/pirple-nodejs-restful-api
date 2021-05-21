const crypto = require('crypto');
const { secret } = require('../config.js');

const toHash = str => {
  const hashedPassword = crypto
    .createHmac('sha256', secret)
    .update(str)
    .digest('hex');
  return hashedPassword;
};

module.exports = { toHash };