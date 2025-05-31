// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/MiniJackpot.sol";

contract DeployMiniJackpot is Script {
    function run() external {
        vm.startBroadcast();

        address entropyAddress = 0x549Ebba8036Ab746611B4fFA1423eb0A4Df61440;
        address entropyProvider = 0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344;
        new MiniJackpot(entropyAddress, entropyProvider);

        vm.stopBroadcast();
    }
}
