// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract LiquidityWallet is Ownable {
    receive() external payable  {}

    function withdraw(address _addrGrtToken, uint256 amount) external onlyOwner {
        uint256 balance = IERC20(_addrGrtToken).balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");
      
        require(IERC20(_addrGrtToken).transfer(msg.sender, amount), "Transaction Failed");
    }

    function payOffer(address addrToken, address addrOfferer, uint256 amount) external onlyOwner { 
        require(IERC20(addrToken).transfer(addrOfferer, amount), "Transaction Failed");
    }

    function payOfferWithZapier(address addrToken, address addrZapier, address addrOfferer, uint256 amount) external {
        uint256 allowance = IERC20(addrToken).allowance(addrZapier, address(this));
        require(allowance >= amount, "Allowance is insufficient");

        IERC20(addrToken).transferFrom(addrZapier, addrOfferer, amount);
    }
}
