// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DroneRegistry {
    event DroneRegistered(address indexed drone, string metadata);

    mapping(address => string) private droneMetadata;

    function registerDrone(address droneAddress, string memory metadata) public {
        require(droneAddress != address(0), "invalid address");
        require(bytes(droneMetadata[droneAddress]).length == 0, "already registered");
        droneMetadata[droneAddress] = metadata;
        emit DroneRegistered(droneAddress, metadata);
    }

    function getDrone(address droneAddress) public view returns (string memory) {
        return droneMetadata[droneAddress];
    }
}
