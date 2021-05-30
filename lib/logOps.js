const { promises: fs, createReadStream, createWriteStream } = require('fs');
const path = require('path');
const { pipeline }   = require('stream');
const { promisify }  = require('util');
const { createGzip, createGunzip } = require('zlib');

const commonPath = path.join(__dirname, '..', '.logs');
const createCheckPath = (fileName) => path.join(commonPath, 'checks', fileName);

const listCheckLogs = async (includeZipped) => {
  const dirPath = createCheckPath('');
  try {
    const logs = await fs.readdir(dirPath);
    if (includeZipped) return logs;
    return logs.filter(log => log.endsWith('.log'));
  } catch (err) {
    throw new Error(err);
  }
};

const appendLog = async (fileName, data) => {
  const filePath = createCheckPath(`${fileName}.log`);
  const strData = JSON.stringify(data) + '\n';
  try {
    await fs.appendFile(filePath, strData);
  } catch (err) {
    throw new Error(err);
  }
};

const truncate = async (filePath) => {
  try {
    await fs.truncate(filePath, 0);
  } catch (err) {
    throw new Error(err);
  }
};

const compressLog = async (fileName) => {
  const dotIdx = fileName.indexOf('.');
  const checkID = fileName.substring(0, dotIdx);
  const compressedFileName = checkID + '-' + Date.now();
  const pipe = promisify(pipeline);
  const gzip = createGzip();
  const oldPath = createCheckPath(fileName);
  const newPath = createCheckPath(`${compressedFileName}.gz.b64`);
  const input = createReadStream(oldPath);
  const output = createWriteStream(newPath, { encoding: 'base64' });
  await Promise.all([
    pipe(input, gzip, output),
    truncate(oldPath),
  ]);
};

const decompressLog = async (fileName) => {
  const pipe = promisify(pipeline);
  const gunzip = createGunzip();
  const dashIndex = fileName.indexOf('-');
  const unzippedFileName = 'unzipped-' + fileName.substring(0, dashIndex);
  const zippedFilePath = createCheckPath(fileName);
  const unzippedFilePath = createCheckPath(`${unzippedFileName}.log`);
  const input = createReadStream(zippedFilePath);
  const output = createWriteStream(unzippedFilePath);
  await pipe(input, gunzip, output);
};

module.exports = { listCheckLogs, appendLog, compressLog, decompressLog };