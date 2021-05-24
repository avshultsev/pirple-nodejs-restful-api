const { createFile, updateFile, readFile, deleteFile } = require('./crud.js');
const { verifyToken } = require('./tokenHandlers.js');
const { MAX_CHECK_TIMEOUT, MIN_CHECK_TIMEOUT, MAX_CHECK_LENGTH, TOKEN_LENGTH } = require('./constants.js');
const { createRandomString } = require('./utils.js');

const _get = async () => {};

const _post = async ({ body, token }) => {
  try {
    const tokenData = await readFile('tokens', `${token}.json`);
    const { phone } = tokenData;
    const tokenVerified = await verifyToken(token, phone);
    if (!tokenVerified) return {result: 'Unauthenticated!', statusCode: 403};
    try {
      const userData = await readFile('users', `${phone}.json`);
      userData.checks = userData.checks || [];
      if (userData.checks.length >= MAX_CHECK_LENGTH) {
        return {result: 'This user has max number of checks!', statusCode: 400};
      }
      const timeout = body['timeout'];
      if (timeout < MIN_CHECK_TIMEOUT || timeout > MAX_CHECK_TIMEOUT) {
        return {result: 'Fields are invalid!', statusCode: 400};
      }
      const required = ['protocol', 'url', 'method', 'successCodes', 'timeout'];
      const checkData = {};
      for (const prop of required) {
        const value = body[prop];
        if (!value) return {result: 'Missing the required fields!', statusCode: 400};
        checkData[prop] = value;
      }
      const checkID = createRandomString(TOKEN_LENGTH);
      userData.checks.push(checkID);
      checkData['checkID'] = checkID;
      checkData['phone'] = phone;
      try {
        await Promise.all([
          updateFile('users', `${phone}.json`, userData),
          createFile('checks', `${checkID}.json`, checkData)
        ]);
        return {result: 'New check created!', statusCode: 200};
      } catch (err) {
        return {result: 'Error creating new check!', statusCode: 500};
      }
    } catch (err) {
      return {result: 'User not found!', statusCode: 404};
    }
  } catch (err) {
    return {result: 'Token not found!', statusCode: 404};
  }
};

const _put = async () => {};

const _delete = async () => {};

module.exports = { _get, _post, _put, _delete };