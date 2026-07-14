import { expect } from "chai";

import {
  type DeploymentBlockProvider,
  resolveDeploymentTimestamp,
} from "../scripts/deployment-timestamp.js";

describe("Deployment timestamp recovery", function () {
  it("prefers the deployment block timestamp when immediately available", async function () {
    const provider: DeploymentBlockProvider = {
      getBlock: async () => ({ timestamp: 1_752_400_000 }),
    };

    expect(await resolveDeploymentTimestamp(provider, 44_105_945)).to.deep.equal({
      timestamp: new Date(1_752_400_000_000).toISOString(),
      source: "block",
    });
  });

  it("retries a bounded number of read-only block lookups", async function () {
    let calls = 0;
    const delays: number[] = [];
    const provider: DeploymentBlockProvider = {
      getBlock: async () => {
        calls += 1;
        return calls === 3 ? { timestamp: 1_752_400_001 } : null;
      },
    };

    const result = await resolveDeploymentTimestamp(provider, 44_105_945, {
      attempts: 3,
      delayMs: 25,
      sleep: async (delayMs) => {
        delays.push(delayMs);
      },
    });

    expect(calls).to.equal(3);
    expect(delays).to.deep.equal([25, 25]);
    expect(result).to.deep.equal({
      timestamp: new Date(1_752_400_001_000).toISOString(),
      source: "block",
    });
  });

  it("preserves a successful mined deployment with a receipt-observation fallback", async function () {
    let calls = 0;
    const fallbackTimestamp = new Date("2026-07-13T22:02:58.000Z");
    const provider: DeploymentBlockProvider = {
      getBlock: async () => {
        calls += 1;
        if (calls === 1) throw new Error("temporary RPC failure");
        return null;
      },
    };

    const result = await resolveDeploymentTimestamp(provider, 44_105_945, {
      attempts: 3,
      delayMs: 0,
      fallbackTimestamp,
      sleep: async () => undefined,
    });

    expect(calls).to.equal(3);
    expect(result).to.deep.equal({
      timestamp: fallbackTimestamp.toISOString(),
      source: "receipt-observed-at",
    });
  });
});
