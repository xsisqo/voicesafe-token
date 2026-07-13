import { network } from "hardhat";

const { ethers } = await network.create();

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying VoiceSafe Token with account: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

  const token = await ethers.deployContract("VoiceSafeToken");
  await token.waitForDeployment();

  const address = await token.getAddress();
  const deploymentTransaction = token.deploymentTransaction();

  console.log(`VoiceSafe Token deployed to: ${address}`);
  console.log(`Transaction hash: ${deploymentTransaction?.hash ?? "unavailable"}`);
  console.log(`Initial supply: ${ethers.formatUnits(await token.totalSupply(), 18)} VSAFE`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
