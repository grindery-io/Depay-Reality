// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

interface IGrtPool {
    function getStatusOffer(bytes32 idOffer) external view returns (bool);
    function getOfferer(bytes32 idOffer) external view returns (address);
    function deposit(uint256 amount) external;
}