/**
 * Library for working with app data.
 *
 */

const fs = require("node:fs");
const path = require("node:path");

const helpers = require("./helpers");

// container
const lib = {};

//baseDirectory for data
lib.baseDir = path.join(__dirname + `/../.data/`);

// creating a file
lib.create = (dir, file, data, callback) => {
  const filepath = `${lib.baseDir}${dir}/${file.trim()}.json`;

  // for logging purposes [ message just for the client ]
  let filepathInMsg = `/.data/${dir}/${file}`;

  fs.open(filepath, "wx", (err, fd) => {
    if (err)
      return callback(
        `[ Maybe the file exists ] An error occurred when creating file at ${filepathInMsg}`
      );

    const stringData = JSON.stringify(data);

    fs.writeFile(fd, stringData, (err) => {
      if (err)
        return callback(
          `An error occurred when writing to a file at ${filepathInMsg}`
        );

      fs.close(fd, (err) => {
        if (err)
          return callback(
            `An error occurred when closing the file at ${filepathInMsg}`
          );

        callback(false);
      });
    });
  });
};

// reading file
lib.read = (dir, file, callback) => {
  const filepath = `${lib.baseDir}${dir}/${file.trim()}.json`;

  // for logging purposes [ message just for the client ]
  let filepathInMsg = `/.data/${dir}/${file}`;

  // getting the stats for the file [ used  in determine the file size ]
  fs.stat(filepath, (err, stats) => {
    if (err)
      return callback(
        `An occurred in an attempt of getting stats for the file for read operation at ${filepathInMsg}`
      );

    //open the file

    fs.open(filepath, "r", (err, fd) => {
      if (err)
        return callback(
          `An error occurred when opening the file at ${filepathInMsg}`
        );

      // Allocating buffer of size <stats.size> [ file size in bytes ]
      const buffer = Buffer.alloc(stats.size);

      // perform a read
      fs.read(fd, buffer, 0, buffer.length, null, (err, bytesRead, buffer) => {
        if (err)
          return callback(
            `An error occurred when reading data file at ${filepathInMsg}`
          );

        // closing the file

        fs.close(fd, (err) => {
          if (err)
            return callback(
              `An error occurred when closing the file at ${filepathInMsg}`
            );

          console.log("Bytes read: ", bytesRead);

          // we're returning a valid JSON object
          const parsedData = helpers.parsedJsonToObject(buffer.toString());

          callback(false, parsedData);
        });
      });
    });
  });
};

//updating file
lib.update = (dir, file, data, callback) => {
  const filepath = `${lib.baseDir}${dir}/${file.trim()}.json`;

  // for logging purposes [ message just for the client ]
  let filepathInMsg = `/.data/${dir}/${file}.json`;

  // open the file
  fs.open(filepath, "r+", (err, fd) => {
    if (err)
      return callback(
        `[ Maybe the file exists ] An error occurred when creating file at ${filepathInMsg}`
      );

    // truncating the file
    fs.truncate(filepath, (err) => {
      if (err)
        return callback(
          `An occurred when truncating the file at ${filepathInMsg}`
        );

      const stringData = JSON.stringify(data);

      fs.writeFile(fd, stringData, (err) => {
        if (err)
          return callback(
            `An error occurred when writing to a file at ${filepathInMsg}`
          );

        fs.close(fd, (err) => {
          if (err)
            return callback(
              `An error occurred when closing the file at ${filepathInMsg}`
            );
          callback(false);
        });
      });
    });
  });
};

// Deleting file
lib.delete = (dir, file, callback) => {
  const filepath = `${lib.baseDir}${dir}/${file}.json`;

  // for logging purposes [ message just for the client ]
  let filepathInMsg = `/.data/${dir}/${file}.json`;

  fs.unlink(filepath, (err) => {
    if (err)
      return callback(
        `An error occurred when deleting the file at ${filepathInMsg}`
      );

    callback(false);
  });
};

// lisiting directory
lib.list = (dir, callback) => {
  const dirPath = `${lib.baseDir}/${dir}`;

  fs.readdir(dirPath, (err, data) => {
    if (err) {
      console.log(`[Lising Files] Error`, err);
      return callback(err, data);
    }

    if (data && data.length > 0) {
      const trimmedFilePath = data.map((fileNames) =>
        fileNames.replace(".json", "")
      );

      callback(false, trimmedFilePath);
      return;
      
    }
  });
};

//export
module.exports = lib;
