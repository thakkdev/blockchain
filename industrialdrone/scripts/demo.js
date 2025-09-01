const { ethers } = require("hardhat");
const deploy = require("./deploy");

async function main() {
  const { registry, manager, logger } = await deploy();

  const [operator, drone1, drone2] = await ethers.getSigners();

  // Register drones
  await (await registry.registerDrone(drone1.address, "Drone #1: battery=90, loc=A" )).wait();
  await (await registry.registerDrone(drone2.address, "Drone #2: battery=80, loc=B" )).wait();

  // Post a task
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const tx = await manager.postTask("Inspect Tank A-12", deadline);
  await tx.wait();

  // Drones bid
  await (await manager.connect(drone1).bidForTask(0)).wait();
  await (await manager.connect(drone2).bidForTask(0)).wait();

  // Assign task (picks first bidder)
  await (await manager.assignTask(0)).wait();

  const dataHash = ethers.keccak256(ethers.toUtf8Bytes("ok:images:cid123"));
  await (await logger.connect(drone1).logInspection(0, dataHash)).wait();

  const stored = await logger.getLog(0);
  console.log("Stored hash:", stored);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
