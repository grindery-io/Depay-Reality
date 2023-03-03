// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

contract GrtOffer is OwnableUpgradeable {

    struct Offer {
        uint256 chainId;
        address token;
        address priceAddress;
        bytes32 upperLimitFn;
        bytes32 lowerLimitFn;
    }

    // Mapping declarations
    mapping(bytes32 => Offer) internal _offers;
    mapping(address => uint256) internal _nonces;

    event LogNewOffer(bytes32 indexed _idOffer, address indexed _contractAddress, address indexed _token, uint256 _chainId);

    // Initialize
    function initializeGrtOffer() external initializer {
        __Ownable_init();
    }

    function decodeBytes(bytes memory data) internal pure returns (bytes32) {
        return abi.decode(data, (bytes32));
    }

    function decodePrice(bytes memory data) internal pure returns (uint256) {
        return abi.decode(data, (uint256));
    }

    function getAddressOffer(bytes32 idOffer) external view returns (address) {
        return _offers[idOffer].priceAddress;
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

    function getNonceUser(address user) external view returns (uint256) {
        return _nonces[user];
    }

    function getLatestPrice(address chainlinkContract) public view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = AggregatorV3Interface(
            chainlinkContract
        ).latestRoundData();
        return price;
    }

    function setOfferWithGrindery(
        address token,
        bytes calldata upperLimitFn,
        bytes calldata lowerLimitFn
    ) external returns (bool) {
        bytes32 idOffer = keccak256(abi.encodePacked(
            msg.sender,
            _nonces[msg.sender],
            block.chainid
        ));
        _offers[idOffer].chainId = block.chainid;
        _offers[idOffer].token = token;
        _offers[idOffer].lowerLimitFn = keccak256(abi.encodePacked(lowerLimitFn));
        _offers[idOffer].upperLimitFn = keccak256(abi.encodePacked(upperLimitFn));
        emit LogNewOffer(
            idOffer,
            _offers[idOffer].priceAddress,
            token,
            block.chainid
        );
        _nonces[msg.sender]++;
        return true;
    }

    function setOfferWithContract(
        address token,
        address priceAddress,
        bytes calldata upperLimitFn,
        bytes calldata lowerLimitFn
    ) external returns (bool) {
        bytes32 idOffer = keccak256(abi.encodePacked(
            msg.sender,
            _nonces[msg.sender],
            block.chainid
        ));
        _offers[idOffer].chainId = block.chainid;
        _offers[idOffer].token = token;
        _offers[idOffer].priceAddress = priceAddress;
        _offers[idOffer].lowerLimitFn = keccak256(abi.encodePacked(lowerLimitFn));
        _offers[idOffer].upperLimitFn = keccak256(abi.encodePacked(upperLimitFn));
        emit LogNewOffer(
            idOffer,
            _offers[idOffer].priceAddress,
            token,
            block.chainid
        );
        _nonces[msg.sender]++;
        return true;
    }

    function getUpperPriceLimitFromGrindery(
        bytes32 idOffer,
        bytes calldata fn
    ) external view returns (int256) {
        require(
            _offers[idOffer].priceAddress == address(0),
            "GRT offers: the price limit should be updated via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[idOffer].upperLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (address chainlink, int256 value) = abi.decode(fn, (address, int256));
        return getLatestPrice(chainlink) + value;
    }

    function getLowerPriceLimitFromGrindery(
        bytes32 idOffer,
        bytes calldata fn
    ) external view returns (int256) {
        require(
            _offers[idOffer].priceAddress == address(0),
            "GRT offers: the price limit should be updated via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[idOffer].lowerLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (address chainlink, int256 value) = abi.decode(fn, (address, int256));
        return getLatestPrice(chainlink) - value;
    }

    function getUpperPriceLimitFromContract(
        bytes32 idOffer,
        bytes calldata fn
    ) external view returns (uint256) {
        require(
            _offers[idOffer].priceAddress != address(0),
            "GRT offers: not allowed to modify the price limit via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[idOffer].upperLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (bool success, bytes memory result) = _offers[idOffer].priceAddress.staticcall(fn);
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
            _offers[idOffer].priceAddress != address(0),
            "GRT offers: not allowed to modify the price limit via an external smart contract"
        );
        require(
            keccak256(abi.encodePacked(fn)) == _offers[idOffer].lowerLimitFn,
            "GRT offers: the function does not match the one entered in the offer"
        );
        (bool success, bytes memory result) = _offers[idOffer].priceAddress.staticcall(fn);
        if (success) {
            return abi.decode(result, (uint256));
        }
        return 0;
    }

}