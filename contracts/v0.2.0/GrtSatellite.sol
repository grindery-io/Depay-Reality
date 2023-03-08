// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../reality/IRealityETH.sol";

import "hardhat/console.sol";

contract GrtSatellite is OwnableUpgradeable {


    address internal _addrGRT;

    event LogRewardOffer(
        bytes32 indexed _idOffer,
        address indexed _token,
        uint256 indexed _amount
    );

    function initializeGrtOffer(address addrGRT) external initializer {
        __Ownable_init();
        _addrGRT = addrGRT;
    }

    function rewardOffer(
        bytes32 idOffer,
        uint256 amount
    ) external returns (bool) {
        IERC20(_addrGRT).transfer(msg.sender, amount);
        emit LogRewardOffer(idOffer, _addrGRT, amount);
        return true;
    }


}