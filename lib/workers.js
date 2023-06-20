/**
 * Background Workers file
 *
 */

const url = require("node:url");
const http = require("http");
const https = require("https");
const util = require("node:util");


const _data = require("./data");
const { validate } = require("./util");
const helpers = require("./helpers");
const config = require("../config");
const logger =  require('./logger');

const workers = {};

const checksDir = "checks";


// util debug log
const debug = util.debuglog('workers');


// initialze the logger [ file logger]
logger.init();

// look up for checks

workers.gatherAllChecks = function () {
  // get all checks in the systems
  _data.list(checksDir, (err, checks) => {
    if (err) {
      debug(`[Listing Checks] Error: Could not any check`, err);
      return;
    }

    checks.forEach((check) => {
      // read a single check
      _data.read(checksDir, check, (err, checkData) => {
        if (err) {
          debug(`[Reading check in workers] Error`, err);
          return;
        }

        // validate check data
        workers.validateCheckData(checkData);
      });
    });
  });
};

// validating check data
workers.validateCheckData = (check) => {
  check = typeof check === "object" && check !== null ? check : {};

  const {
    id: _id,
    phone: _phone,
    url: _url,
    method: _method,
    protocol: _protocol,
    successCodes: _successCodes,
    timeoutSeconds: _timeoutSeconds,
    state: _state,
    lastChecked: _lastChecked,
  } = check;

  // grab optional data
  const acceptableProtocols = ["http", "https"];
  const acceptableMethods = ["get", "put", "post", "delete"];

  const checkId = validate(_id, 20);
  const phone = validate(_phone, 10);

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

  // set keys if the check is new for workers
  // set state and lastChecked
  const state =
    typeof _state === "string" && ["up", "down"].indexOf(_state) > -1
      ? _state
      : "down";

  const lastChecked =
    typeof _lastChecked === "number" && _lastChecked > 0 ? _lastChecked : false;

  // validate all data
  if (
    checkId &&
    method &&
    url &&
    successCodes &&
    timeoutSeconds &&
    protocol &&
    phone
  ) {
    // constructing a new check
    const newCheck = {
      id: checkId,
      protocol,
      url,
      method,
      phone,
      timeoutSeconds,
      state,
      lastChecked,
      successCodes,
    };
    // if all goes well
    workers.performCheck(newCheck);
  } else {
    debug(
      ` [Validating check Data in workers ] Error : One's of the check data is invalid `
    );
  }
};

// performing the check
workers.performCheck = (check) => {
  // initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  // mark the outcome not or sent
  let outcomeSent = false;

  // construct a full url based on the user's input
  // ie. hostname e.g examples/path/to?q=search
  const fullUrl = `${check.protocol}://${check.url}`;

  const parsedUrl = url.parse(fullUrl, true);

  // get the hostname and path
  const path = parsedUrl.path;
  const hostname = parsedUrl.hostname;

  // construct the request options
  const requestDetails = {
    protocol: `${check.protocol}:`,
    method: check.method.toUpperCase(),
    timeout: check.timeoutSeconds * 1000, // the user supply just a number like 3 , so we convert to real sec(S)
    hostname,
    path,
  };

  // determine if u're to use http || https
  const _moduleToUse = check.protocol === "http" ? http : https;

  const req = _moduleToUse.request(requestDetails, (res) => {
    // update the checkOutCome
    checkOutcome.responseCode = res.statusCode;

    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  });

  // used in the error and timeout handlers

  const checkOutComeUpdater = (value) => {
    checkOutcome.error = {
      isError: true,
      value,
    };

    if (!outcomeSent) {
      workers.processCheckOutcome(check, checkOutcome);
      outcomeSent = true;
    }
  };

  // Bind on the error
  req.on("error", (err) => {
    checkOutComeUpdater(err);
  });

  // Bind to timeout
  req.on("timeout", (err) => {
    checkOutComeUpdater("timeout");
  });

  // send or end the request
  req.end();
};

workers.processCheckOutcome = (check, outcome) => {
  // Decide if the check is up or down
  const state =
    !outcome.error &&
    outcome.responseCode &&
    check.successCodes.indexOf(outcome.responseCode) > -1
      ? "up"
      : "down";

  // decide if u're going to alert the user incase of change in url state
  const alertWanted = check.lastChecked && check.state !== state ? true : false;

  // update the check data;
  const newCheck = check;
  newCheck.state = state;
  newCheck.lastChecked = Date.now();


  // logging to the file

  logger.log(newCheck.id , newCheck , (err)=> {
    debug(`[Logging] Error: `, err);
  })

  // save the updates
  _data.update(checksDir, newCheck.id, newCheck, (err) => {
    if (err) {
      debug(`[Updating the check in worker] Error: `, err);
      return;
    }

    if (alertWanted) return workers.alertUserOnStatusChange(newCheck);
    else debug(`Check out come not changed, No alert made !!`);
  });
};

// alert user i.e sms
workers.alertUserOnStatusChange = (check) => {
  const url = `${check.protocol}://${check.url}`;
  const msg = `Alert:  Your check for ${check.method.toUpperCase()}  ${url} is currently ${
    check.state
  }`;

  
  helpers.sendTwilioSms(`+256${check.phone.substring(1)}`, msg, (err) => {
    if (err) {
      debug(`Error: Couldn't send SMS to ${check.phone}`);
      return;
    }
    debug("Success: SMS sent to: ", check.phone);
  });
};

// executing workers.gatherAllChecks();
// for every a 1 min
workers.loop = function () {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

// init
workers.init = function () {
  // gathering all checks
  workers.gatherAllChecks();

  // looping -
  // This runs every after 1 min
  workers.loop();
};

module.exports = workers;
