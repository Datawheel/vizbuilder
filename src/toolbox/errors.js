/**
 * Creates a traceable error to throw.
 * @param {string} name
 * @param {string} [message]
 */
export function errorFactory(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}
