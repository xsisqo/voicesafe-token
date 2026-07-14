import "dotenv/config";

import { readDeploymentRecord } from "./deployment-record.js";
import {
  createHardhatCommandRunner,
  runVerificationWorkflow,
} from "./hardhat-workflows.js";
import { requireBaseScanApiKey } from "./verification-utils.js";

async function main(): Promise<void> {
  requireBaseScanApiKey(process.env.BASESCAN_API_KEY);

  const record = await readDeploymentRecord();
  console.log(`Verifying ${record.contractName} at ${record.contractAddress} on Base Sepolia...`);
  runVerificationWorkflow(record.contractAddress, createHardhatCommandRunner());
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown verification error.";
  console.error(`Verification failed: ${message}`);
  process.exitCode = 1;
});
