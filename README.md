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

## Deploy

```bash
npm run deploy:base-sepolia
```

Save the emitted contract address and transaction hash. Confirm that the deployer address is the intended initial holder before deploying because the full supply is assigned irreversibly in the constructor.

## Verify on BaseScan

After setting `BASESCAN_API_KEY`, replace the address below with the deployed contract address:

```bash
npm run verify:base-sepolia -- 0xDEPLOYED_CONTRACT_ADDRESS
```

The constructor takes no arguments.

## Project layout

```text
contracts/VoiceSafeToken.sol  Fixed-supply ERC-20 implementation
scripts/deploy.ts             Base Sepolia-compatible deployment script
scripts/preflight.ts          Read-only Base Sepolia deployment validation
scripts/preflight-utils.ts    Testable key and chain validation helpers
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
