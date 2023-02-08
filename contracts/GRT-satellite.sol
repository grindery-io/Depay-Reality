// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IRealityETH.sol";

contract GrtSatellite is OwnableUpgradeable {

    // Event declarations
    event LogHndOffrERC20CrossChain (address indexed _from, address indexed _to, address indexed _token, uint _amount);

    // Initialize
    function initializeSatellite() external initializer {
        __Ownable_init();
    }

    // Native token to do

    // Honour the offer cross chain (require dispute)
    function HnOfferERC20CrossChain(
        address token,
        address to,
        uint amount
    ) public returns (bool) {

        // Bond in GRT is 1 for the moment to simplify
        bool success = IERC20(token).transferFrom(msg.sender, to, amount);

        if (success) {
            emit LogHndOffrERC20CrossChain(msg.sender, to, token, amount);
        }

        return success;
    }


}