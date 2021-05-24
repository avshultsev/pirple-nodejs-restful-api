const { createFile, readFile, updateFile, deleteFile, rename } = require('./crud.js');
const { toHash } = require('./utils.js');
const { verifyToken } = require('./tokenHandlers.js');
const { MIN_PHONE_NUMBER_LENGTH } = require('./constants.js');

const _get = async ({ queryParams, token }) => {
  const { phone } = queryParams;
  const tokenVerified = await verifyToken(token, phone);
  if (tokenVerified) {
    try {
      const result = await readFile('users', `${phone}.json`);
      delete result.password;
      return {result, statusCode: 200};
    } catch (err) {
      console.log(err);
      return {result: 'User not found!', statusCode: 404}
    }
  }
  return {result: 'Unauthenticated!', statusCode: 403};
};

const _post = async ({ body }) => {
  const required = ['firstName', 'lastName', 'phone', 'password', 'tosAgreement'];
  for (const prop of required) {
    if (!body[prop]) return {result: 'Missing required fields!', statusCode: 400};
  }
  const { phone, password } = body;
  if (phone.length < MIN_PHONE_NUMBER_LENGTH) {
    return {result: 'Phone number too short!', statusCode: 400};
  };
  const data = {...body};
  const hashedPassword = toHash(password);
  data.password = hashedPassword;
  try {
    await createFile('users', `${phone}.json`, data);
    return {result: 'File created successfully!', statusCode: 200};
  } catch (err) {
    console.log(err);
    return {result: 'User already exists!', statusCode: 500};
  }
};

const _put = async ({ body, queryParams, token }) => {
  const { phone } = queryParams;
  const tokenVerified = await verifyToken(token, phone);
  if (tokenVerified) {
    const required = ['firstName', 'lastName', 'phone', 'password', 'tosAgreement'];
    const newData = {};
    for (const prop of required) {
      const value = body[prop];
      if (!value || body.phone.length < 7) {
        return {result: 'Missing the required fields!', statusCode: 400};
      };
      newData[prop] = value;
    }
    newData.password = toHash(body.password);
    if (phone !== body.phone) {
      try {
        await rename('users', `${phone}.json`, `${body.phone}.json`);
      } catch (err) { // if rename fails - set the phone to one from queryParams
        console.log('Error renaming file!', err);
        newData.phone = phone;
      }
    };
    try {
      console.log('newData in handler', newData);
      await updateFile('users', `${newData.phone}.json`, newData);
      return {result: newData, statusCode: 200};
    } catch (err) {
      console.log(err);
      return {result: 'User not found!', statusCode: 404};
    }
  }
  return {result: 'Unauthenticated!', statusCode: 403};
};

const _delete = async ({ queryParams, token }) => {
  const { phone } = queryParams;
  const tokenVerified = await verifyToken(token, phone);
  if (tokenVerified) {
    try {
      await deleteFile('users', `${phone}.json`);
      return {result: 'File deleted successfully!', statusCode: 200};
    } catch (err) {
      console.log(err);
      return {result: 'User not found!', statusCode: 404};
    }
  }
  return {result: 'Unauthenticated!', statusCode: 403};
};

module.exports = { _get, _post, _put, _delete };