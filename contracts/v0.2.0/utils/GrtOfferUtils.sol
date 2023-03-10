// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract GrtOfferUtils is OwnableUpgradeable {

    struct Offer {
        address user;
        bool isActive;
        uint256 chainId;
        address token;
        address priceContractAddress;
        bytes32 upperLimitFn;
        bytes32 lowerLimitFn;
    }

    mapping(bytes32 => Offer) internal _offers;
    mapping(address => uint256) internal _noncesOffer;

    // function initializeGrtOfferUtils() internal initializer {
    //     __Ownable_init();
    // }

    function getOfferer(bytes32 idOffer) external view returns (address) {
        return _offers[idOffer].user;
    }

    function getStatusOffer(bytes32 idOffer) external view returns (bool) {
        return _offers[idOffer].isActive;
    }

    function getAddressPriceContractOffer(bytes32 idOffer) external view returns (address) {
        return _offers[idOffer].priceContractAddress;
    }

    function getLowerLimitFnHashOffer(bytes32 idOffer) external view returns (bytes32) {
        return _offers[idOffer].lowerLimitFn;
    }

    function getUpperLimitFnHashOffer(bytes32 idOffer) external view returns (bytes32) {
        return _offers[idOffer].upperLimitFn;
    }

    function getTokenOffer(bytes32 idOffer) external view returns (address) {
        return _offers[idOffer].token;
    }

    function getChainIdOffer(bytes32 idOffer) external view returns (uint256) {
        return _offers[idOffer].chainId;
    }

    function getNonceOffer(address user) external view returns (uint256) {
        return _noncesOffer[user];
    }

}
