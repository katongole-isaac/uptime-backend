/**
 * Check Handler Services
 * A check - Is a task the instructs the server to go and check a given url within a couple of seconds and then responses to the user whether the url is up or down
 */

// Dependencies
const _data = require("./data");
const { validate, createRandomTokenId } = require("./util");
const config = require("../config");
const { _tokens } = require("./tokenHandlers");

const tokenDir = "tokens";
const usersDir = "users";
const checksDir = "checks";

// handler container
const handlers = {};

// acceptable method for this endpoint
const acceptableMethods = ["get", "post", "put", "delete"];

handlers.checks = (data, callback) => {
  // check if the method sent from the client is acceptable
  // if accepted go on otherwise send 405 status (Not Acceptable)
  if (acceptableMethods.indexOf(data.method) <= -1) return callback(405);

  // here proceed and call the corresponding method handler
  handlers._checks[data.method](data, callback);
};

// checks sub handlers container
handlers._checks = {};

// post sub handler
// Required fields : protocol, url, method, successCodes [Array of numbers], timeoutsecs
// Optional fields: none
handlers._checks.post = (data, callback) => {
  const acceptableProtocols = ["http", "https"];

  const {
    protocol: _protocol,
    url: _url,
    method: _method,
    successCodes: _successCodes,
    timeoutSeconds: _timeoutSeconds,
  } = data.payload;

  // protocol - either http or https
  const protocol =
    validate(_protocol) && acceptableProtocols.indexOf(_protocol) > -1
      ? _protocol
      : false;

  const url = validate(_url);

  const method =
    validate(_method) && acceptableMethods.indexOf(_method) > -1
      ? _method
      : false;

  const successCodes =
    typeof _successCodes === "object" &&
    _successCodes instanceof Array &&
    _successCodes.length > 0
      ? _successCodes
      : false;

  const timeoutSeconds =
    typeof _timeoutSeconds === "number" &&
    _timeoutSeconds >= 1 &&
    _timeoutSeconds <= config.maxChecks
      ? _timeoutSeconds
      : false;

  // if any of them is invalid
  if (!(protocol && url && method && successCodes && timeoutSeconds))
    return callback(400, {
      error: "Missing required fields or Invalid values provided",
    });

  // [auth] get the token in the headers
  const token = validate(data.headers["x-auth-token"]);

  if (!token) return callback(401, { error: "No or Invalid token provided" });

  // look up the user with a given token.
  _data.read(tokenDir, token, (err, tokenData) => {
    // if no user with a given token
    // return 403 [ forbidden ]
    if (err)
      return callback(403, {
        error: `Couln't not perform the requested task with token ${token}`,
      });

    // get the user's phone
    const userPhone = tokenData.phone;

    // read the user with the phone number above.

    _data.read(usersDir, userPhone, (err, userData) => {
      // token doesn't correspond to the user's phone.
      if (err)
        return callback(403, {
          error: `Couln't not perform the requested task with token ${token} [2]`,
        });

      // look up users' checks array
      // if no checks set it to []
      const userChecks =
        typeof userData.checks === "object" && userData.checks instanceof Array
          ? userData.checks
          : [];

      if (userChecks.length > config.maxChecks - 1)
        return callback(400, {
          error: `MAXIMUNM_CHECK_LIMIT [ ${config.maxChecks} ] EXCEED`,
        });

      // create a checkId
      const checkId = createRandomTokenId(20);

      //Model the checkObject i.e
      const checkObject = {
        id: checkId,
        protocol,
        url,
        phone: userData.phone,
        successCodes,
        method,
        timeoutSeconds,
      };

      // save the checkObject to checks directory
      _data.create(checksDir, checkId, checkObject, (err) => {
        if (err) {
          console.log("[Creating Checks] Error", err);
          return callback(500, { error: "Couldn't create a new check " });
        }

        // Add the checkId to the user's checks array;
        userData.checks = [...userChecks];

        userData.checks.push(checkId);

        // update the user
        _data.update(usersDir, userData.phone, userData, (err) => {
          if (err) {
            console.log(`[Updating User's checks ] Error: `, err);
            return callback(500, {
              error: "Couldn't update the user's checks ",
            });
          }

          callback(200, checkObject);
        });
      });
    });
  });
};

// get sub handler
// Required data : checkId
//Optional data: none
handlers._checks.get = (data, callback) => {
  const checkId = validate(data.queryStringObject.id, 20);

  if (!checkId) return callback(400, { error: "Missing required fields" });

  //look up checkId
  _data.read(checksDir, checkId, (err, checkData) => {
    if (err) return callback(404);

    //get the x-auth-token
    const token = data.headers["x-auth-token"];

    // verify token
    // And check whether phone is associated with the given token.

    if (!token) return callback(401, { error: "No or Invalid token given " });

    _tokens.verifyToken(token, checkData.phone, (isVerified) => {
      if (!isVerified)
        return callback(403, {
          error: "Invalid token or Need to set x-auth-token header",
        });

      callback(200, checkData);

      //end of verifyToken
    });
  });
};

