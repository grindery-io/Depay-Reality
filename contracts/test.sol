// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import './RealityETH_ERC20_v3_0.sol';
//import './IERC20.sol';
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts/utils/Strings.sol";


import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract test is RealityETH_ERC20_v3_0, OwnableUpgradeable {

    function initialize() external initializer {
        __Ownable_init();
    }

    // function getOwner() external view returns (address) {
    //    return _owner;
    // }

    function init() external view returns (string memory) {
        // return Strings.toHexString(uint256(uint160(msg.sender)), 20);

        return Strings.toHexString(10);
    }

    function addressToString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }

    function uintToString(uint256 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }

    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

}