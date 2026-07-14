import {
  createHardhatCommandRunner,
  runCoverageWorkflow,
} from "./hardhat-workflows.js";

try {
  runCoverageWorkflow(createHardhatCommandRunner());
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown coverage error.";
  console.error(`Coverage failed: ${message}`);
  process.exitCode = 1;
}
