import { expect } from "chai";

import {
  assertBaseSepoliaChainId,
  BASE_SEPOLIA_CHAIN_ID,
  validatePrivateKey,
} from "../scripts/preflight-utils.js";

describe("Base Sepolia preflight validation", function () {
  it("accepts a structurally and cryptographically valid private key", function () {
    const validTestKey = `0x${"0".repeat(63)}1`;

    expect(validatePrivateKey(validTestKey)).to.equal(validTestKey);
  });

  it("rejects a missing private key", function () {
    expect(() => validatePrivateKey(undefined)).to.throw("PRIVATE_KEY is required");
    expect(() => validatePrivateKey("")).to.throw("PRIVATE_KEY is required");
  });

  it("rejects malformed private keys without echoing their value", function () {
    const malformedKey = "do-not-leak-this-value";

    expect(() => validatePrivateKey(malformedKey)).to.throw("PRIVATE_KEY is malformed");

    try {
      validatePrivateKey(malformedKey);
      expect.fail("Expected malformed key validation to throw");
    } catch (error) {
      expect((error as Error).message).not.to.include(malformedKey);
    }
  });

  it("rejects an out-of-range private key", function () {
    const zeroKey = `0x${"0".repeat(64)}`;
    const curveOrder = "0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";

    expect(() => validatePrivateKey(zeroKey)).to.throw("PRIVATE_KEY is malformed");
    expect(() => validatePrivateKey(curveOrder)).to.throw("PRIVATE_KEY is malformed");
  });

  it("accepts only the Base Sepolia chain ID", function () {
    expect(() => assertBaseSepoliaChainId(BASE_SEPOLIA_CHAIN_ID)).not.to.throw();
    expect(() => assertBaseSepoliaChainId(1n)).to.throw(
      "Wrong network: expected Base Sepolia chain ID 84532, received 1.",
    );
  });
});
