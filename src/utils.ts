/**
 * Checks if a string is a valid Solana public key
 * @param address The string to check
 * @returns boolean indicating whether the string is a valid Solana public key
 */
export function isSolanaPublicKey(address: string): boolean {
  // Solana public keys are base58-encoded and 44 characters long
  const solanaPublicKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{43,44}$/;
  return solanaPublicKeyRegex.test(address);
}
