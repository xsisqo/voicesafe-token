import { expect } from "chai";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertDeploymentRecordWritable,
  type DeploymentRecord,
  isDeploymentOverwriteAllowed,
  readDeploymentRecord,
  validateDeploymentRecord,
  writeDeploymentRecord,
} from "../scripts/deployment-record.js";

describe("Base Sepolia deployment records", function () {
  const temporaryDirectories: string[] = [];
  const validRecord: DeploymentRecord = {
    network: "baseSepolia",
    chainId: 84_532,
    contractName: "VoiceSafeToken",
    contractAddress: "0x1111111111111111111111111111111111111111",
    deploymentTransactionHash: `0x${"ab".repeat(32)}`,
    deployerAddress: "0x2222222222222222222222222222222222222222",
    blockNumber: 12_345,
    timestamp: "2026-07-13T20:00:00.000Z",
    tokenName: "VoiceSafe Token",
    tokenSymbol: "VSAFE",
    decimals: 18,
    totalSupply: "100000000000000000000000000",
  };

  afterEach(async function () {
    await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
  });

  async function temporaryRecordPath(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), "voicesafe-deployment-record-"));
    temporaryDirectories.push(directory);
    return join(directory, "deployments", "base-sepolia.json");
  }

  async function expectRejection(promise: Promise<unknown>, expectedMessage: string): Promise<void> {
    let caught: unknown;
    try {
      await promise;
    } catch (error) {
      caught = error;
    }

    expect(caught).to.be.instanceOf(Error);
    expect((caught as Error).message).to.include(expectedMessage);
  }

  it("accepts a complete Base Sepolia deployment record", function () {
    expect(validateDeploymentRecord(validRecord)).to.deep.equal(validRecord);
  });

  it("rejects invalid records and unexpected secret fields", function () {
    expect(() => validateDeploymentRecord({ ...validRecord, chainId: 1 })).to.throw("chain ID 84532");
    expect(() => validateDeploymentRecord({ ...validRecord, privateKey: "must-not-be-recorded" }))
      .to.throw("missing or unsupported fields");
  });

  it("writes and reads a validated record", async function () {
    const path = await temporaryRecordPath();

    await writeDeploymentRecord(validRecord, path);

    expect(await readDeploymentRecord(path)).to.deep.equal(validRecord);
    expect(JSON.parse(await readFile(path, "utf8"))).not.to.have.property("privateKey");
  });

  it("fails safely when the deployment record is missing", async function () {
    const path = await temporaryRecordPath();

    await expectRejection(readDeploymentRecord(path), "Deployment record not found");
  });

  it("refuses to overwrite unless explicitly allowed", async function () {
    const path = await temporaryRecordPath();
    await writeDeploymentRecord(validRecord, path);

    await expectRejection(
      assertDeploymentRecordWritable(path, false),
      "ALLOW_DEPLOYMENT_OVERWRITE=true",
    );
    await expectRejection(
      writeDeploymentRecord(validRecord, path, false),
      "ALLOW_DEPLOYMENT_OVERWRITE=true",
    );

    const replacement = { ...validRecord, blockNumber: validRecord.blockNumber + 1 };
    await writeDeploymentRecord(replacement, path, true);
    expect(await readDeploymentRecord(path)).to.deep.equal(replacement);
  });

  it("requires the exact overwrite opt-in value", function () {
    expect(isDeploymentOverwriteAllowed("true")).to.equal(true);
    expect(isDeploymentOverwriteAllowed("TRUE")).to.equal(false);
    expect(isDeploymentOverwriteAllowed(undefined)).to.equal(false);
  });
});
