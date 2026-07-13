import { network } from "hardhat";

import {
  assertDeploymentRecordWritable,
  BASE_SEPOLIA_DEPLOYMENT_PATH,
  type DeploymentRecord,
  isDeploymentOverwriteAllowed,
  writeDeploymentRecord,
} from "./deployment-record.js";
import { assertBaseSepoliaChainId, validatePrivateKey } from "./preflight-utils.js";

async function main(): Promise<void> {
  validatePrivateKey(process.env.PRIVATE_KEY);
  const allowOverwrite = isDeploymentOverwriteAllowed(process.env.ALLOW_DEPLOYMENT_OVERWRITE);
  await assertDeploymentRecordWritable(BASE_SEPOLIA_DEPLOYMENT_PATH, allowOverwrite);

  const { ethers } = await network.create();
  const connectedNetwork = await ethers.provider.getNetwork();
  console.log(`Connected chain ID: ${connectedNetwork.chainId}`);
  assertBaseSepoliaChainId(connectedNetwork.chainId);

  const [deployer] = await ethers.getSigners();
  if (deployer === undefined) {
    throw new Error("No deployer signer is configured.");
  }

  console.log(`Deploying VoiceSafe Token with account: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const token = await ethers.deployContract("VoiceSafeToken");
  const deploymentTransaction = token.deploymentTransaction();
  if (deploymentTransaction === null) {
    throw new Error("Deployment transaction was not created.");
  }

  const receipt = await deploymentTransaction.wait();
  if (receipt === null) {
    throw new Error("Deployment transaction was not mined.");
  }

  await token.waitForDeployment();
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  if (block === null) {
    throw new Error(`Unable to read deployment block ${receipt.blockNumber}.`);
  }

  const [address, tokenName, tokenSymbol, decimals, totalSupply] = await Promise.all([
    token.getAddress(),
    token.name(),
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
  ]);

  const record: DeploymentRecord = {
    network: "baseSepolia",
    chainId: 84_532,
    contractName: "VoiceSafeToken",
    contractAddress: address,
    deploymentTransactionHash: deploymentTransaction.hash,
    deployerAddress: deployer.address,
    blockNumber: receipt.blockNumber,
    timestamp: new Date(Number(block.timestamp) * 1_000).toISOString(),
    tokenName,
    tokenSymbol,
    decimals: Number(decimals),
    totalSupply: totalSupply.toString(),
  };

  await writeDeploymentRecord(record, BASE_SEPOLIA_DEPLOYMENT_PATH, allowOverwrite);

  console.log("\nDeployment complete — Base Sepolia");
  console.log(`Network: ${record.network} (chain ID ${record.chainId})`);
  console.log(`Contract: ${record.contractName}`);
  console.log(`Address: ${record.contractAddress}`);
  console.log(`Transaction: ${record.deploymentTransactionHash}`);
  console.log(`Block: ${record.blockNumber}`);
  console.log(`Timestamp: ${record.timestamp}`);
  console.log(`Deployer: ${record.deployerAddress}`);
  console.log(`Token: ${record.tokenName} (${record.tokenSymbol})`);
  console.log(`Total supply: ${ethers.formatUnits(totalSupply, record.decimals)} ${record.tokenSymbol}`);
  console.log(`Deployment record: ${BASE_SEPOLIA_DEPLOYMENT_PATH}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
