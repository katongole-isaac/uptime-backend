/**
 * Unit test
 *
 */

// deps
const _data = require("../lib/data");

const assert = require("node:assert");

/**
 * Function to be tested
 * - It returns 1
 * @returns 1
 */
function One() {
  return 1;
}

const unit = {};

// test for One()
// should return 1
unit["Should return 1"] = function (done) {
  const value = One();
  assert.strictEqual(value, 1);
  done();
};

// test for One()
// the returned value must be of type `number`
unit["The returned value must be of type number"] = function (done) {
  const value = One();
  assert.strictEqual(typeof value, "number");
  done();
};

unit["Should failed because of the returned type 'string'"] = function (done) {
  const value = One();
  assert.strictEqual(typeof value, "string");
  done();
};



unit["[lib.list] Should return an array of file and an error of false "] =
  function (done) {
    _data.list("tokens", (err, files) => {
      assert.ok(files instanceof Array);
      assert.equal(err, false);
      done();
    });
  };

module.exports = unit;
