const { createFile, readFile, updateFile, deleteFile, rename } = require('./crud.js');
const { toHash, validatePayload } = require('./utils.js');
const { verifyToken } = require('./tokenHandlers.js');
const { MIN_PHONE_NUMBER_LENGTH } = require('./constants.js');

const _get = async ({ queryParams, token }) => {
  const { phone } = queryParams;
  const tokenVerified = await verifyToken(token, phone);
  if (tokenVerified) {
    try {
      const result = await readFile('users', phone);
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
  const validPayload = validatePayload(required, body);
  if (!validPayload) return {result: 'Missing required fields!', statusCode: 400};
  const { phone, password } = body;
  if (phone.length < MIN_PHONE_NUMBER_LENGTH) {
    return {result: 'Phone number too short!', statusCode: 400};
  };
  const hashedPassword = toHash(password);
  validPayload.password = hashedPassword;
  try {
    await createFile('users', phone, validPayload);
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
    const validPayload = validatePayload(required, body);
    if (!validPayload || body.phone.length < MIN_PHONE_NUMBER_LENGTH) {
      return {result: 'Missing the required fields!', statusCode: 400};
    }
    validPayload.password = toHash(body.password);
    if (phone !== body.phone) {
      try {
        await rename('users', phone, body.phone);
      } catch (err) { // if rename fails - set the phone to one from queryParams
        console.log('Error renaming file!', err);
        validPayload.phone = phone;
      }
    };
    try {
      await updateFile('users', validPayload.phone, validPayload);
      return {result: validPayload, statusCode: 200};
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
      await deleteFile('users', phone);
      return {result: 'File deleted successfully!', statusCode: 200};
    } catch (err) {
      console.log(err);
      return {result: 'User not found!', statusCode: 404};
    }
  }
  return {result: 'Unauthenticated!', statusCode: 403};
};

module.exports = { _get, _post, _put, _delete };