// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;


contract PriceTest {

    function encodeArgs(uint256 a, uint256 b) external pure returns (bytes memory) {
        return abi.encode(a, b);
    }


    function setPrice(uint256 a, uint256 b) external pure returns (uint256) {
        return a + b;
    }


}