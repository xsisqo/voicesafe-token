import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

export type HardhatCommandRunner = (arguments_: readonly string[]) => void;

export function createHardhatCommandRunner(): HardhatCommandRunner {
  const hardhatEntryPoint = require.resolve("hardhat");
  const hardhatCli = join(dirname(hardhatEntryPoint), "cli.js");

  return (arguments_: readonly string[]): void => {
    const result = spawnSync(process.execPath, [hardhatCli, ...arguments_], {
      stdio: "inherit",
    });

    if (result.error !== undefined) {
      throw new Error(`Unable to start Hardhat: ${result.error.message}`);
    }
    if (result.status !== 0) {
      throw new Error(
        `Hardhat ${arguments_.join(" ")} exited with status ${result.status ?? "unknown"}.`,
      );
    }
  };
}

export function runCleanBuild(runHardhat: HardhatCommandRunner): void {
  runHardhat(["clean"]);
  runHardhat(["compile"]);
}

export function runVerificationWorkflow(
  contractAddress: string,
  runHardhat: HardhatCommandRunner,
): void {
  runCleanBuild(runHardhat);
  runHardhat(["verify", "--network", "baseSepolia", contractAddress]);
}

export function runCoverageWorkflow(runHardhat: HardhatCommandRunner): void {
  let coverageError: unknown;
  try {
    runHardhat(["test", "--coverage"]);
  } catch (error) {
    coverageError = error;
  }

  let restorationError: unknown;
  try {
    runCleanBuild(runHardhat);
  } catch (error) {
    restorationError = error;
  }

  if (coverageError !== undefined && restorationError !== undefined) {
    throw new AggregateError(
      [coverageError, restorationError],
      "Coverage failed and normal non-coverage artifacts could not be restored.",
    );
  }
  if (restorationError !== undefined) {
    throw new Error("Normal non-coverage artifacts could not be restored after coverage.", {
      cause: restorationError,
    });
  }
  if (coverageError !== undefined) {
    throw coverageError;
  }
}
