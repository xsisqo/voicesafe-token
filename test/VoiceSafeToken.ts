import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("VoiceSafeToken", function () {
  const initialSupply = ethers.parseUnits("100000000", 18);

  async function deployToken() {
    const [deployer, recipient] = await ethers.getSigners();
    const token = await ethers.deployContract("VoiceSafeToken");
    await token.waitForDeployment();

    return { token, deployer, recipient };
  }

  it("sets the expected token metadata", async function () {
    const { token } = await deployToken();

    expect(await token.name()).to.equal("VoiceSafe Token");
    expect(await token.symbol()).to.equal("VSAFE");
    expect(await token.decimals()).to.equal(18);
  });

  it("mints the complete fixed supply to the deployer", async function () {
    const { token, deployer } = await deployToken();

    expect(await token.INITIAL_SUPPLY()).to.equal(initialSupply);
    expect(await token.totalSupply()).to.equal(initialSupply);
    expect(await token.balanceOf(deployer.address)).to.equal(initialSupply);
  });

  it("supports standard ERC-20 transfers without changing total supply", async function () {
    const { token, deployer, recipient } = await deployToken();
    const amount = ethers.parseUnits("250", 18);

    await expect(token.transfer(recipient.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(deployer.address, recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
    expect(await token.totalSupply()).to.equal(initialSupply);
  });

  it("does not expose any function capable of additional minting", async function () {
    const { token } = await deployToken();
    const genericInterface = new ethers.Interface(token.interface.fragments);

    expect(genericInterface.getFunction("mint")).to.equal(null);
    expect(genericInterface.getFunction("_mint")).to.equal(null);
  });
});
