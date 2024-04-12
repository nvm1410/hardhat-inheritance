// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Inheritance {
    address public owner;
    address public heir;
    uint256 public lastAction;
    uint256 public constant TIMEOUT = 30 days;

    event OwnershipTransferred(
        address indexed newOwner,
        address indexed newHeir
    );
    event Withdrawal(address indexed by, uint amount);

    error NotOwner();
    error NotHeir();
    error OwnerNotExpired();
    error InsufficientBalance();

    constructor(address _heir) {
        owner = msg.sender;
        heir = _heir;
        lastAction = block.timestamp;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier onlyHeir() {
        if (msg.sender != heir) {
            revert NotHeir();
        }
        if (block.timestamp <= (lastAction + TIMEOUT)) {
            revert OwnerNotExpired();
        }
        _;
    }

    // Function to withdraw ETH from the contract.
    function withdraw(uint _amount) public onlyOwner {
        if (address(this).balance < _amount) {
            revert InsufficientBalance();
        }
        lastAction = block.timestamp; // Update the last action time to reset the timer
        payable(msg.sender).transfer(_amount);
        emit Withdrawal(msg.sender, _amount);
    }

    // Function for the heir to take control if the owner has been inactive.
    function takeControl(address _newHeir) public onlyHeir {
        owner = msg.sender;
        heir = _newHeir;
        lastAction = block.timestamp; // Reset the interaction timer upon ownership transfer
        emit OwnershipTransferred(msg.sender, _newHeir);
    }

    // Allow the contract to receive ETH.
    receive() external payable {}

    // Fallback function in case someone sends ETH directly to the contract's address.
    fallback() external payable {}
}
