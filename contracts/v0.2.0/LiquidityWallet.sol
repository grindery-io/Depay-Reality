// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IGrtSatellite.sol";
import "hardhat/console.sol";

contract LiquidityWallet is Ownable {

    address _GrtSatellite;
    address _bot;

    constructor(
        address satellite,
        address bot
    ) {
        _bot = bot;
        _GrtSatellite = satellite;
    }

    receive() external payable {}

    function setBot(address bot) external onlyOwner {
        _bot = bot;
    }

    function setSatellite(address satellite) external onlyOwner {
        _GrtSatellite = satellite;
    }

    function withdrawERC20(
        address _addrGrtToken,
        uint256 amount
    ) external onlyOwner returns (bool) {
        return IERC20(_addrGrtToken).transfer(msg.sender, amount);
    }

    function withdrawNative(
        uint256 amount
    ) external onlyOwner returns (bool) {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = msg.sender.call{value: amount}("");
        require(sent, "Failed to send native tokens");
        return true;
    }

    function payOfferERC20(
        bytes32 idOffer,
        address token,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(msg.sender == owner() || msg.sender == _bot, "not allowed to pay the offer");
        IERC20(token).transfer(to, amount);
        return IGrtSatellite(_GrtSatellite).rewardOffer(idOffer, 1);
    }

    function payOfferNative(
        bytes32 idOffer,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(msg.sender == owner() || msg.sender == _bot, "not allowed to pay the offer");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Failed to send native tokens");
        return IGrtSatellite(_GrtSatellite).rewardOffer(idOffer, 1);
    }
}
