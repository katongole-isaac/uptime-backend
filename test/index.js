/**
 * Test Runner
 *
 */

// container for the  app
const _app = {};

// container for the tests
_app.tests = {};

// add unit and integration tests
_app.tests.unit = require("./unit");
_app.tests.integration = require("./api");

// process test report
_app.processTestReport = function (success, failed, count, errors) {
  console.log(" ");
  console.log("---------- Test Report ---------");
  console.log("\x1b[32m Pass: %s \x1b[0m", success);
  console.log("\x1b[31m Fail: %s \x1b[0m", failed);
  console.log("\x1b[1m Total Tests: %s \x1b[0m", count);
  console.log(" ");
  console.log("--------- More -------");

  console.log(errors);
  process.exit(0);
};

// test count
_app.countTest = () => {
  let count = 0;
  for (let subTest in _app.tests) {
    if (!_app.tests.hasOwnProperty(subTest)) return;

    for (let testName in _app.tests[subTest]) {
      if (!_app.tests[subTest].hasOwnProperty(testName)) return;
      ++count;
    }
  }

  return count;
};

// run tests
_app.runTests = function () {
  let success = 0,
    failed = 0,
    count = 0,
    testLimit = _app.countTest(),
    errors = [];

  for (let subTests in _app.tests) {
    if (!_app.tests.hasOwnProperty(subTests)) return;

    for (let testName in _app.tests[subTests]) {
      if (!_app.tests[subTests].hasOwnProperty(testName)) return;

      let testValue = _app.tests[subTests][testName];

      try {
        
        testValue(() => {
          ++success;
          console.log(`\x1b[32m %s \x1b[0m`, testName);

          // if (count === testLimit)
          //   _app.processTestReport(success, failed, count, errors);
        });
      } catch (error) {
        ++failed;
        console.log(`\x1b[31m %s \x1b[0m`, testName);
        errors.push(error);
        // if (count === testLimit)
        //   _app.processTestReport(success, failed, count, errors);
      }
    }
  }

  process.exit(0);
};

_app.runTests();
