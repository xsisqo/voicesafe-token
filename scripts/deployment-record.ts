import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { isAddress, isHexString } from "ethers";

export const BASE_SEPOLIA_DEPLOYMENT_PATH = resolve("deployments", "base-sepolia.json");

export interface DeploymentRecord {
  network: "baseSepolia";
  chainId: 84532;
  contractName: "VoiceSafeToken";
  contractAddress: string;
  deploymentTransactionHash: string;
  deployerAddress: string;
  blockNumber: number;
  timestamp: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
}

const DEPLOYMENT_RECORD_KEYS = [
  "network",
  "chainId",
  "contractName",
  "contractAddress",
  "deploymentTransactionHash",
  "deployerAddress",
  "blockNumber",
  "timestamp",
  "tokenName",
  "tokenSymbol",
  "decimals",
  "totalSupply",
].sort();

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export function validateDeploymentRecord(value: unknown): DeploymentRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Deployment record must be a JSON object.");
  }

  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  if (actualKeys.length !== DEPLOYMENT_RECORD_KEYS.length ||
      actualKeys.some((key, index) => key !== DEPLOYMENT_RECORD_KEYS[index])) {
    throw new Error("Deployment record contains missing or unsupported fields.");
  }

  if (record.network !== "baseSepolia" || record.chainId !== 84_532) {
    throw new Error("Deployment record must identify Base Sepolia chain ID 84532.");
  }
  if (record.contractName !== "VoiceSafeToken") {
    throw new Error("Deployment record contract name must be VoiceSafeToken.");
  }
  if (typeof record.contractAddress !== "string" || !isAddress(record.contractAddress)) {
    throw new Error("Deployment record contains an invalid contract address.");
  }
  if (typeof record.deploymentTransactionHash !== "string" ||
      !isHexString(record.deploymentTransactionHash, 32)) {
    throw new Error("Deployment record contains an invalid transaction hash.");
  }
  if (typeof record.deployerAddress !== "string" || !isAddress(record.deployerAddress)) {
    throw new Error("Deployment record contains an invalid deployer address.");
  }
  if (!Number.isSafeInteger(record.blockNumber) || (record.blockNumber as number) < 0) {
    throw new Error("Deployment record contains an invalid block number.");
  }
  if (typeof record.timestamp !== "string" ||
      Number.isNaN(Date.parse(record.timestamp)) ||
      new Date(record.timestamp).toISOString() !== record.timestamp) {
    throw new Error("Deployment record contains an invalid ISO-8601 timestamp.");
  }
  if (typeof record.tokenName !== "string" || record.tokenName.length === 0 ||
      typeof record.tokenSymbol !== "string" || record.tokenSymbol.length === 0) {
    throw new Error("Deployment record contains invalid token metadata.");
  }
  if (!Number.isInteger(record.decimals) || (record.decimals as number) < 0 ||
      (record.decimals as number) > 255) {
    throw new Error("Deployment record contains invalid token decimals.");
  }
  if (typeof record.totalSupply !== "string" || !/^[1-9][0-9]*$/.test(record.totalSupply)) {
    throw new Error("Deployment record total supply must be a positive base-unit integer string.");
  }

  return record as unknown as DeploymentRecord;
}

export function isDeploymentOverwriteAllowed(value: string | undefined): boolean {
  return value === "true";
}

export async function assertDeploymentRecordWritable(
  path = BASE_SEPOLIA_DEPLOYMENT_PATH,
  allowOverwrite = false,
): Promise<void> {
  if (allowOverwrite) return;

  try {
    await access(path);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return;
    throw error;
  }

  throw new Error(
    `Deployment record already exists at ${path}. Set ALLOW_DEPLOYMENT_OVERWRITE=true to replace it explicitly.`,
  );
}

export async function writeDeploymentRecord(
  record: DeploymentRecord,
  path = BASE_SEPOLIA_DEPLOYMENT_PATH,
  allowOverwrite = false,
): Promise<void> {
  validateDeploymentRecord(record);
  await mkdir(dirname(path), { recursive: true });

  try {
    await writeFile(path, `${JSON.stringify(record, null, 2)}\n`, {
      encoding: "utf8",
      flag: allowOverwrite ? "w" : "wx",
    });
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") {
      throw new Error(
        `Deployment record already exists at ${path}. Set ALLOW_DEPLOYMENT_OVERWRITE=true to replace it explicitly.`,
      );
    }
    throw error;
  }
}

export async function readDeploymentRecord(
  path = BASE_SEPOLIA_DEPLOYMENT_PATH,
): Promise<DeploymentRecord> {
  let contents: string;
  try {
    contents = await readFile(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(`Deployment record not found at ${path}. Deploy and record the contract first.`);
    }
    throw error;
  }

  try {
    return validateDeploymentRecord(JSON.parse(contents) as unknown);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown validation error.";
    throw new Error(`Deployment record is invalid: ${message}`);
  }
}
