const { createRandomString, toHash } = require('./utils.js')
const { createFile, readFile, updateFile, deleteFile } = require('./crud.js');

const verifyToken = async (token, phone) => {
  try {
    const tokenData = await readFile('tokens', `${token}.json`);
    const { phone: userPhone, expires } = tokenData;
    return (userPhone === phone) && (expires > Date.now());
  } catch (err) {
    return false;    
  }
};

const _get = async ({ queryParams }) => {
  const { token } = queryParams;
  try {
    const tokenData = await readFile('tokens', `${token}.json`);
    return {result: tokenData, statusCode: 200};
  } catch (err) {
    return {result: 'Token not found!', statusCode: 404};
  }
};

const _post = async ({ body }) => {
  const { password, phone } = body;
  const hashedPassword = toHash(password);
  const token = createRandomString(20);
  try {
    const user = await readFile('users', `${phone}.json`);
    if (user.password === hashedPassword) {
      const expires = Date.now() + 1000 * 60 * 60;
      const tokenData = { phone, token, expires };
      try {
        await createFile('tokens', `${token}.json`, tokenData);
        return {result: tokenData, statusCode: 200};
      } catch (err) {
        return {result: 'File already exists!', statusCode: 500};
      }
    }
    return {result: 'Password invalid!', statusCode: 400};
  } catch (err) {
    console.log(err);
    return {result: 'User not found!', statusCode: 404};
  }
};

const _put = async ({ body, queryParams }) => {
  const { token } = queryParams;
  const { shouldExtend } = body;
  if (!shouldExtend) return {result: 'Missing the required fields', statusCode: 400};
  try {
    const tokenData = await readFile('tokens', `${token}.json`);
    if (tokenData.expires > Date.now()) {
      tokenData.expires = Date.now() + 1000 * 60 * 60;
      try {
        await updateFile('tokens', `${token}.json`, tokenData);
        return {result: 'Token updated successfully!', statusCode: 200};
      } catch (err) {
        return {result: 'Unable to update token!', statusCode: 500};
      }
    }
    return {result: 'Token expired and cannot be extended!', statusCode: 400};
  } catch (err) {
    return {result: 'Token not found!', statusCode: 404};
  }
};

const _delete = async ({ queryParams }) => {
  const { token } = queryParams;
  try {
    await deleteFile('tokens', `${token}.json`);
    return {result: 'Token deleted successfully!', statusCode: 200};
  } catch (err) {
    console.log(err);
    return {result: 'Token not found!', statusCode: 404};
  }
};

module.exports = { _get, _post, _put, _delete, verifyToken };