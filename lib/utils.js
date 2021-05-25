const crypto = require('crypto');
const { secret } = require('../config.js');

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

module.exports = { toHash, createRandomString, validatePayload };