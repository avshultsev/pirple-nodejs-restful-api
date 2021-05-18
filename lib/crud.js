const fs = require('fs').promises;
const path = require('path');

const commonPath = path.join(__dirname, '..', '.data');
const createPath = (dir, fileName) => path.join(commonPath, dir, fileName);

const createFile = async (dir, fileName, data) => {
  const filePath = createPath(dir, fileName);
  try {
    const fileHandle = await fs.open(filePath, 'wx');
    try {
      await fs.writeFile(fileHandle, JSON.stringify(data));
      fileHandle.close();
    } catch (err) {
      console.log('Error writing file!', err);
    }
  } catch (err) {
    console.log('File already exists!', err);
  }
};

const readFile = async (dir, fileName) => {
  const filePath = createPath(dir, fileName);
  try {
    const fileHandle = await fs.open(filePath, 'r');
    try {
      const fileData = await fs.readFile(fileHandle, 'utf-8');
      console.log(JSON.parse(fileData)); // do smth with data
      fileHandle.close();
    } catch (err) {
      console.log('Error reading file!', err);
    }
  } catch (err) {
    console.log('Unable to read the unexisting file!', err);
  }
};

const updateFile = async (dir, fileName, data) => {
  const filePath = createPath(dir, fileName);
  try {
    const fileHandle = await fs.open(filePath, 'r+');
    try {
      await fs.writeFile(fileHandle, JSON.stringify(data));
      fileHandle.close();
    } catch (err) {
      console.log('Error updating file!', err);
    }
  } catch (err) {
    console.log('Unable to modify the unexisting file!', err);
  }
};

const deleteFile = async (dir, fileName) => {
  const filePath = createPath(dir, fileName);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.log('Error deleting file!', err);
  }
};

module.exports = { createFile, readFile, updateFile, deleteFile };