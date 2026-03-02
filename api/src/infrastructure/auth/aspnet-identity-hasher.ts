import { pbkdf2Sync, randomBytes } from "crypto";

/**
 * ASP.NET Core Identity V3 Password Hasher
 *
 * Binary layout of a V3 hash (then Base64-encoded):
 *   [0x01]       1 byte   – version marker
 *   [prf]        4 bytes  – big-endian uint32 (0=SHA1, 1=SHA256, 2=SHA512)
 *   [iterCount]  4 bytes  – big-endian uint32
 *   [saltLen]    4 bytes  – big-endian uint32
 *   [salt]       saltLen bytes
 *   [subkey]     remaining bytes
 */

const enum KeyDerivationPrf {
  HMACSHA1 = 0,
  HMACSHA256 = 1,
  HMACSHA512 = 2
}

const PRF_DIGEST: Record<number, string> = {
  [KeyDerivationPrf.HMACSHA1]: "sha1",
  [KeyDerivationPrf.HMACSHA256]: "sha256",
  [KeyDerivationPrf.HMACSHA512]: "sha512"
};

/**
 * Verify a plaintext password against an ASP.NET Core Identity V3 hash.
 */
export function verifyPassword(plaintext: string, hashedPassword: string): boolean {
  try {
    const decoded = Buffer.from(hashedPassword, "base64");

    if (decoded[0] !== 0x01) {
      // Only V3 format is supported
      return false;
    }

    const prf = decoded.readUInt32BE(1);
    const iterCount = decoded.readUInt32BE(5);
    const saltLen = decoded.readUInt32BE(9);

    if (saltLen < 16) return false;

    const salt = decoded.subarray(13, 13 + saltLen);
    const storedSubkey = decoded.subarray(13 + saltLen);

    const digest = PRF_DIGEST[prf];
    if (!digest) return false;

    const derivedSubkey = pbkdf2Sync(
      Buffer.from(plaintext, "utf8"),
      salt,
      iterCount,
      storedSubkey.length,
      digest
    );

    return derivedSubkey.equals(storedSubkey);
  } catch {
    return false;
  }
}

/**
 * Hash a password in ASP.NET Core Identity V3 format (HMACSHA256, 100 000 iterations).
 * Compatible with the default hasher used in .NET 6/7/8 older defaults;
 * upgrade iterCount to 350_000 for .NET 8 strict compatibility.
 */
export function hashPassword(plaintext: string): string {
  const prf = KeyDerivationPrf.HMACSHA256;
  const iterCount = 100_000;
  const saltLen = 16;
  const subkeyLen = 32;

  const salt = randomBytes(saltLen);
  const subkey = pbkdf2Sync(
    Buffer.from(plaintext, "utf8"),
    salt,
    iterCount,
    subkeyLen,
    PRF_DIGEST[prf]
  );

  const output = Buffer.alloc(13 + saltLen + subkeyLen);
  output[0] = 0x01;
  output.writeUInt32BE(prf, 1);
  output.writeUInt32BE(iterCount, 5);
  output.writeUInt32BE(saltLen, 9);
  salt.copy(output, 13);
  subkey.copy(output, 13 + saltLen);

  return output.toString("base64");
}
