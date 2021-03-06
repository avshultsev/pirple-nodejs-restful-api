const { listItems, readFile, updateFile } = require('./crud.js');
const { sendTwilioSms } = require('./utils.js');
const http = require('http');
const https = require('https');
const { CHECKS_INTERVAL, COMPRESSION_INTERVAL } = require('./constants.js');
const { appendLog, listCheckLogs, compressLog } = require('./logOps.js');

const log = async (logData) => {
  const logName = logData.newCheckData.checkID;
  try {
    await appendLog(logName, logData);
  } catch (err) {
    console.log(`Error appending log for check ${logName}!`);
  }
};

const alertUser = (data) => {
  const { method, protocol, url, isUp, phone } = data;
  const message = `Alert! Your check for ${method.toUpperCase()} ${protocol}://${url} is now ${isUp ? 'up' : 'down'}`;
  sendTwilioSms(phone, message, (successfulReq) => {
    if (!successfulReq) console.log('Error requesting Twilio API!');
  });
};

const processCheckOutcome = async (data, outcome) => {
  const { lastChecked, isUp, successCodes, checkID } = data;
  const { error, responseCode } = outcome;
  const state = !error && successCodes.includes(responseCode);
  const alertWarranted = (isUp !== state) || !lastChecked;
  const newCheckData = {...data, isUp: state, lastChecked: Date.now()};
  try {
    await log({ newCheckData, outcome, alertWarranted });
  } catch (err) {
    console.log(`Error logging check file ${data.checkID}!\n`, err);
  }
  try {
    await updateFile('checks', checkID, newCheckData);
    if (alertWarranted) alertUser(newCheckData);
  } catch (err) {
    console.log(`Error updating check file ${checkID}! User alert was not sent.\n`, err);
  }
};

const performCheck = (data) => {
  const { protocol, url, method, timeout } = data;
  let outcomeSent = false;
  const checkOutcome = {
    'error': null,
    'responseCode': 0,
  };
  const urlObj = new URL(`${protocol}://${url}`);
  const { hostname, pathname } = urlObj;
  const options = {
    protocol: protocol + ':',
    hostname,
    method: method.toUpperCase(),
    path: pathname,
    timeout: timeout * 1000,
  };
  const lib = protocol === 'http' ? http : https;
  const req = lib.request(options, (res) => {
    checkOutcome.responseCode = res.statusCode;
    if (!outcomeSent) {
      processCheckOutcome(data, checkOutcome);
      outcomeSent = true;
    }
  });
  req.on('error', (err) => {
    checkOutcome.error = err;
    if (!outcomeSent) {
      processCheckOutcome(data, checkOutcome);
      outcomeSent = true;
    }
  }).on('timeout', () => {
    checkOutcome.error = {'error' : 'timeout'};
    if (!outcomeSent) {
      processCheckOutcome(data, checkOutcome);
      outcomeSent = true;
    }
  });
  req.end();
};

const gatherAllChecks = async () => {
  try {
    const checks = await listItems('checks');
    const readCheckFile = readFile.bind(null, 'checks');
    for (const check of checks) {
      const checkData = await readCheckFile(check);
      checkData.isUp = checkData.isUp || false;
      checkData.lastChecked = checkData.lastChecked || 0;
      performCheck(checkData);
    }
  } catch (err) {
    throw new Error(err);
  }
};

const compressLogs = async () => {
  try {
    const logs = await listCheckLogs(false);
    try {
      logs.forEach(compressLog);
    } catch (err) {
      console.log('Error compressing check logs!\n', err);
    }
  } catch (err) {
    console.log(`Error listing check logs!\n`, err);
  }
};

module.exports = () => {
  gatherAllChecks();
  setInterval(gatherAllChecks, CHECKS_INTERVAL * 1000);
  compressLogs();
  setInterval(compressLogs, 1000 * 60 * 60 * COMPRESSION_INTERVAL);
};