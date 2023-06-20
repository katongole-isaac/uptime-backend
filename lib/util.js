/**
 * Utilites functions
 *
 */

/**
 * Validating input
 * @param {*} str - type string
 * @returns `boolean` | `string`
 */
function validate(str, strLen = 0) {
  if (strLen !== 0) {
    if (typeof str === "string" && str.trim().length === strLen) return str;
  } else {
    if (typeof str === "string" && str.trim().length > 0) return str;
  }

  return false;
}

function createRandomTokenId(strLen) {
  if (!(typeof strLen === "number" && strLen > 0)) return false;

  // possible char(s)
  const possibleChars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";

  for (let i = 0; i < strLen; i++) {
    // random token
    token += possibleChars.charAt(Math.floor(Math.random() * strLen));
  }

  return token;
}

module.exports = {
  validate,
  createRandomTokenId,
};
