/**
 * Logging lib
 *
 */

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const baseLogsDir = path.join(__dirname, "/../.logs");

const log = (file, value, callback) => {
  const filePath = `${baseLogsDir}/${file}.log`;
  // open the file for append operation
  fs.open(filePath, "a", (err, fd) => {
    if (err)
      return callback({
        error: "[Logging] Couldn't open the log file for append operations",
      });

    const stringValue = `${JSON.stringify(value)}\n`;

    // appending to file
    fs.appendFile(fd, stringValue, (err) => {
      if (err)
        return callback({
          error: "[Logging] Couldn't append to the log file.",
        });

      // evrything okay
      callback(false);
    });
  });
};

// list logs , optionally include compressed logs
const listLogs = (includeCompressedLogs, callback) => {
  //
  fs.readdir(baseLogsDir, (err, logs) => {
    if (err) return callback(err, data);

    const trimmedLogFiles = [];

    logs.forEach((log) => {
      if (log.indexOf(".log") > -1)
        trimmedLogFiles.push(log.replace(".log", ""));

      if (log.indexOf(".gz.b64") > -1 && includeCompressedLogs)
        trimmedLogFiles.push(log.replace(".gz.b64", ""));

      callback(false, trimmedLogFiles);
    });
  });
};

// compress
const compress = (logId, newLogId, callback) => {
  const srcFile = `${logId}.log`;
  const dstFile = `${newLogId}.gz.b64`;

  const filePath = `${baseLogsDir}/${srcFile}`;

  // reading the src file
  fs.readFile(filePath , "utf8", (err, data) => {
    if (err) return callback(err);

    // now you've the data to be compressed
    // use zlib lib
    zlib.gzip(data, (err, buffer) => {
      if (err) return callback(err);

      // save the compressed data
      fs.open(`${baseLogsDir}/${dstFile}`, "wx", (err, fd) => {
        if (err) return callback(err);

        // saving buffer as base64 file format
        fs.writeFile(fd, buffer.toString("base64"), (err) => {
          if (err) return callback(err);

          callback(false);
        });
      });
    });
  });
};

const decompress = (fileId, callback) => {
  const filePath = `${baseLogsDir}/${fileId}.gz.b64`;

  fs.readFile(filePath, "utf-8", (err, buffer) => {
    if (err) return callback(err);

    const inputBuffer = Buffer.from(buffer, "base64");
    zlib.unzip(inputBuffer, (err, outputBuffer) => {
      if (err) return callback(err);

      callback(false, outputBuffer.toString());
    });
  });
};

// truncating the logfiles.log
const truncate = (logId, callback) => {
  const filePath = `${baseLogsDir}/${logId}.log`;
  fs.truncate(filePath, 0, (err) => {
    if (err) return callback(err);

    callback(false);
  });
};

// rotates (compress) the logs
const rotateLogs = () => {
  listLogs(false, (err, logs) => {
    if (err) return console.log(`[Logging] Error: No Logs to rotate`);

    logs.forEach((log) => {
      console.log('Lists: Log', log)
      const logId = log.replace(".log", "");
      const newLogId = `${logId}_${Date.now()}`;

      compress(logId, newLogId, (err) => {
        if (err)
          return console.log(
            `[Logging] Error: Compressing one of the log file`,
            err
          );

        // truncate the original log
        truncate(logId, (err) => {
          if (err) return console.log(`[Logging] Error: Truncating Log File`);

          console.log(`Success: Log file truncated`);
        });
      });
    });
  });
};

// Runs every after 24 hrs or 1day
const rotateLogsLoop = () => {
  setInterval(() => {
    rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

const logger = {
  log,
  init: () => {
    rotateLogsLoop();
  },
};

module.exports = logger;
