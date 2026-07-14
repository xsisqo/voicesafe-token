import { expect } from "chai";

import { requireBaseScanApiKey } from "../scripts/verification-utils.js";

describe("Recorded deployment verification prerequisites", function () {
  it("rejects missing and placeholder BaseScan API keys", function () {
    expect(() => requireBaseScanApiKey(undefined)).to.throw("BASESCAN_API_KEY is required");
    expect(() => requireBaseScanApiKey("")).to.throw("BASESCAN_API_KEY is required");
    expect(() => requireBaseScanApiKey("YOUR_BASESCAN_API_KEY")).to.throw(
      "BASESCAN_API_KEY is required",
    );
  });

  it("accepts a configured API key without logging or transforming it", function () {
    const configuredKey = "configured-test-api-key";

    expect(requireBaseScanApiKey(configuredKey)).to.equal(configuredKey);
  });
});
