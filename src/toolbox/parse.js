/**
 * Attempts to parse all forms of date strings used by the server.
 *
 * @param {string} dateString
 * @returns {Date}
 */
export function parseDate(dateString) {
  // dateString is quarter, in format `2010Q2` or `10Q2`
  dateString = dateString?.toString() || "";
  const maybeQuarter = dateString.match(/(\d{2,4})(Q\d)/i);
  if (maybeQuarter) {
    const [, year, quarter] = maybeQuarter;
    let ye = parseInt(year, 10);
    if (ye < 100) {
      // If year is presented in two digits,
      // interprets a number greater than the current year + 15 as 19xx
      const lastDigits = `${new Date().getFullYear()}`.slice(-2);
      ye = ye > parseInt(lastDigits, 10) + 15 ? ye + 1900 : ye + 2000;
    }
    const mo = {Q1: 2, Q2: 5, Q3: 8, Q4: 11}[quarter.toUpperCase()];
    return new Date(ye, mo || 0, 1, 0, 0, 0, 0);
  }

  // dateString composed of numbers separated by spaces, slashes, dashes, or colons
  const [ye, mo, da, ho, mi, se, ms] = dateString.split(/\D+/).map(Number);
  return new Date(ye, (mo || 1) - 1, da || 1, ho || 0, mi || 0, se || 0, ms || 0);
}
