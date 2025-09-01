This workspace components were integrated using an AI agent through prompt-engineering. The agent assembled a minimal Hardhat + frontend MVP so you can compile, deploy, and test the Industrial Drone contract locally.

# Industrial Drone (Hardhat)

Decentralized drone fleet prototype on a local Hardhat network.
# Industrial Drone — local Hardhat prototype

A minimal decentralized system to manage industrial drone inspection tasks on a private Hardhat network.

## Overview

This project demonstrates a simple flow: an operator posts inspection tasks, drones register and bid, the operator assigns a drone, and the assigned drone logs a cryptographic hash of inspection results for later verification.

It includes:
- Smart contracts (Solidity) deployed to a local Hardhat node
- A small vanilla TypeScript frontend (Vite) that interacts with the contracts via Ethers + MetaMask
- Tests and demo scripts to exercise the workflow

---

## Architecture 

Simple diagram:

Frontend (browser + MetaMask)  -->  Hardhat local node (JSON-RPC)  -->  Smart contracts

More detailed (ASCII):

	+------------+      +----------------+      +------------------+
	|  Frontend  | <--> | Hardhat Node   | <--> | Smart Contracts  |
	| (Vite app) |      | (local chain)  |      | (Registry/Tasks) |
	+------------+      +----------------+      +------------------+
			 |                      ^                      ^
			 |                      |                      |
			 v                      |                      v
	User wallets (MetaMask) ----+                 Events / On-chain storage

explanation:
- Hardhat node: a local Ethereum-compatible node used for fast development and testing.
- Contracts: small on-chain programs that handle registration, bidding, assignment and data logging.
- Frontend: a browser UI that asks MetaMask to sign transactions and reads contract state.

---

## Components

Contracts (in `contracts/`):
- `DroneRegistry.sol` — register drones and store metadata (string).
- `TaskManager.sol` — post tasks, accept bids, assign drones, and mark completion.
- `DataLogger.sol` — store inspection result hashes per task.

Scripts:
- `scripts/deploy.js` — deploy contracts and write contract JSON (address + ABI) to `frontend/src/contracts/`.
- `scripts/demo.js` — scripted flow: register drones, post task, bid, assign, and log a hash.

Frontend:
- `frontend/` — vanilla TypeScript + Vite app in `frontend/src/` that performs register/post/bid/assign actions using the selected MetaMask account.

Tests:
- `test/` — a mocha test exercising the happy-path flow.

---

## Quickstart (detailed)

1. Install root dependencies:

```bash
npm install
```

2. Start the Hardhat node (keep this running in a terminal):

```bash
npm run node
```

This prints a list of test accounts and private keys. Keep the terminal open.

3. In another terminal, deploy contracts to the running node and write frontend artifacts:

```bash
npm run deploy:localhost
```

The deploy script will print deployed contract addresses and write `frontend/src/contracts/*.json` containing `{ address, abi }`.

4. Start the frontend dev server:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (typically http://localhost:5173). Connect MetaMask to the Hardhat RPC (http://127.0.0.1:8545, chainId 31337) and import one of the printed private keys to act as a wallet.

5. Run tests (optional):

```bash
npm test
```

---

## Hardhat node accounts — example and how frontend uses them

When you run `npm run node` Hardhat prints a list of pre-funded test accounts with their private keys. Example lines look like:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

- These keys are public and for local testing only. Never reuse them on any public network.
- Script behavior: deploy scripts and demo use the first signer from the Hardhat node (Account #0) as the operator/deployer.

How frontend uses accounts:
- The frontend asks the injected provider (MetaMask) for a signer when you interact.
- MetaMask must be connected to the Hardhat network and have an account selected. The selected account signs and sends transactions.
- Example flows:
	- If MetaMask selects Account #0 and you click "Post Task", the transaction is sent as Account #0 (operator).
	- If MetaMask selects Account #1 and you click "Register", the address Account #1 is stored in `DroneRegistry`.

Testing tips:
- To simulate multiple actors, import multiple Hardhat private keys into MetaMask (or open multiple browser profiles) and switch between them.

---

## Files of interest

- `contracts/` — Solidity contracts.
- `scripts/` — deploy and demo scripts.
- `frontend/src/contracts/` — generated JSON files with `{ address, abi }` after running deploy.
- `frontend/src/ui/app.ts` — the simple TypeScript UI (DOM + ethers calls).
- `test/` — unit/integration tests.

---
