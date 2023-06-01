// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./GrtLiquidityWallet.sol";
import "hardhat/console.sol";

contract GrtSatellite is OwnableUpgradeable, UUPSUpgradeable {
    address internal _addrGRT;

    event LogRewardOffer(bytes32 indexed _idOffer, address indexed _token, uint256 indexed _amount);
    event LogNewLiquidityContract(address indexed _LiquidityContractAddress);

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    function initializeGrtSatellite(address addrGRT) external initializer {
        __Ownable_init();
        _addrGRT = addrGRT;
    }

    function deployLiquidityContract() public returns (address) {
        GrtLiquidityWallet newContract = new GrtLiquidityWallet(address(this), msg.sender);
        newContract.transferOwnership(msg.sender);
        emit LogNewLiquidityContract(address(newContract));
        return address(newContract);
    }

    function rewardOffer(bytes32 offerId, uint256 amount) external returns (bool) {
        IERC20(_addrGRT).transfer(msg.sender, amount);
        emit LogRewardOffer(offerId, _addrGRT, amount);
        return true;
    }

    function getGrtAddress() external view returns (address) {
        return _addrGRT;
    }
}
