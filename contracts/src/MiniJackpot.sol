// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";
import "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";

library JackpotErrors {
    error InsufficientFee();
    error UnauthorizedCaller();
}

contract MiniJackpot is IEntropyConsumer {
    event JackpotEntered(uint64 sequenceNumber, address indexed player);
    event JackpotResult(uint64 sequenceNumber, address indexed player, bool won, uint256 prize, uint256 randomNumber);

    IEntropy private entropy;
    address private entropyProvider;

    uint256 public jackpotPool;

    mapping(uint64 => address) public requestToPlayer;

    constructor(address _entropy, address _provider) {
        entropy = IEntropy(_entropy);
        entropyProvider = _provider;
    }

    function play(bytes32 userRandomNumber) external payable {
        uint256 fee = entropy.getFee(entropyProvider);
        if (msg.value < fee) {
            revert JackpotErrors.InsufficientFee();
        }

        jackpotPool += msg.value - fee;

        uint64 sequenceNumber = entropy.requestWithCallback{value: fee}(
            entropyProvider,
            userRandomNumber
        );

        requestToPlayer[sequenceNumber] = msg.sender;

        emit JackpotEntered(sequenceNumber, msg.sender);
    }

    function entropyCallback(
        uint64 sequenceNumber,
        address,
        bytes32 randomNumber
    ) internal override {
        address player = requestToPlayer[sequenceNumber];
        bool won = (uint256(randomNumber) % 100) < 5;

        if (won) {
            uint256 prize = jackpotPool;
            jackpotPool = 0;
            payable(player).transfer(prize);

            emit JackpotResult(sequenceNumber, player, true, prize, uint256(randomNumber));
        } else {
            emit JackpotResult(sequenceNumber, player, false, 0, uint256(randomNumber));
        }

        delete requestToPlayer[sequenceNumber];
    }

    function getFee() public view returns (uint256 fee) {
        fee = entropy.getFee(entropyProvider);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    receive() external payable {}
}