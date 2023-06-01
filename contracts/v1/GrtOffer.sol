// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "./utils/GrtOfferUtils.sol";

contract GrtOffer is GrtOfferUtils {
    event LogNewOffer(bytes32 indexed _idOffer, address indexed _token, uint256 _chainId);
    event LogSetChainIdOffer(bytes32 indexed _idOffer, uint256 indexed _chainId);
    event LogSetTokenOffer(bytes32 indexed _idOffer, address indexed _token);
    event LogSetMinPriceLimit(bytes32 indexed _idOffer, bytes32 indexed _lowerLimitFn);
    event LogSetMaxPriceLimit(bytes32 indexed _idOffer, bytes32 indexed _upperLimitFn);
    event LogSetStatusOffer(bytes32 indexed _idOffer, bool indexed _isActive);

    function setChainIdOffer(bytes32 offerId, uint256 chainId) external {
        require(msg.sender == _offers[offerId].user, "Grindery offer: you are not allowed to modify this offer.");
        _offers[offerId].chainId = chainId;
        emit LogSetChainIdOffer(offerId, chainId);
    }

    function setTokenOffer(bytes32 offerId, address token) external {
        require(msg.sender == _offers[offerId].user, "Grindery offer: you are not allowed to modify this offer.");
        _offers[offerId].token = token;
        emit LogSetTokenOffer(offerId, token);
    }

    function setMinPriceLimit(bytes32 offerId, bytes calldata minPriceLimit) external {
        require(msg.sender == _offers[offerId].user, "Grindery offer: you are not allowed to modify this offer.");
        bytes32 priceLimit = keccak256(abi.encodePacked(minPriceLimit));
        _offers[offerId].minPriceLimit = priceLimit;
        emit LogSetMinPriceLimit(offerId, priceLimit);
    }

    function setMaxPriceLimit(bytes32 offerId, bytes calldata maxPriceLimit) external {
        require(msg.sender == _offers[offerId].user, "Grindery offer: you are not allowed to modify this offer.");
        bytes32 priceLimit = keccak256(abi.encodePacked(maxPriceLimit));
        _offers[offerId].maxPriceLimit = priceLimit;
        emit LogSetMaxPriceLimit(offerId, priceLimit);
    }

    function setIsActive(bytes32 offerId, bool isActive) external {
        require(msg.sender == _offers[offerId].user, "Grindery offer: you are not allowed to modify this offer.");
        _offers[offerId].isActive = isActive;
        emit LogSetStatusOffer(offerId, isActive);
    }

    function setOffer(
        address token,
        uint256 chainId,
        bytes calldata minPriceLimit,
        bytes calldata maxPriceLimit
    ) external returns (bytes32) {
        require(msg.sender != address(0), "Grindery offer: setOffer from zero address is not allowed");
        bytes32 offerId = keccak256(abi.encodePacked(msg.sender, _noncesOffer[msg.sender]));
        _offers[offerId].user = msg.sender;
        _offers[offerId].isActive = true;
        _offers[offerId].chainId = chainId;
        _offers[offerId].token = token;
        _offers[offerId].minPriceLimit = keccak256(abi.encodePacked(minPriceLimit));
        _offers[offerId].maxPriceLimit = keccak256(abi.encodePacked(maxPriceLimit));
        emit LogNewOffer(offerId, token, chainId);
        _noncesOffer[msg.sender]++;
        return offerId;
    }

    function checkMinPriceLimitOffer(bytes32 offerId, bytes calldata minPriceLimit) external view returns (bool) {
        return keccak256(abi.encodePacked(minPriceLimit)) == _offers[offerId].minPriceLimit;
    }

    function checkMaxPriceLimitOffer(bytes32 offerId, bytes calldata maxPriceLimit) external view returns (bool) {
        return keccak256(abi.encodePacked(maxPriceLimit)) == _offers[offerId].maxPriceLimit;
    }
}
