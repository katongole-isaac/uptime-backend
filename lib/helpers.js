/**
 * Helper functions for various tasks
 *
 */

//
const crypto = require("node:crypto");
const querystring = require('node:querystring');
const https = require("node:https");
const path = require("node:path");
const fs = require("node:fs");

const utils = require("./util");
const config = require("../config");

// template's root
const baseTemplateDir = path.join(__dirname, "/../templates");

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

  if (!phone && !msg)
    return callback({ error: "Invalid phone number or message is missing" });

  // create the payload
  const payload = {
    from: config.twilio.fromPhone,
    to: phoneNumber,
    body: msg,
  };

  // use querystring module to craft a body [x-www-form-urlencoded]
  const stringifiedPayload = querystring.stringify(payload);

  // request details
  const requestDetails = {
    protocol: "https:",
    hostname: "api.twilio.com",
    method: "POST",
    path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
    auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringifiedPayload),
    },
  };

  // create a request
  const req = https.request(requestDetails, (res) => {
    // execute in presence of response
    const status = res.statusCode;

    if (status === 200 || status === 201) return callback(false);

    callback({ status });
  });

  // Bind to an error event
  // to avoid throwning error or terminate the thread
  req.on("error", (err) => {
    callback(err);
  });

  // add the payload to the request
  req.write(stringifiedPayload);

  req.end(() => console.log(`[${new Date().toLocaleString()}] Request Sent`));
};

// get HTML Template
helpers.getTemplate = (templateName, dataObj, callback) => {
  templateName = utils.validate(templateName);

  dataObj = typeof dataObj !== "object" ? {} : dataObj;

  if (!templateName) return callback({ error: "Invalid template Name given" });

  const filePath = `${baseTemplateDir}/${templateName}.html`;

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.log("[HTML] Error", err);
      return callback({ error: "No template found" });
    }

    let finalStr = helpers.interpolate(data, dataObj);

    callback(false, finalStr);
  });
};

// wrapper the body template
// to header and footer section
helpers.addHeaderAndFooterSection = (body, dataObj, callback) => {
  body = typeof body !== "string" ? "" : body;

  dataObj = typeof dataObj !== "object" ? {} : dataObj;

  // get the header template
  helpers.getTemplate("_header", dataObj, (err, headerData) => {
    if (err) {
      console.log("[HTML] Error: ", err);
      return callback({ error: "Couln't get the header content" });
    }

    helpers.getTemplate("_footer", dataObj, (err, footerData) => {
      if (err) {
        console.log("[HTML] Error: ", err);

        return callback({ error: "Couln't get the Footer content" });
      }

      const finalStr = `${headerData}${body}${footerData}`;

      callback(false, finalStr);
    });
  });
};

// Interpolate - replace variables in the HTML templates
helpers.interpolate = (str, dataObj) => {
  // dataObj - Is page specific

  str = utils.validate(str);
  dataObj = typeof dataObj !== "object" ? {} : dataObj;

  // Add the globals to dataObj
  for (let key in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(key))
      dataObj[`global.${key}`] = config.templateGlobals[key];
  }

  // find and replace the variables in the html
  for (let key in dataObj) {
    const find = `{${key}}`;
    const replace = dataObj[key];

    str = str.replace(find, replace);
  }

  return str;
};

// get static asset
helpers.getStaticAsset = (assetName, callback) => {
  assetName = utils.validate(assetName);

  if (!assetName) callback({ error: `Couln\'t found ${assetName} ` });

  const publicDir = path.join(`${__dirname}/../public/${assetName}`);

  fs.readFile(publicDir,  (err, data) => {
    if (err) return callback({ error: "No file found" });

    callback(false, data);
  });
};


module.exports = helpers;
