const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [operator] = await ethers.getSigners();
  console.log("Operator:", operator.address);

  const DroneRegistry = await ethers.getContractFactory("DroneRegistry");
  const registry = await DroneRegistry.deploy();
  await registry.waitForDeployment();
  console.log("DroneRegistry:", await registry.getAddress());

  const TaskManager = await ethers.getContractFactory("TaskManager");
  const manager = await TaskManager.deploy(await registry.getAddress());
  await manager.waitForDeployment();
  console.log("TaskManager:", await manager.getAddress());

  const DataLogger = await ethers.getContractFactory("DataLogger");
  const logger = await DataLogger.deploy(await manager.getAddress());
  await logger.waitForDeployment();
  console.log("DataLogger:", await logger.getAddress());

  // write frontend artifacts (addresses + ABIs)
  await writeFrontendArtifacts(
    await registry.getAddress(),
    await manager.getAddress(),
    await logger.getAddress()
  );

  return { registry, manager, logger };
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}

module.exports = main;

async function writeFrontendArtifacts(registryAddr, managerAddr, loggerAddr) {
  try {
    const outDir = path.join(__dirname, "..", "frontend", "src", "contracts");
    fs.mkdirSync(outDir, { recursive: true });

    const [reg, mgr, log] = await Promise.all([
      artifacts.readArtifact("DroneRegistry"),
      artifacts.readArtifact("TaskManager"),
      artifacts.readArtifact("DataLogger"),
    ]);

    const files = [
      { name: "DroneRegistry", address: registryAddr, abi: reg.abi },
      { name: "TaskManager", address: managerAddr, abi: mgr.abi },
      { name: "DataLogger", address: loggerAddr, abi: log.abi },
    ];

    for (const f of files) {
      const content = { address: f.address, abi: f.abi };
      fs.writeFileSync(path.join(outDir, `${f.name}.json`), JSON.stringify(content, null, 2));
    }

    const addresses = {
      DroneRegistry: registryAddr,
      TaskManager: managerAddr,
      DataLogger: loggerAddr,
    };
    fs.writeFileSync(path.join(outDir, `addresses.json`), JSON.stringify(addresses, null, 2));

    console.log("Wrote frontend contract artifacts to:", outDir);
  } catch (e) {
    console.warn("Could not write frontend artifacts:", e.message);
  }
}
