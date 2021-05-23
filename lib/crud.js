const { promises: fs, createWriteStream, createReadStream } = require('fs');
const path = require('path');

const commonPath = path.join(__dirname, '..', '.data');
const createPath = (dir, fileName) => path.join(commonPath, dir, fileName);

const rename = async (dir, oldName, newName) => {
  const filePath = createPath(dir, oldName);
  const newFilePath = createPath(dir, newName);
  try {
    const fileHandle = await fs.open(newFilePath, 'wx');
    try {
      await fs.rename(filePath, newFilePath);
    } catch (err) {
      throw new Error(err);
    } finally {
      fileHandle.close();
    }
  } catch (err) { // if file exists
    throw new Error(err);
  }
};

const writeToFile = (flag = 'w') => async (dir, fileName, data) => {
  const filePath = createPath(dir, fileName);
  const jsonData = JSON.stringify(data);
  try {
    await fs.writeFile(filePath, jsonData, { flag });
  } catch (err) {
    throw new Error(err);
  }
};

const createFile = writeToFile('wx');
const updateFile = writeToFile();

const readFile = async (dir, fileName) => {
  const filePath = createPath(dir, fileName);
  try {
    const fileHandle = await fs.open(filePath, 'r');
    try {
      const fileData = await fs.readFile(fileHandle, 'utf-8');
      return JSON.parse(fileData);
    } catch (err) {
      console.log('Error reading file!', err);
    } finally {
      fileHandle.close();
    }
  } catch (err) { // if file does not exist
    throw new Error(err);
  }
};

const deleteFile = async (dir, fileName) => {
  const filePath = createPath(dir, fileName);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    throw new Error(err);
  }
};

module.exports = { createFile, readFile, updateFile, deleteFile, rename };