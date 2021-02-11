/**
 * @param {string} dateString 
 * @returns {Date}
 */
export function parseDate(dateString) {
  const [ye, mo, da, ho, mi, se, ms] = dateString.split(/\D+/).map(Number);
  return new Date(ye, (mo || 1) - 1, da || 1, ho || 0, mi || 0, se || 0, ms || 0);
}
