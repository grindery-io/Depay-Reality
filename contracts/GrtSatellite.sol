// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./reality/IRealityETH.sol";

import "hardhat/console.sol";

contract GrtSatellite is OwnableUpgradeable {

    // Event declarations
    event LogOfferPaidSatelliteCrossChain(address indexed _from, address indexed _to, address indexed _token, uint _amount);

    // Initialize
    function initializeSatellite() external initializer {
        __Ownable_init();
    }

    // Pay the offer cross chain (ERC20 token)
    function payOfferCrossChainERC20(
        address token,
        address to,
        uint amount
    ) external returns (bool) {
        IERC20(token).transferFrom(msg.sender, to, amount);
        emit LogOfferPaidSatelliteCrossChain(msg.sender, to, token, amount);
        return true;
    }

    // Pay the offer cross chain (Native token)
    function payOfferCrossChainNative(address to) external payable returns (bool) {
        (bool success, ) = to.call{value: msg.value}("");
        if (success) {
            emit LogOfferPaidSatelliteCrossChain(msg.sender, to, address(0), msg.value);
        }
        return success;
    }

}