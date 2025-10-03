/**
 * Generates a random string of the specified length using alphanumeric characters.
 *
 * @param length - length of the uuid
 * @returns a random string of the specified length
 */
export function uuid(length: number) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
  return result;
}
