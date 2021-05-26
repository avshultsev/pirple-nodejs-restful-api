const { createFile, updateFile, readFile, deleteFile } = require('./crud.js');
const { verifyToken } = require('./tokenHandlers.js');
const { MAX_CHECK_TIMEOUT, MIN_CHECK_TIMEOUT, MAX_CHECK_LENGTH, TOKEN_LENGTH } = require('./constants.js');
const { createRandomString, validatePayload } = require('./utils.js');

const _get = async ({ queryParams, token }) => {
  const { checkID } = queryParams;
  try {
    const checkData = await readFile('checks', checkID);
    const { phone } = checkData;
    const tokenVerified = await verifyToken(token, phone);
    if (!tokenVerified) return {result: 'Unauthenticated!', statusCode: 403};
    return {result: checkData, statusCode: 200};
  } catch (err) {
    return {result: 'Check not found!', statusCode: 404};    
  }
};

const _post = async ({ body, token }) => {
  try {
    const tokenData = await readFile('tokens', token);
    if (tokenData.expires < Date.now()) throw new Error();
    try {
      const { phone } = tokenData;
      const userData = await readFile('users', phone);
      userData.checks = userData.checks || [];
      if (userData.checks.length >= MAX_CHECK_LENGTH) {
        return {result: 'This user has max number of checks!', statusCode: 400};
      }
      const required = ['protocol', 'url', 'method', 'successCodes', 'timeout'];
      const isPayloadValid = validatePayload(required, body);
      const timeout = body['timeout'];
      if (!isPayloadValid || timeout < MIN_CHECK_TIMEOUT || timeout > MAX_CHECK_TIMEOUT) {
        return {result: 'Missing the required fields!', statusCode: 400};
      }
      const checkData = {};
      required.forEach(prop => checkData[prop] = body[prop]);
      const checkID = createRandomString(TOKEN_LENGTH);
      userData.checks.push(checkID);
      checkData['checkID'] = checkID;
      checkData['phone'] = phone;
      try {
        await Promise.all([
          updateFile('users', phone, userData),
          createFile('checks', checkID, checkData)
        ]);
        return {result: 'New check created!', statusCode: 200};
      } catch (err) {
        return {result: 'Error creating new check!', statusCode: 500};
      }
    } catch (err) {
      return {result: 'Unauthenticated!', statusCode: 403};
    }
  } catch (err) {
    return {result: 'Unauthenticated!', statusCode: 403};
  }
};

const _put = async ({ body, queryParams, token }) => {
  const { checkID } = queryParams;
  try {
    const checkData = await readFile('checks', checkID);
    const { phone } = checkData;
    const tokenVerified = await verifyToken(token, phone);
    if (!tokenVerified) return {result: 'Unauthenticated!', statusCode: 403};
    const required = ['protocol', 'url', 'method', 'successCodes', 'timeout'];
    const validPayload = validatePayload(required, body);
    const { timeout } = body['timeout']; 
    if (!validPayload || timeout < MIN_CHECK_TIMEOUT || timeout > MAX_CHECK_TIMEOUT) {
      return {result: 'Missing the required fields!', statusCode: 400};
    }
    validPayload['phone'] = phone;
    validPayload['checkID'] = checkID;
    try {
      await updateFile('checks', checkID, validPayload);
      return {result: 'Check successfully updated!', statusCode: 200};
    } catch (err) {
      return {result: 'Error updating check!', statusCode: 500};
    }
  } catch (err) {
    return {result: 'Check not found!', statusCode: 404};
  }
};

const _delete = async ({ queryParams, token }) => {
  const { checkID } = queryParams;
  try {
    const checkData = await readFile('checks', checkID);
    const { phone } = checkData;
    const tokenVerified = await verifyToken(token, phone);
    if (!tokenVerified) return {result: 'Unauthenticated!', statusCode: 403};
    try {
      const userData = await readFile('users', phone);
      const index = userData.checks.indexOf(checkID);
      if (index === -1) throw new Error();
      userData.checks.splice(index, 1);
      try {
        await Promise.all([
          updateFile('users', phone, userData),
          deleteFile('checks', checkID)
        ]);
        return {result: 'Check deleted successfully!', statusCode: 200};
      } catch (err) {
        return {result: 'Error deleting check!', statusCode: 500};
      }
    } catch (err) {
      return {result: 'Unable to delete the check!', statusCode: 500};
    }
  } catch (err) {
    return {result: 'Check not found!', statusCode: 404};
  }
};

module.exports = { _get, _post, _put, _delete };