import "dotenv/config";

import { formatEther, JsonRpcProvider, Wallet } from "ethers";

import { assertBaseSepoliaChainId, validatePrivateKey } from "./preflight-utils.js";

const DEFAULT_BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";

async function main(): Promise<void> {
  const privateKey = validatePrivateKey(process.env.PRIVATE_KEY);
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL ?? DEFAULT_BASE_SEPOLIA_RPC_URL;
  const provider = new JsonRpcProvider(rpcUrl);

  try {
    const connectedNetwork = await provider.getNetwork();
    console.log(`Connected chain ID: ${connectedNetwork.chainId}`);
    assertBaseSepoliaChainId(connectedNetwork.chainId);

    const deployer = new Wallet(privateKey);
    console.log(`Deployer address: ${deployer.address}`);

    const balance = await provider.getBalance(deployer.address);
    console.log(`Deployer balance: ${formatEther(balance)} ETH`);
    console.log("Preflight passed. No transaction was sent.");
  } finally {
    provider.destroy();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown preflight error.";
  console.error(`Preflight failed: ${message}`);
  process.exitCode = 1;
});
