/**
 * Helper functions for various tasks
 *
 */

//
const crypto = require("node:crypto");
const querystring = require('node:querystring');
const https = require('https');

const utils = require("./util");
const config = require("../config");


const helpers = {};

helpers.hash = (password) => {
  // validate password
  if (!utils.validate(password)) return false;

  // hash password using sha256
  // we're returning the hash for the password
  return crypto
    .createHmac("sha256", config.hashingSecret)
    .update(password)
    .digest("hex");
};

// parsedToObject
// it should return and empty object {} on error when parsing the input otherwise return that object.
helpers.parsedJsonToObject = (buffer) => {
  try {
    return JSON.parse(buffer);
  } catch (error) {
    return {};
  }
};

helpers.createToken = (phone) => {
  // expires - token expires in 1 hour future.

  const token = {
    phone,
    id: utils.createRandomTokenId(20),
    expires: Date.now() + 1000 * 60 * 60,
  };

  
  return token;
};


// send a msg to twilio
helpers.sendTwilioSms = (phoneNumber, message, callback) => {

  const phone = utils.validate(phoneNumber);
  const msg = utils.validate(message, 1600);

  if( !phone && !msg ) return callback({error: "Invalid phone number or message is missing"});

  // create the payload
  const payload = {
    from : config.twilio.fromPhone,
    to: phoneNumber ,
    body: msg
  }

  // use querystring module to craft a body [x-www-form-urlencoded]
  const stringifiedPayload = querystring.stringify(payload);

  // request details
  const requestDetails = {
    protocol :"https:",
    hostname: "api.twilio.com",
    method: "POST",
    path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
    auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
    headers: {
      'Content-Type': "application/x-www-form-urlencoded",
      'Content-Length': Buffer.byteLength(stringifiedPayload)
    }
  }

  // create a request 
  const req = https.request(requestDetails, (res) => {
    // execute in presence of response
    const status = res.statusCode;

    if( status === 200 || status === 201) return callback(false);

    callback({status});
  });

  // Bind to an error event 
  // to avoid throwning error or terminate the thread
  req.on('error', (err)=> {
    callback(err);
  })


  // add the payload to the request
  req.write(stringifiedPayload);

  req.end(()=>console.log(`[${new Date().toLocaleString()}] Request Sent`));

}


// helpers.sendTwilioSms("+256705465771", "Hi isaac, this is a message from twilio", (err)=> {
//   console.log(`Error: `,err);
// })



module.exports = helpers;
