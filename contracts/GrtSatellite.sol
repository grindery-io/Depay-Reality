// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./reality/IRealityETH.sol";

import "hardhat/console.sol";

contract GrtSatellite is OwnableUpgradeable {

    struct PaymentInfo {
        address token;
        address from;
        address to;
        uint256 amount;
    }

    mapping(bytes32 => PaymentInfo) internal _payments;

    // Event declarations
    // event LogOfferPaidSatelliteCrossChain(address indexed _from, address indexed _to, address indexed _token, uint _amount);

    event LogOfferPaidSatelliteCrossChain(bytes32 indexed _idRequest, uint256 indexed _idOffer, uint256 indexed _chainId);

    // Initialize
    function initializeSatellite() external initializer {
        __Ownable_init();
    }

    // Pay the offer cross chain (ERC20 token)
    function payOfferCrossChainERC20(
        bytes32 idRequest,
        uint256 idOffer,
        uint256 chainIdDeposit,
        address token,
        address to,
        uint amount
    ) external returns (bool) {
        IERC20(token).transferFrom(msg.sender, to, amount);
        emit LogOfferPaidSatelliteCrossChain(idRequest, idOffer, chainIdDeposit);
        _payments[
            keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit))
        ] = PaymentInfo(token, msg.sender, to, amount);
        return true;
    }

    // Pay the offer cross chain (Native token)
    function payOfferCrossChainNative(bytes32 idRequest, uint256 idOffer, uint256 chainIdDeposit, address to) external payable returns (bool) {
        (bool success, ) = to.call{value: msg.value}("");
        if (success) {
            emit LogOfferPaidSatelliteCrossChain(idRequest, idOffer, chainIdDeposit);
            _payments[
                keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit))
            ] = PaymentInfo(address(0), msg.sender, to, msg.value);
        }
        return success;
    }

    function getTokenPayment(bytes32 idRequest, uint256 idOffer, uint256 chainIdDeposit) external view returns (address) {
        return _payments[
            keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit))
        ].token;
    }

    function getSenderPayment(bytes32 idRequest, uint256 idOffer, uint256 chainIdDeposit) external view returns (address) {
        return _payments[
            keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit))
        ].from;
    }

    function getReceiverPayment(bytes32 idRequest, uint256 idOffer, uint256 chainIdDeposit) external view returns (address) {
        return _payments[
            keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit))
        ].to;
    }

    function getAmountPayment(bytes32 idRequest, uint256 idOffer, uint256 chainIdDeposit) external view returns (uint256) {
        return _payments[
            keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit))
        ].amount;
    }

}