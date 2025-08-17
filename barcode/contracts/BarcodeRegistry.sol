// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BarcodeRegistry {
    struct Product {
        string productName;
        address producer;
        bool exists;
    }

    mapping(string => Product) private products;
    address public owner;

    // producer allowlist and optional display name
    mapping(address => bool) public producers;
    mapping(address => string) public producerName;

    event ProductRegistered(string barcode, string productName, address producer);
    event ProducerAdded(address producer, string name);
    event ProducerRemoved(address producer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call");
        _;
    }

    modifier onlyProducerOrOwner() {
        require(msg.sender == owner || producers[msg.sender], "Not authorized to register");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addProducer(address _producer, string memory _name) public onlyOwner {
        producers[_producer] = true;
        producerName[_producer] = _name;
        emit ProducerAdded(_producer, _name);
    }

    function removeProducer(address _producer) public onlyOwner {
        producers[_producer] = false;
        delete producerName[_producer];
        emit ProducerRemoved(_producer);
    }

    // Now either owner or an approved producer address can register a product.
    function registerProduct(string memory barcode, string memory productName, address producerAddr) public onlyProducerOrOwner {
        require(!products[barcode].exists, "Product already registered");
        products[barcode] = Product(productName, producerAddr, true);
        emit ProductRegistered(barcode, productName, producerAddr);
    }

    function verifyProduct(string memory barcode) public view returns (bool, string memory, address) {
        Product memory p = products[barcode];
        if (p.exists) {
            return (true, p.productName, p.producer);
        } else {
            return (false, "", address(0));
        }
    }
}
