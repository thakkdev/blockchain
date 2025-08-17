Note: This workspace was integrated using an AI agent as part of a prompt-engineering application. The agent assembled a minimal Hardhat + frontend MVP so you can compile, deploy, and test the `BarcodeRegistry` contract locally.

# Barcode: compile, deploy, and test

This folder contains a minimal Hardhat setup to compile and deploy `BarcodeRegistry.sol`, plus a tiny front end to test the contract locally with MetaMask.

- <a href="docs/slides.html" target="_blank">Barcode usage</a>

---

## Where to find compile/validation notes

See [Intents](intents.txt) for step-by-step local run commands, troubleshooting notes, and quick validation steps. It includes the exact Hardhat commands used for compilation, node, and deployment.

---

# Architecture

View the interactive architecture diagram in your browser:

- <a href="docs/architecture.html" target="_blank">Architecture Overview</a>


---

## Files of interest

- `contracts/BarcodeRegistry.sol` - the smart contract (registry of barcode → product, producers allowlist).
- `presentation/index.html` - minimal front-end UI.
- `presentation/app.js` - front-end logic (connect, register, verify, producers admin, events listing).
- `scripts/deploy.js` - deploy script for Hardhat.
- `scripts/add_test_producer.js` - helper script that uses the owner account to add a test producer and register a sample product.
- `intents.txt` - conversational notes, how-to and compile/validation tips (see "How to run locally").

---

## `contracts/BarcodeRegistry.sol` — function reference

Brief: keeps a mapping of barcode → Product and an allowlist of approved producer addresses. Key functions:

- constructor()
  - sets `owner = msg.sender` at deployment.

- addProducer(address _producer, string memory _name) — onlyOwner
  - Marks `_producer` as allowed to register products (`producers[_producer] = true`).
  - Stores an optional display name in `producerName[_producer]`.
  - Emits `ProducerAdded(_producer, _name)`.

- removeProducer(address _producer) — onlyOwner
  - Removes the allowlist entry for `_producer` and deletes its name.
  - Emits `ProducerRemoved(_producer)`.

- registerProduct(string memory barcode, string memory productName, address producerAddr) — onlyProducerOrOwner
  - Can be called by the `owner` or any address in `producers` mapping.
  - Fails if the `barcode` is already registered.
  - Stores a `Product` struct `{ productName, producerAddr, exists=true }` in `products[barcode]`.
  - Emits `ProductRegistered(barcode, productName, producerAddr)`.

- verifyProduct(string memory barcode) public view returns (bool, string memory, address)
  - Returns `(exists, productName, producerAddr)` for the given `barcode`.

Events:
- `ProductRegistered(string barcode, string productName, address producer)` — emitted on registration.
- `ProducerAdded(address producer, string name)` — emitted when owner adds a producer.
- `ProducerRemoved(address producer)` — emitted when owner removes a producer.

Access control:
- `owner` is the deployer. Only the owner can add/remove producers. Producers (addresses marked in `producers`) may register products.

---

## `presentation/app.js` — function reference

This file implements the UI glue using `ethers.js` (UMD) and the Web3 provider injected by MetaMask. Key functions and responsibilities:

- ensureEthers()
  - Verifies that `window.ethers` is present (the bundled `ethers.min.js` file).
  - Throws an error if ethers.js is missing.

- ensureLocalNetwork(provider)
  - Checks the connected chain via `eth_chainId` and attempts to programmatically request MetaMask to switch to Hardhat local chain (`0x7a69`, decimal 31337).
  - If the chain is unknown to MetaMask, attempts `wallet_addEthereumChain` with RPC `http://127.0.0.1:8545` and then switches.
  - Returns `true` if successfully on the local network, otherwise `false`.

- connect()
  - Loads ethers, requests account access (`eth_requestAccounts`), creates a `Web3Provider` and `Signer`, and instantiates the contract with the configured `CONTRACT_ADDRESS` and `ABI`.
  - Calls `ensureLocalNetwork` to prompt the user to switch MetaMask if needed.
  - Displays the connected address and the contract owner in the UI, and enables/disables the Register button based on whether the connected address is the owner (there's a `forceEnable` override for development).
  - Calls `refreshLists()` to populate past events into the UI lists.

- refreshLists()
  - Queries past events via `contract.queryFilter(contract.filters.ProductRegistered())` and `contract.queryFilter(contract.filters.ProducerAdded())`.
  - Appends each event to the DOM lists: registered products and producers with their display names.

- register()
  - Reads `barcode`, `name`, and `producer` inputs from the UI and calls `contract.registerProduct(barcode, name, producer)` via the signer.
  - Updates `#output` with the tx hash when sent and then 'Registered' after confirmation.
  - Errors are formatted and displayed (see `formatError` helper in the code).

- verify()
  - Calls `contract.verifyProduct(barcode)` to read product info and shows the returned tuple in `#output`.

- addProducerHandler() / removeProducerHandler()
  - Owner-only actions that call `contract.addProducer(addr, name)` and `contract.removeProducer(addr)` respectively.
  - Update `#output` with tx status and errors.

Utility helpers in `app.js`:
- `formatError(e)` — normalizes the common ethers error shapes and returns a readable string for UI display.

---





