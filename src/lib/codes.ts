const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAccessCode(length = 4) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `KUJI-${code}`;
}
