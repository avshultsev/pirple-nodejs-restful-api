const { createFile, readFile, updateFile, deleteFile, rename } = require('./crud.js');
const { toHash } = require('./utils.js');

const _get = async ({ queryParams }) => {
  const { phone } = queryParams;
  try {
    const result = await readFile('users', `${phone}.json`);
    return {result, statusCode: 200};
  } catch (err) {
    console.log(err);
    return {result: 'User not found!', statusCode: 404}
  }
};

const _post = async ({ body }) => {
  const required = ['firstName', 'lastName', 'phone', 'password', 'tosAgreement'];
  for (const prop of required) {
    if (!body[prop]) return {result: 'Missing required fields!', statusCode: 400};
  }
  const { phone, password } = body;
  if (phone.length < 7) return {result: 'Phone number too short!', statusCode: 400}; // f. ex. 7, could be any other value
  const data = {...body};
  const hashedPassword = toHash(password);
  data.password = hashedPassword;
  try {
    const result = await createFile('users', `${phone}.json`, data);
    return {result, statusCode: 200};
  } catch (err) {
    console.log(err);
    return {result: 'User already exists!', statusCode: 500};
  }
};

const _put = async ({ body, queryParams }) => {
  const { phone } = queryParams;
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
};

const _delete = async ({ queryParams }) => {
  const { phone } = queryParams;
  try {
    await deleteFile('users', `${phone}.json`);
    return {result: 'File deleted successfully!', statusCode: 200};
  } catch (err) {
    console.log(err);
    return {result: 'User not found!', statusCode: 404};
  }
};

module.exports = { _get, _post, _put, _delete };