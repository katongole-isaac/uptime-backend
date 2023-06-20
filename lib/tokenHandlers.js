/**
 * Handler for tokens
 *
 */

// Dependencies
const { validate } = require("./util");
const _data = require("./data");
const helpers = require("./helpers");

// handler container
const handlers = {};

// token dir
const tokenDir = "tokens";
const usersDir = "users";

handlers.tokens = (data, callback) => {
  // acceptable method for this endpoint
  const acceptableMethods = ["get", "post", "put", "delete"];

  // check if the method sent from the client is acceptable
  // if accepted go on otherwise send 406 status (Not Acceptable)
  if (acceptableMethods.indexOf(data.method) <= -1) return callback(405);

  // here proceed and call the corresponding method handler
  handlers._tokens[data.method](data, callback);
};

// tokens subhandlers.

handlers._tokens = {};

// post sub handler
// Required data: phone & password
handlers._tokens.post = (data, callback) => {
  const phone = validate(data.payload.phone, 10);
  const password = validate(data.payload.password);

  if (!phone && !password)
    return callback(400, { error: "Missing required fields" });

  // uplook a user with phone no
  _data.read(usersDir, phone, (err, userData) => {
    if (err)
      return callback(404, {
        error: `Couln't find a user with phone No: ${phone}`,
      });

    // check whether password do match
    // otherwise return 400
    if (userData.password !== helpers.hash(password))
      return callback(400, {
        error: `Invalid password for this user ${phone}`,
      });

    // everything is ok here
    // create a token for this user
    const token = helpers.createToken(phone);

    _data.create(tokenDir, token.id, token, (err) => {
      if (err) {
        console.log("[Creating Token] Error:", err);
        return callback(500, {
          error: `Couldn't create token for this phone No ${phone}`,
        });
      }

      callback(200, token);
    });
  });
};

// get sub handler
// required: tokenId
//Optional data: none
handlers._tokens.get = (data, callback) => {
  // getting phone field from a querystring
  const tokenId = validate(data.queryStringObject.id, 20);

  if (!tokenId) return callback(400, { error: "Missing required fields" });

  // read file with [ phone ] as its filename
  _data.read(tokenDir, tokenId, (err, tokenData) => {
    // if err that means the file doesn't exist
    if (err)
      return callback(404, {
        error: `Couldn't find the token with token id: ${tokenId}`,
      });

    callback(200, tokenData);
  });
};

// put sub handler
// the user should be able extend the expires time
//Required field tokenId & extend=true

handlers._tokens.put = (data, callback) => {
  const { id, extend: isExtend } = data.payload;

  const tokenId = validate(id, 20);
  const extend =
    typeof isExtend === "boolean" && isExtend === true ? true : false;

  if (!(tokenId && extend))
    return callback(400, { error: "Missing required field(s) or Invalid" });

  // such for the tokenId
  _data.read(tokenDir, tokenId, (err, tokenData) => {
    if (err)
      return callback(404, {
        error: `Couldn't find the token with token id: ${tokenId}`,
      });

    // check whether the token is still valid [not expired] i.e
    if (!tokenData.expires > Date.now())
      return callback(400, {
        error: "Token  already expired. Need to generate a new token",
      });

    // extend the expires 1 hr in future.
    tokenData.expires = Date.now() + 1000 * 60 * 60;

    // saves the changes
    _data.update(tokenDir, tokenId, tokenData, (err) => {
      if (err) {
        console.log("[Updating token] Error: ", err);

        return callback(500, {
          error: `Couldn't update the token with Id: ${tokenId}`,
        });
      }

      callback(200, tokenData);
    });
  });
};

// delete sub handler
// required field: tokenId
handlers._tokens.delete = (data, callback) => {
  const tokenId = validate(data.queryStringObject.id, 20);

  if (!tokenId)
    return callback(400, {
      error: "Missing required field(s) or Invalid token Id",
    });

  // check whether the tokenId exists
  _data.read(tokenDir, tokenId, (err, tokenData) => {
    if (err)
      return callback(404, {
        error: `Couldn't find a token with id: ${tokenId}`,
      });

    // go on an unlink the token file with tokenId
    _data.delete(tokenDir, tokenId, (err) => {
      if (err) {
        console.log(`[Deleting Token] Error: ${err} `);
        callback(500, { error: `Couldn't delete a token with id: ${tokenId}` });
        return;
      }

      callback(200);
    });
  });
};

handlers._tokens.verifyToken = (tokenId, phoneNumber, callback) => {
  const phone = validate(phoneNumber, 10);
  const token = validate(tokenId, 20);

  // check if all valid
  if (!(phone && token)) return callback(false);

  _data.read(tokenDir, tokenId, (err, tokenData) => {
    if (err) return callback(false);

    // check if the tokenData.phone === phone given
    if (tokenData.phone !== phone) return callback(false);

    // everything is fine
    // verified
    callback(true);
  });
};

module.exports = handlers;
