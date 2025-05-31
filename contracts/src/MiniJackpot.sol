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
    event JackpotResult(uint64 sequenceNumber, address indexed player, bool won, uint256 prize);

    IEntropy private entropy;
    address private entropyProvider;

    uint256 public constant ENTRY_FEE = 0.005 ether;
    uint256 public jackpotPool;

    mapping(uint64 => address) public requestToPlayer;

    constructor(address _entropy, address _provider) {
        entropy = IEntropy(_entropy);
        entropyProvider = _provider;
    }

    function play() external payable {
        uint256 fee = entropy.getFee(entropyProvider);

        jackpotPool += ENTRY_FEE;

        uint64 sequenceNumber = entropy.requestWithCallback{value: fee}(
            entropyProvider,
            bytes32(uint256(uint160(msg.sender)))
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

            emit JackpotResult(sequenceNumber, player, true, prize);
        } else {
            emit JackpotResult(sequenceNumber, player, false, 0);
        }

        delete requestToPlayer[sequenceNumber];
    }

    function getFee() public view returns (uint256) {
        return entropy.getFee(entropyProvider);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropy);
    }

    receive() external payable {}
}