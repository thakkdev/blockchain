// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DroneRegistry.sol";

contract TaskManager {
    struct Task {
        string description;
        uint256 deadline; // unix timestamp
        address assignedDrone;
        bool exists;
        bool completed;
        address[] bidders;
    }

    event TaskPosted(uint256 indexed taskId, string description, uint256 deadline);
    event TaskBid(uint256 indexed taskId, address indexed drone);
    event TaskAssigned(uint256 indexed taskId, address indexed drone);
    event TaskCompleted(uint256 indexed taskId, address indexed drone);

    mapping(uint256 => Task) private tasks;
    uint256 public nextTaskId;

    DroneRegistry public registry;
    address public operator;

    modifier onlyOperator() {
        require(msg.sender == operator, "not operator");
        _;
    }

    constructor(DroneRegistry _registry) {
        registry = _registry;
        operator = msg.sender;
    }

    function postTask(string memory description, uint256 deadline) public onlyOperator {
        require(deadline > block.timestamp, "deadline in past");
        uint256 taskId = nextTaskId++;
        Task storage t = tasks[taskId];
        t.description = description;
        t.deadline = deadline;
        t.exists = true;
        emit TaskPosted(taskId, description, deadline);
    }

    function bidForTask(uint256 taskId) public {
        Task storage t = tasks[taskId];
        require(t.exists, "task !exists");
        require(bytes(registry.getDrone(msg.sender)).length != 0, "drone not registered");
        t.bidders.push(msg.sender);
        emit TaskBid(taskId, msg.sender);
    }

    function assignTask(uint256 taskId) public onlyOperator {
        Task storage t = tasks[taskId];
        require(t.exists, "task !exists");
        require(t.assignedDrone == address(0), "already assigned");
        require(t.bidders.length > 0, "no bids");
        // simplistic: pick first bidder
        address chosen = t.bidders[0];
        t.assignedDrone = chosen;
        emit TaskAssigned(taskId, chosen);
    }

    function markCompleted(uint256 taskId) public {
        Task storage t = tasks[taskId];
        require(t.exists, "task !exists");
        require(msg.sender == t.assignedDrone, "only assignee");
        require(!t.completed, "already done");
        t.completed = true;
        emit TaskCompleted(taskId, msg.sender);
    }

    function getTask(uint256 taskId)
        public
        view
        returns (
            string memory description,
            uint256 deadline,
            address assignedDrone,
            bool completed,
            uint256 biddersCount
        )
    {
        Task storage t = tasks[taskId];
        require(t.exists, "task !exists");
        return (t.description, t.deadline, t.assignedDrone, t.completed, t.bidders.length);
    }
}
