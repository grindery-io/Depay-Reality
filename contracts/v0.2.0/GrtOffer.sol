// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./utils/GrtTokenUtils.sol";
import "./utils/GrtOfferUtils.sol";
import "hardhat/console.sol";

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
    event LogSetTokenOffer(
        bytes32 indexed _idOffer,
        address indexed _token
    );
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
    event LogSetStatusOffer(
        bytes32 indexed _idOffer,
        bool indexed _isActive
    );

    function setChainIdOffer(
        bytes32 idOffer,
        uint256 chainId
    ) external {
        require(msg.sender == _offers[idOffer].user, "you are not allowed to modify this offer");
        _offers[idOffer].chainId = chainId;
        emit LogSetChainIdOffer(idOffer, chainId);
    }

    function setTokenOffer(
        bytes32 idOffer,
        address token
    ) external {
        require(msg.sender == _offers[idOffer].user, "you are not allowed to modify this offer");
        _offers[idOffer].token = token;
        emit LogSetTokenOffer(idOffer, token);
    }

    function setPriceContractAddressOffer(
        bytes32 idOffer,
        address priceContractAddress
    ) external {
        require(msg.sender == _offers[idOffer].user, "you are not allowed to modify this offer");
        _offers[idOffer].priceContractAddress = priceContractAddress;
        emit LogSetPriceContractAddressOffer(idOffer, priceContractAddress);
    }

    function setLowerLimitOffer(
        bytes32 idOffer,
        bytes calldata args
    ) external {
        require(msg.sender == _offers[idOffer].user, "you are not allowed to modify this offer");
        bytes32 h = keccak256(abi.encodePacked(args));
        _offers[idOffer].lowerLimitFn = h;
        emit LogSetLowerLimitOffer(idOffer, h);
    }

    function setUpperLimitOffer(
        bytes32 idOffer,
        bytes calldata args
    ) external {
        require(msg.sender == _offers[idOffer].user, "you are not allowed to modify this offer");
        bytes32 h = keccak256(abi.encodePacked(args));
        _offers[idOffer].upperLimitFn = h;
        emit LogSetUpperLimitOffer(idOffer, h);
    }

    function setIsActive(
        bytes32 idOffer,
        bool isActive
    ) external {
        require(msg.sender == _offers[idOffer].user, "you are not allowed to modify this offer");
        _offers[idOffer].isActive = isActive;
        emit LogSetStatusOffer(idOffer, isActive);
    }

    function setOffer(
        address token,
        uint256 chainId,
        address priceContractAddress,
        bytes calldata upperLimitFn,
        bytes calldata lowerLimitFn
    ) external returns (bytes32) {
        require(_stakes[msg.sender][chainId] > 1, "Not enough staked GRT to set up an offer");
        bytes32 idOffer = keccak256(
            abi.encodePacked(
                msg.sender,
                _noncesOffer[msg.sender]
            )
        );
        _offers[idOffer].user = msg.sender;
        _offers[idOffer].isActive = true;
        _offers[idOffer].chainId = chainId;
        _offers[idOffer].token = token;
        _offers[idOffer].priceContractAddress = priceContractAddress;
        _offers[idOffer].lowerLimitFn = keccak256(abi.encodePacked(lowerLimitFn));
        _offers[idOffer].upperLimitFn = keccak256(abi.encodePacked(upperLimitFn));
        emit LogNewOffer(
            idOffer,
            _offers[idOffer].priceContractAddress,
            token,
            chainId
        );
        _noncesOffer[msg.sender]++;
        return idOffer;
    }

    function checkParametersLowerLimitOffer(
        bytes32 idOffer,
        address priceContractAddress,
        bytes calldata args
    ) external view returns (bool) {
        return keccak256(abi.encodePacked(args)) == _offers[idOffer].lowerLimitFn
        && priceContractAddress == _offers[idOffer].priceContractAddress;
    }

    function checkParametersUpperLimitOffer(
        bytes32 idOffer,
        address priceContractAddress,
        bytes calldata args
    ) external view returns (bool) {
        return keccak256(abi.encodePacked(args)) == _offers[idOffer].upperLimitFn
        && priceContractAddress == _offers[idOffer].priceContractAddress;
    }

    function getUpperPriceLimitFromContract(
        bytes32 idOffer,
        bytes calldata fn
    ) external view returns (uint256) {
        require(
            _offers[idOffer].priceContractAddress != address(0),
            "GRT offers: not allowed to modify the price limit via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[idOffer].upperLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (bool success, bytes memory result) = _offers[idOffer].priceContractAddress.staticcall(fn);
        if (success) {
            return abi.decode(result, (uint256));
        }
        return 0;
    }

    function getLowerPriceLimitFromContract(
        bytes32 idOffer,
        bytes calldata fn
    ) external view returns (uint256) {
        require(
            _offers[idOffer].priceContractAddress != address(0),
            "GRT offers: not allowed to modify the price limit via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[idOffer].lowerLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (bool success, bytes memory result) = _offers[idOffer].priceContractAddress.staticcall(fn);
        if (success) {
            return abi.decode(result, (uint256));
        }
        return 0;
    }

}