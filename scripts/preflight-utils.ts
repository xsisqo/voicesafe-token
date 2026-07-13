import { SigningKey } from "ethers";

export const BASE_SEPOLIA_CHAIN_ID = 84_532n;
const SECP256K1_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

export function validatePrivateKey(privateKey: string | undefined): string {
  if (privateKey === undefined || privateKey.length === 0) {
    throw new Error("PRIVATE_KEY is required. Add it to your local .env file before running preflight.");
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("PRIVATE_KEY is malformed. Expected a 0x-prefixed 32-byte hexadecimal value.");
  }

  const scalar = BigInt(privateKey);
  if (scalar === 0n || scalar >= SECP256K1_ORDER) {
    throw new Error("PRIVATE_KEY is malformed. It is outside the valid secp256k1 scalar range.");
  }

  try {
    new SigningKey(privateKey);
  } catch {
    throw new Error("PRIVATE_KEY is malformed. It is not a valid secp256k1 private key.");
  }

  return privateKey;
}

export function assertBaseSepoliaChainId(chainId: bigint): void {
  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Wrong network: expected Base Sepolia chain ID ${BASE_SEPOLIA_CHAIN_ID}, received ${chainId}.`,
    );
  }
}
