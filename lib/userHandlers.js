const { createFile, readFile, updateFile, deleteFile } = require('./crud.js');
const { toHash } = require('./utils.js');


const _get = async ({ queryParams }) => {
  const { phone } = queryParams;
  if (phone.length < 7) return {result: 'Missing required field!', statusCode: 400};
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

const _put = async () => {};
const _delete = async () => {};

module.exports = { _get, _post, _put, _delete };