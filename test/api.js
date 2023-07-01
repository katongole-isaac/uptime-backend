/**
 * Integration tests
 *
 */

// deps
const http = require("node:http");
const assert = require("node:assert");

const app = require("../index");

const config = require("../config");

// override the env't to testing
process.env.NODE_ENV = "testing";

// container
const api = {};

// app.init()

// make http request
const httpGet = (path, cb) => {
  // request details
  const reqOpts = {
    protocol: "http:",
    hostname: "localhost",
    method: "GET",
    path,
    port: config.httpPort,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(reqOpts, (res) => {
    cb(res);
  });

  // send  the request
  req.end();
};

api["Should start the app without throwing "] = function (done) {
  assert.doesNotThrow(function () {
    app.init((err) => {
      done();
    });
  }, TypeError);

  
};

api['/ping Should return 200 indicating the app is up '] = function(done) {

    httpGet('/ping', (res)=> {
        assert.equal(res.statusCode, 200);
        done();
    })
}

module.exports = api;
