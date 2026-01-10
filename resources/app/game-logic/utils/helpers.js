// Utility Helper Functions

const crypto = require("crypto-js");

/**
 * Parse haaapsi hash
 */
function parseHaaapsi(e) {
  if (!e) return "";
  var temp = crypto.MD5(e).toString(crypto.enc.Hex);
  return (temp = (temp = temp.split("").reverse().join("0")).substr(5, 10));
}

/**
 * Count occurrences in array
 */
function countOccurrences(arr, val) {
  return arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
}

/**
 * Get recovery code with alternation
 */
function getRecoveryCode(inc, mainCode, altCode) {
  if (mainCode && altCode) {
    return (inc % 2 == 1) ? mainCode : altCode;
  }
  return altCode || mainCode;
}

module.exports = {
  parseHaaapsi,
  countOccurrences,
  getRecoveryCode
};
