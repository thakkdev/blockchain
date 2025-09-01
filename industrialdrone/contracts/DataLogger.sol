// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./TaskManager.sol";

contract DataLogger {
    event InspectionLogged(uint256 indexed taskId, address indexed drone, bytes32 dataHash, uint256 timestamp);

    TaskManager public manager;

    mapping(uint256 => bytes32) private logs;

    constructor(TaskManager _manager) {
        manager = _manager;
    }

    function logInspection(uint256 taskId, bytes32 dataHash) public {
        (, , address assigned, , ) = manager.getTask(taskId);
        require(assigned != address(0), "not assigned");
        require(msg.sender == assigned, "only assignee");
        require(logs[taskId] == bytes32(0), "already logged");
        logs[taskId] = dataHash;
        emit InspectionLogged(taskId, msg.sender, dataHash, block.timestamp);
    }

    function getLog(uint256 taskId) public view returns (bytes32) {
        return logs[taskId];
    }
}
