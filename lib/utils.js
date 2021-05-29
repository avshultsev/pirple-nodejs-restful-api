const crypto = require('crypto');
const { secret } = require('../config.js');
const https = require('https');
const { fromPhone, accountSid, authToken } = require('../twilioUser.js');
const { promisify } = require('util');

const toHash = str => {
  const hashedPassword = crypto
    .createHmac('sha256', secret)
    .update(str)
    .digest('hex');
  return hashedPassword;
};

const createRandomString = length => {
  const LOWERCASE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
  const UPPERCASE_ALPHABET = LOWERCASE_ALPHABET.toUpperCase();
  const DIGITS = '1234567890';
  const ALPHA_DIGIT = LOWERCASE_ALPHABET + UPPERCASE_ALPHABET + DIGITS;
  const ALPHA_DIGIT_LENGTH = ALPHA_DIGIT.length;
  let str = '';
  while (str.length < length) {
    const index = Math.round(Math.random() * ALPHA_DIGIT_LENGTH);
    str += ALPHA_DIGIT[index];
  };
  return str;
};

const validatePayload = (requiredFields = [], payload = {}) => {
  const objOfRequired = {};
  for (const prop of requiredFields) {
    const value = payload[prop];
    if (!value) return false;
    objOfRequired[prop] = value;
  }
  return objOfRequired;
};

const sendTwilioSms = (phone, message, cb) => {
  const payload = new URLSearchParams({
    'From': fromPhone,
    'To': phone,
    'Body': message,
  });
  const strPayload = payload.toString();
  const options = {
    'protocol': 'https:',
    'hostname': 'api.twilio.com',
    'method': 'POST',
    'path': '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
    'auth': `${accountSid}:${authToken}`,
    'headers': {
      'Content-Length': Buffer.byteLength(strPayload),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  const req = https.request(options, (res) => {
    const { statusCode, statusMessage } = res;
    console.dir({statusMessage, statusCode});
    cb(statusCode === 200 || statusCode === 201);
  });
  req.on('error', (err) => {
    console.log(err);
    throw new Error(err);
  });
  req.write(strPayload);
  req.end();
};

module.exports = { toHash, createRandomString, validatePayload, sendTwilioSms };