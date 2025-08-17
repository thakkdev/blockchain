const hre = require("hardhat");

async function main() {
  const BarcodeRegistry = await hre.ethers.getContractFactory("BarcodeRegistry");
  const registry = await BarcodeRegistry.deploy();
  await registry.deployed();
  console.log("BarcodeRegistry deployed to:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
