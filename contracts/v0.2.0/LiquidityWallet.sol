// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./IGrtPool.sol";
import "./IGrtSatellite.sol";

contract LiquidityWallet is Ownable {
    address _addrGrtPool;
    address _addrGrtToken;
    address _addrGrtSatellite;

    mapping(address => uint256) _balances;

    constructor(address addrGrtPool, address addrGrtToken, address addrGrtSatellite) {
        _addrGrtPool = addrGrtPool;
        _addrGrtToken = addrGrtToken;
        _addrGrtSatellite = addrGrtSatellite;
    }

    function getBalance() external view onlyOwner returns (uint256) {
        return _balances[msg.sender];
    }

    function deposit(uint256 amount) external onlyOwner {
        _balances[msg.sender] += amount;
        require(IERC20(_addrGrtToken).transferFrom(msg.sender, address(this), amount), "Transaction Failed");
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        _balances[msg.sender] -= amount;
         
        require(IERC20(_addrGrtToken).transfer(msg.sender, amount), "Transaction Failed");
    }

    function payOffer(bytes32 idOffer, uint256 amount) external onlyOwner { 
        require(IGrtPool(_addrGrtPool).getStatusOffer(idOffer), "Offer is not active");
        address offerer = IGrtPool(_addrGrtPool).getOfferer(idOffer);
        _balances[msg.sender] -= amount;
        IERC20(_addrGrtToken).transfer(offerer, amount);
        IERC20(_addrGrtToken).approve(_addrGrtSatellite, 1);
        IGrtSatellite(_addrGrtSatellite).rewardOffer(idOffer, 1);      
    }
}