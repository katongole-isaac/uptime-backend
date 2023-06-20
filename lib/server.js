/**
 * Server logic & tasks
 * @author Isaac Katongole <katongolelsaac78@gmail.com>
 * Created Date: 13-Jun-2023
 *
 */

// Dependencies
const http = require("node:http");
const https = require("node:https");
const url = require("node:url");
const StringDecoder = require("node:string_decoder").StringDecoder;
const fs = require("fs");

const config = require("../config");
const handlers = require("./handlers");
const helpers = require("./helpers");
const tokenHandlers = require("./tokenHandlers");
const checkHandlers = require("./checkHandlers");

const server = {};

// create a http server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

//https server Options
server.httpsServerOptions = {
  key: fs.readFileSync(__dirname + "/../https/key.pem"),
  cert: fs.readFileSync(__dirname + "/../https/cert.pem"),
};

// create a https server
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

// Logic for all both http and https server
server.unifiedServer = (req, res) => {
  //getting the method , work with it in lowercase
  const method = req.method.toLowerCase();

  //parsing the Url
  const parsedUrl = url.parse(req.url, true);

  //   Getting the pathname for parsedUrl
  const pathname = parsedUrl.pathname;

  // trim the leading and ending slashes on the pathname.
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, "");

  // getting queryString object from the parsedUrl
  const queryStringObject = parsedUrl.query;

  //getting headers
  const headers = req.headers;

  let buffer = "";

  //used to decode incoming buffer data
  const decoder = new StringDecoder("utf-8");

  //getting data from the client i.e post data.
  req.on("data", (chunk) => {
    buffer = decoder.write(chunk);
  });

  req.on("end", () => {
    buffer += decoder.end();

    //choose a handler based on the path i.e pathname otherwise default to notFound;
    const chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    //construct the data that is to be given to the chosenHandler
    const data = {
      method,
      headers,
      trimmedPath,
      queryStringObject,
      payload: helpers.parsedJsonToObject(buffer),
    };

    chosenHandler(data, (statuCode, payload) => {
      // set the provided statusCode otherwise default to 200
      statuCode = typeof statuCode !== "number" ? 200 : statuCode;

      //check if the handler provided a payload otherwise set it to an empty object
      payload = typeof payload !== "object" ? {} : payload;

      //convert payload to stringObject;
      const payloadString = JSON.stringify(payload);

      res.setHeader("Content-Type", "application/json");

      res.writeHead(statuCode);

      res.end(payloadString);

      console.log(`Response: ${statuCode}  `);
    });
  });
};

// router
server.router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: tokenHandlers.tokens,
  checks: checkHandlers.checks,
};

/**
 * For initializing the server
 *
 *  - It start the server
 */
server.init = function () {
  // start http server
  server.httpServer.listen(config.httpPort, () => {
    console.log( `\x1b[1;32m%s \x1b[0m` , `[${config.envName}]: Running on port ${config.httpPort}`);
  });

  // start https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log( `\x1b[1;33m%s \x1b[0m`   ,`[${config.envName}]: Running on port ${config.httpsPort}`);
  });
};

module.exports = server;
