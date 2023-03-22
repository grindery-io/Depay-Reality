// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./GrtLiquidityWallet.sol";

contract GrtSatellite is OwnableUpgradeable, UUPSUpgradeable {

    event LogNewLiquidityContract(address indexed _LiquidityContractAddress);

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    function initializeGrtSatellite() external initializer {
        __Ownable_init();
    }

    function deployLiquidityContract() external returns (address) {
        GrtLiquidityWallet newContract = new GrtLiquidityWallet(
            address(this),
            msg.sender
        );
        emit LogNewLiquidityContract(address(newContract));
        return address(newContract);
    }

}
