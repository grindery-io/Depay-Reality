// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/GrtTokenUtils.sol";
import "./utils/GrtOfferUtils.sol";

contract GrtOffer is GrtTokenUtils, GrtOfferUtils {
    event LogNewOffer(
        bytes32 indexed _idOffer,
        address indexed _contractAddress,
        address indexed _token,
        uint256 _chainId
    );
    event LogSetChainIdOffer(
        bytes32 indexed _idOffer,
        uint256 indexed _chainId
    );
    event LogSetTokenOffer(bytes32 indexed _idOffer, address indexed _token);
    event LogSetPriceContractAddressOffer(
        bytes32 indexed _idOffer,
        address indexed _priceContractAddress
    );
    event LogSetLowerLimitOffer(
        bytes32 indexed _idOffer,
        bytes32 indexed _lowerLimitFn
    );
    event LogSetUpperLimitOffer(
        bytes32 indexed _idOffer,
        bytes32 indexed _upperLimitFn
    );
    event LogSetStatusOffer(bytes32 indexed _idOffer, bool indexed _isActive);

    function setChainIdOffer(bytes32 offerId, uint256 chainId) external {
        require(
            msg.sender == _offers[offerId].user,
            "you are not allowed to modify this offer"
        );
        _offers[offerId].chainId = chainId;
        emit LogSetChainIdOffer(offerId, chainId);
    }

    function setTokenOffer(bytes32 offerId, address token) external {
        require(
            msg.sender == _offers[offerId].user,
            "you are not allowed to modify this offer"
        );
        _offers[offerId].token = token;
        emit LogSetTokenOffer(offerId, token);
    }

    function setPriceContractAddressOffer(
        bytes32 offerId,
        address priceContractAddress
    ) external {
        require(
            msg.sender == _offers[offerId].user,
            "you are not allowed to modify this offer"
        );
        _offers[offerId].priceContractAddress = priceContractAddress;
        emit LogSetPriceContractAddressOffer(offerId, priceContractAddress);
    }

    function setLowerLimitOffer(bytes32 offerId, bytes calldata args) external {
        require(
            msg.sender == _offers[offerId].user,
            "you are not allowed to modify this offer"
        );
        bytes32 h = keccak256(abi.encodePacked(args));
        _offers[offerId].lowerLimitFn = h;
        emit LogSetLowerLimitOffer(offerId, h);
    }

    function setUpperLimitOffer(bytes32 offerId, bytes calldata args) external {
        require(
            msg.sender == _offers[offerId].user,
            "you are not allowed to modify this offer"
        );
        bytes32 h = keccak256(abi.encodePacked(args));
        _offers[offerId].upperLimitFn = h;
        emit LogSetUpperLimitOffer(offerId, h);
    }

    function setIsActive(bytes32 offerId, bool isActive) external {
        require(
            msg.sender == _offers[offerId].user,
            "you are not allowed to modify this offer"
        );
        _offers[offerId].isActive = isActive;
        emit LogSetStatusOffer(offerId, isActive);
    }

    function setOffer(
        address token,
        uint256 chainId,
        address priceContractAddress,
        bytes calldata upperLimitFn,
        bytes calldata lowerLimitFn
    ) external returns (bytes32) {
        require(
            msg.sender != address(0),
            "setOffer from zero address is not allowed"
        );
        require(
            _stakes[msg.sender][chainId] > 1,
            "Not enough staked GRT to set up an offer"
        );
        bytes32 offerId = keccak256(
            abi.encodePacked(msg.sender, _noncesOffer[msg.sender])
        );
        _offers[offerId].user = msg.sender;
        _offers[offerId].isActive = true;
        _offers[offerId].chainId = chainId;
        _offers[offerId].token = token;
        _offers[offerId].priceContractAddress = priceContractAddress;
        _offers[offerId].lowerLimitFn = keccak256(
            abi.encodePacked(lowerLimitFn)
        );
        _offers[offerId].upperLimitFn = keccak256(
            abi.encodePacked(upperLimitFn)
        );
        emit LogNewOffer(
            offerId,
            _offers[offerId].priceContractAddress,
            token,
            chainId
        );
        _noncesOffer[msg.sender]++;
        return offerId;
    }

    function checkParametersLowerLimitOffer(
        bytes32 offerId,
        address priceContractAddress,
        bytes calldata args
    ) external view returns (bool) {
        return
            keccak256(abi.encodePacked(args)) ==
            _offers[offerId].lowerLimitFn &&
            priceContractAddress == _offers[offerId].priceContractAddress;
    }

    function checkParametersUpperLimitOffer(
        bytes32 offerId,
        address priceContractAddress,
        bytes calldata args
    ) external view returns (bool) {
        return
            keccak256(abi.encodePacked(args)) ==
            _offers[offerId].upperLimitFn &&
            priceContractAddress == _offers[offerId].priceContractAddress;
    }

    function getUpperPriceLimitFromContract(
        bytes32 offerId,
        bytes calldata fn
    ) external view returns (uint256) {
        require(
            _offers[offerId].priceContractAddress != address(0),
            "GRT offers: not allowed to modify the price limit via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[offerId].upperLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (bool success, bytes memory result) = _offers[offerId]
            .priceContractAddress
            .staticcall(fn);
        if (success) {
            return abi.decode(result, (uint256));
        }
        return 0;
    }

    function getLowerPriceLimitFromContract(
        bytes32 offerId,
        bytes calldata fn
    ) external view returns (uint256) {
        require(
            _offers[offerId].priceContractAddress != address(0),
            "GRT offers: not allowed to modify the price limit via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[offerId].lowerLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (bool success, bytes memory result) = _offers[offerId]
            .priceContractAddress
            .staticcall(fn);
        if (success) {
            return abi.decode(result, (uint256));
        }
        return 0;
    }
}
