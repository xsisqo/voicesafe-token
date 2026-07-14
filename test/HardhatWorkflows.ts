import { expect } from "chai";

import {
  type HardhatCommandRunner,
  runCoverageWorkflow,
  runVerificationWorkflow,
} from "../scripts/hardhat-workflows.js";

function recordingRunner(commands: string[][]): HardhatCommandRunner {
  return (arguments_) => {
    commands.push([...arguments_]);
  };
}

describe("Clean Hardhat workflows", function () {
  it("cleans and compiles before recorded-address verification", function () {
    const commands: string[][] = [];

    runVerificationWorkflow(
      "0xf35da3ad45345fbab5f8f9ee425858bcefd11249",
      recordingRunner(commands),
    );

    expect(commands).to.deep.equal([
      ["clean"],
      ["compile"],
      [
        "verify",
        "--network",
        "baseSepolia",
        "0xf35da3ad45345fbab5f8f9ee425858bcefd11249",
      ],
    ]);
  });

  it("restores a normal clean build after coverage", function () {
    const commands: string[][] = [];

    runCoverageWorkflow(recordingRunner(commands));

    expect(commands).to.deep.equal([
      ["test", "--coverage"],
      ["clean"],
      ["compile"],
    ]);
  });

  it("restores a normal clean build even when coverage fails", function () {
    const commands: string[][] = [];
    const coverageError = new Error("coverage failed");
    const runner: HardhatCommandRunner = (arguments_) => {
      commands.push([...arguments_]);
      if (arguments_[0] === "test") throw coverageError;
    };

    expect(() => runCoverageWorkflow(runner)).to.throw("coverage failed");
    expect(commands).to.deep.equal([
      ["test", "--coverage"],
      ["clean"],
      ["compile"],
    ]);
  });
});
