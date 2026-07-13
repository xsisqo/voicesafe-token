import "dotenv/config";

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import { readDeploymentRecord } from "./deployment-record.js";
import { requireBaseScanApiKey } from "./verification-utils.js";

const require = createRequire(import.meta.url);

async function main(): Promise<void> {
  requireBaseScanApiKey(process.env.BASESCAN_API_KEY);

  const record = await readDeploymentRecord();
  console.log(`Verifying ${record.contractName} at ${record.contractAddress} on Base Sepolia...`);

  const hardhatEntryPoint = require.resolve("hardhat");
  const hardhatCli = join(dirname(hardhatEntryPoint), "cli.js");
  const result = spawnSync(
    process.execPath,
    [hardhatCli, "verify", "--network", "baseSepolia", record.contractAddress],
    { stdio: "inherit" },
  );

  if (result.error !== undefined) {
    throw new Error(`Unable to start Hardhat verification: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Hardhat verification exited with status ${result.status ?? "unknown"}.`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown verification error.";
  console.error(`Verification failed: ${message}`);
  process.exitCode = 1;
});