// put sub handler
// Required: checkId
//Optional: protocol, url, successCodes, mehtod, timeoutSeconds (one must be set);
handlers._checks.put = (data, callback) => {
  const checkId = validate(data.payload.id, 20);

  // grab optional data
  const acceptableProtocols = ["http", "https"];

  const {
    protocol: _protocol,
    url: _url,
    method: _method,
    successCodes: _successCodes,
    timeoutSeconds: _timeoutSeconds,
  } = data.payload;

  // protocol - either http or https
  const protocol =
    validate(_protocol) && acceptableProtocols.indexOf(_protocol) > -1
      ? _protocol
      : false;

  const url = validate(_url);

  const method =
    validate(_method) && acceptableMethods.indexOf(_method) > -1
      ? _method
      : false;

  const successCodes =
    typeof _successCodes === "object" &&
    _successCodes instanceof Array &&
    _successCodes.length > 0
      ? _successCodes
      : false;

  const timeoutSeconds =
    typeof _timeoutSeconds === "number" &&
    _timeoutSeconds >= 1 &&
    _timeoutSeconds <= config.maxChecks
      ? _timeoutSeconds
      : false;

  if (!checkId)
    return callback(400, {
      error: "Missing required fields or Invalid checkId",
    });

  //check if one eof the optional data is set.
  if (protocol || url || method || successCodes || timeoutSeconds) {
    // read the checkId
    _data.read(checksDir, checkId, (err, checkData) => {
      if (err) return callback(404);

      // authenticate using token
      const token = data.headers["x-auth-token"];

      if (!token) return callback(401, { error: "No or Invalid token sent" });

      _tokens.verifyToken(token, checkData.phone, (isVerified) => {
        if (!isVerified)
          return callback(403, {
            error: "Couldn't perform the requested task",
          });

        // update checkData accordingly
        checkData.protocol = !protocol ? checkData.protocol : protocol;

        checkData.url = !url ? checkData.url : url;
        checkData.timeoutSeconds = !timeoutSeconds
          ? checkData.timeoutSeconds
          : timeoutSeconds;
        checkData.method = !method ? checkData.method : method;
        checkData.successCodes = !successCodes
          ? checkData.successCodes
          : successCodes;

        // update checkData
        _data.update(checksDir, checkId, checkData, (err) => {
          if (err) {
            console.log(`[Updating Check Data] Error ${err}`);
            return callback(500, { error: "Couldn't update the check Data" });
          }

          callback(200, checkData);
        });
      });
    });
  } else {
    return callback(400, {
      error:
        "Missing required fields, atleast send one of the Optional check data",
    });
  }
};

// delete sub handler
handlers._checks.delete = (data, callback) => {
  // getting phone field from a querystring
  const checkId = validate(data.queryStringObject.id, 20);

  if (!checkId) return callback(400, { error: "Missing required fields" });

  // look the check
  _data.read(checksDir, checkId, (err, checkData) => {
    if (err) return callback(404);

    // get the token from headers
    const token = data.headers["x-auth-token"];

    if (!token) return callback(401);

    const userPhone = checkData.phone;

    _tokens.verifyToken(token, userPhone, (isVerified) => {
      if (!isVerified)
        return callback(403, {
          error: "Invalid token or Need to set x-auth-token header",
        });

      // delete the check with checkId
      _data.delete(checksDir, checkId, (err) => {
        if (err) {
          console.log(`[Deleting Check] Error ${err}`);
          return callback(500, {
            error: `Couldn't delete check with id: ${checkId}`,
          });
        }

        // try to read
        // if the user exist with that checkid, you can delete
        //otherwise return 500
        _data.read(usersDir, userPhone, (err, userData) => {
          if (err)
            return callback(500, {
              error: `Couldn't find a user with checkId: ${checkId}`,
            }); // file not found;

          // get the user's checks
          const userChecks =
            typeof userData.checks === "object" &&
            userData.checks instanceof Array
              ? userData.checks
              : [];

          // look up the checkID in the user's check array.
          const checkIndex = userChecks.indexOf(checkId);

      
            // if the checkId doesn't exist
            // in the user's check array
            // return 500
          if (!(checkIndex > -1))
            return callback(500, {
              error: `Couln't find the checkid ${checkId} in the user's checks`,
            });

          // if its there
          // remove it

          userChecks.splice(checkIndex, 1);

          // now update the user's check

          _data.update(usersDir, userPhone, userData, (err) => {
            if (err) {
              console.log("[Updating User's Checks] Error: ", err);
              return callback(500, {
                error: `Couldn't update the user's checks`,
              });
            }

            // everything ok here
            callback(200);
          });
        });
      });

      // end of verifyToken
    });
  });
};

module.exports = handlers;
