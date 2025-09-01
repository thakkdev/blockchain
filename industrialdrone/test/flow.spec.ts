import { expect } from "chai";
import { ethers } from "hardhat";

describe("Industrial Drone Flow", function () {
  it("registers, bids, assigns, logs", async function () {
    const [operator, drone1, drone2] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("DroneRegistry");
    const registry = await Registry.deploy();
    await registry.deployed();

    const Manager = await ethers.getContractFactory("TaskManager");
    const manager = await Manager.deploy(registry.address);
    await manager.deployed();

    const Logger = await ethers.getContractFactory("DataLogger");
    const logger = await Logger.deploy(manager.address);
    await logger.deployed();

    await expect(registry.registerDrone(drone1.address, "d1")).to.emit(registry, "DroneRegistered");
    await expect(registry.registerDrone(drone2.address, "d2")).to.emit(registry, "DroneRegistered");

    const deadline = Math.floor(Date.now() / 1000) + 600;
    await expect(manager.postTask("inspect site X", deadline)).to.emit(manager, "TaskPosted");

    await expect(manager.connect(drone1).bidForTask(0)).to.emit(manager, "TaskBid");
    await expect(manager.connect(drone2).bidForTask(0)).to.emit(manager, "TaskBid");

    await expect(manager.assignTask(0)).to.emit(manager, "TaskAssigned");

    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("result-ok"));
    await expect(logger.connect(drone1).logInspection(0, dataHash)).to.emit(logger, "InspectionLogged");

    expect(await logger.getLog(0)).to.equal(dataHash);
  });
});
