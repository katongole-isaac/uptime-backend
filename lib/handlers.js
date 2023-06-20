/**
 * Handlers for the API endpoints
 *
 */

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const { validate } = require("./util");
const { _tokens } = require("./tokenHandlers");

const usersDir = "users";
const checksDir = "checks";

// handlers
const handlers = {};

//Ping handler
handlers.ping = function (data, callback) {
  // callback a statuscode and the payload object.
  callback(200);
};

// Not found
handlers.notFound = function (data, callback) {
  callback(404);
};

// Users handlers

handlers.users = (data, callback) => {
  // acceptable method for this endpoint
  const acceptableMethods = ["get", "post", "put", "delete"];

  // check if the method sent from the client is acceptable
  // if accepted go on otherwise send 405 status (Not Acceptable)
  if (acceptableMethods.indexOf(data.method) <= -1) return callback(405);

  // here proceed and call the corresponding method handler
  handlers._users[data.method](data, callback);
};

// users sub handlers container
handlers._users = {};

handlers._users.post = (data, callback) => {
  const {
    firstName: firstname,
    lastName: lastname,
    phone: telPhone,
    password: passwd,
    tosAgreement: tosAgree,
  } = data.payload;

  // validating the payload
  const firstName = validate(firstname);
  const lastName = validate(lastname);
  const phone = validate(telPhone, 10);
  const password = validate(passwd);
  const tosAgreement = typeof tosAgree === "boolean" && tosAgree ? true : false;

  const allFieldsValid =
    firstName && lastName && phone && password && tosAgreement;

  // if some fields are missing then set status code = 400 (bad request)
  if (!allFieldsValid)
    return callback(400, { error: " Missing required fields." });

  // do auth(verify token) first
  // check whether the user exist
  // users are uniquely identified by phone.
  // All users are stored in /.data/users/...

  _data.read(usersDir, phone, (err, data) => {
    // if no error, then the user exists
    if (!err)
      return callback(400, {
        error: `User with this phone No: ${phone} already exist`,
      });

    //hash the password
    const hashedPassword = helpers.hash(password);

    if (typeof hashedPassword !== "string")
      return callback(500, { error: "Couldn't hash the user's password" });

    // user object to be stored
    const userObject = {
      firstName,
      lastName,
      phone,
      password: hashedPassword,
      tosAgreement,
    };

    // store the user
    _data.create(usersDir, phone, userObject, (err) => {
      if (err) {
        console.log("Logging Error: ", err);
        callback(500, {
          error: `Could not create a  new user with this phone: ${phone}`,
        });

        return;
      }

      // everything is ok
      // user created.
      callback(200);
    });
  });
};

// get sub handler
handlers._users.get = (data, callback) => {
  // getting phone field from a querystring
  const phone = validate(data.queryStringObject.phone, 10);

  if (!phone) return callback(400, { error: "Missing required fields" });

  // get the token from headers
  const token = data.headers["x-auth-token"];

  _tokens.verifyToken(token, phone, (isVerified) => {
    if (!isVerified)
      return callback(403, {
        error: "Invalid token or Need to set x-auth-token header",
      });

    // read file with [ phone ] as its filename
    _data.read(usersDir, phone, (err, data) => {
      // remove password field on the retrieved data
      // so you dont send it
      delete data.password;

      // if err that means the file doesn't exist
      if (err) return callback(404);

      callback(200, data);
    });

    //end of verifyToken
  });
};

// put sub handler
handlers._users.put = (data, callback) => {
  // getting phone field from a payload [required]
  // Optional firstname, lastname, password

  const phone = validate(data.payload.phone, 10);

  if (!phone) return callback(400, { error: "Missing required fields" });

  // get the token from headers
  const token = data.headers["x-auth-token"];

  _tokens.verifyToken(token, phone, (isVerified) => {
    if (!isVerified)
      return callback(403, {
        error: "Invalid token or Need to set x-auth-token header",
      });

    const {
      firstName: firstname,
      lastName: lastname,
      password: passwd,
    } = data.payload;

    // validating the payload
    const firstName = validate(firstname);
    const lastName = validate(lastname);
    const password = validate(passwd);

    // update if a payload has atleast one optional field
    if (firstName || lastName || password) {
      // read the file
      _data.read(usersDir, phone, (err, userData) => {
        // if the file is not found then 404 is sent
        if (err) return callback(404);

        // updating the userData in memory

        userData.firstName = !firstName ? userData.firstName : firstName;

        userData.lastName = !lastName ? userData.lastName : lastName;

        userData.password = !passwd ? userData.password : helpers.hash(passwd);

        // write the above updates to the disk

        _data.update(usersDir, phone, userData, (err) => {
          // if everything is ok
          if (!err) {
            // dont send the password field
            delete userData.password;

            return callback(200, userData);
          }

          console.log("[Updating ] Error: ", err);

          callback(500, {
            error: `Couldn't update the user with phone No: ${phone}`,
          });

          return;
        });
      });
    }
    // if all these are missing
    else return callback(400, { error: "Missing fields to update " });

    // end of verifyToken
  });
};

// handler for deleting user
handlers._users.delete = (data, callback) => {
  // getting phone field from a querystring
  const phone = validate(data.queryStringObject.phone, 10);

  if (!phone) return callback(400, { error: "Missing required fields" });

  // get the token from headers
  const token = data.headers["x-auth-token"];

  _tokens.verifyToken(token, phone, (isVerified) => {
    if (!isVerified)
      return callback(403, {
        error: "Invalid token or Need to set x-auth-token header",
      });

    // try to read
    // if the file exist , you can delete
    //otherwise return 404
    _data.read(usersDir, phone, (err, userData) => {
      if (err)
        return callback(404, {
          error: `Couldn't find a user with phone No: ${phone}`,
        }); // file not found;

      _data.delete(usersDir, phone, (err) => {
        if (err) {
          console.log("[Deleting] Error: ", err);
          return callback(500, {
            error: `Couldn't delete the user with phone No: ${phone}`,
          });
        }

        // find and delete all the checks assocaited with this user.
        const userChecks =
          typeof userData.checks === "object" &&
          userData.checks instanceof Array
            ? userData.checks
            : [];

        // noting to delete
        if (!(userChecks.length > 0)) return callback(200);

        // delete checks
        let deleteCount = 0;
        let deleteErrors = false;
        const checksToDelete = userChecks.length;

        for (let checkId of userChecks) {
          // delete the check now
          _data.delete(checksDir, checkId, (err) => {
            if (err) {
              deleteErrors = true;
            }

            ++deleteCount;

            if (deleteCount === checksToDelete) {
              if (deleteErrors) {
                console.log("[Deleting All User's checks]", err);
                return callback(500, {
                  error: `Failed to delete a check with id ${checkId} from user's checks`,
                });
              }

              // everything ok here
              callback(200, { msg: `Deleted ${deleteCount} checks` });
            }
          });
        }
      });
    });

    // end of verifyToken
  });
};

module.exports = handlers;
