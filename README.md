# VoiceSafe Token

Production-oriented Hardhat project for the fixed-supply VoiceSafe Token (`VSAFE`) ERC-20 contract.

## Token specification

| Property | Value |
| --- | --- |
| Name | VoiceSafe Token |
| Symbol | VSAFE |
| Decimals | 18 |
| Initial and maximum supply | 100,000,000 VSAFE |
| Initial holder | Deployment account |
| Network configuration | Base Sepolia (chain ID `84532`) |

The constructor mints the entire `100,000,000 × 10^18` base-unit supply to the deployer. The contract has no owner, role system, proxy, or externally accessible mint function, so no additional tokens can be created after deployment.

## Prerequisites

- Node.js 22 or newer
- npm
- Base Sepolia ETH for deployment

## Install and test

```bash
npm ci
npm run compile
npm test
```

To produce a Solidity coverage report:

```bash
npm run coverage
```

Coverage temporarily instruments the Solidity build. The coverage command always follows the report with `hardhat clean` and a normal compile so instrumented artifacts cannot be reused later. The deployment and verification commands also enforce their own clean, non-coverage build before proceeding.

## Configure Base Sepolia

Copy `.env.example` to `.env` and provide a dedicated deployment key:

```dotenv
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BASESCAN_API_KEY=YOUR_BASESCAN_API_KEY
```

Never commit `.env` or reuse a key that protects valuable assets. The public Base endpoint is suitable for light testing; a private RPC provider is preferable for repeatable production deployments.

## Pre-deployment checklist

Before every deployment:

- Use a dedicated test/deployment wallet only; never use a wallet that protects production funds or personal assets.
- Confirm Base Sepolia is selected and the connected chain ID is `84532`.
- Confirm the deployment wallet has sufficient Base Sepolia test ETH.
- Verify the printed deployer address is the intended initial token holder before deployment.
- Never commit `.env`.
- Never paste the private key into chat, GitHub, or screenshots.

Run the read-only preflight check:

```bash
npm run preflight:base-sepolia
```

The preflight validates `PRIVATE_KEY` without printing it, connects to the configured Base Sepolia RPC endpoint, refuses any chain ID other than `84532`, and prints only the chain ID, deployer address, and ETH balance. It performs no transaction.

## Controlled Base Sepolia deployment

Run these commands in order:

```bash
npm run preflight:base-sepolia
npm run deploy:base-sepolia
npm run verify:base-sepolia:recorded
```

The deployment command refuses any chain ID other than `84532` and refuses to replace an existing `deployments/base-sepolia.json` record. For an intentional replacement only, set `ALLOW_DEPLOYMENT_OVERWRITE=true` locally and rerun the complete checklist. The deployment record contains public deployment metadata only and never contains the private key or another secret.

After a successful receipt, the script makes three bounded, read-only attempts to obtain the deployment block timestamp. A temporary block lookup failure never triggers another deployment and never changes the successful receipt into a failed deployment. If the block remains unavailable, the record uses the UTC time captured locally immediately after the receipt was returned and prints a warning that identifies this safe fallback. The block timestamp remains preferred whenever it is available.

Confirm that the deployer address is the intended initial holder before deploying because the full supply is assigned irreversibly in the constructor. Tag `v0.1.0-testnet` only after the Base Sepolia deployment and recorded-address verification both succeed. Do not create the tag before those two steps are complete.

## Verify on BaseScan

After setting `BASESCAN_API_KEY`, verify the validated address in `deployments/base-sepolia.json`:

```bash
npm run verify:base-sepolia:recorded
```

**Verification must always use a clean, non-coverage build.** The recorded-address helper runs `hardhat clean`, performs a normal compile, and only then starts verification. Do not invoke verification from coverage artifacts. Optional Blockscout submission is disabled because its response must not turn a successful BaseScan verification into an overall failure; BaseScan and Sourcify remain enabled.

The constructor takes no arguments.

## Project layout

```text
contracts/VoiceSafeToken.sol  Fixed-supply ERC-20 implementation
scripts/deploy.ts             Base Sepolia-compatible deployment script
scripts/deployment-record.ts  Validated deployment record persistence
scripts/deployment-timestamp.ts Bounded timestamp lookup and mined-receipt fallback
scripts/hardhat-workflows.ts  Clean build, coverage restoration, and verification sequencing
scripts/coverage.ts           Coverage runner that restores production artifacts
scripts/preflight.ts          Read-only Base Sepolia deployment validation
scripts/preflight-utils.ts    Testable key and chain validation helpers
scripts/verify-recorded.ts    BaseScan verification from the deployment record
scripts/verification-utils.ts Verification prerequisite validation
test/DeploymentRecord.ts      Record validation and overwrite safety tests
test/DeploymentTimestamp.ts   Post-receipt block lookup resilience tests
test/HardhatWorkflows.ts      Clean build and coverage restoration workflow tests
test/VoiceSafeToken.ts        Metadata, supply, transfer, and mint-surface tests
test/Preflight.ts             Preflight key and chain safety tests
hardhat.config.ts             Compiler and network configuration
.github/workflows/ci.yml      Reproducible compile-and-test CI
```

## Security notes

- OpenZeppelin Contracts supplies the ERC-20 implementation.
- The compiler optimizer is enabled with 200 runs.
- The supply is fixed at construction and there is no privileged administrative account.
- This repository is not a substitute for an independent smart-contract audit.

## License

MIT
