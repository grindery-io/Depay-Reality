// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../reality/IRealityETH.sol";

import "hardhat/console.sol";

contract GrtSatellite is OwnableUpgradeable {

    struct PaymentInfo {
        address token;
        address from;
        address to;
        uint256 amount;
        uint256 chainIdDeposit;
        bytes32 requestId;
        uint256 offerId;
    }

    mapping(bytes32 => PaymentInfo) internal _payments;

    // Event declarations
    // event LogOfferPaidSatelliteCrossChain(address indexed _from, address indexed _to, address indexed _token, uint _amount);

    event LogOfferPaidSatelliteCrossChain(bytes32 indexed _idRequest, uint256 indexed _idOffer, bytes32 indexed _paymentId);

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
        bytes32 paymentId = keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit));
        emit LogOfferPaidSatelliteCrossChain(idRequest, idOffer, paymentId);
        _payments[paymentId] = PaymentInfo(
            token,
            msg.sender,
            to,
            amount,
            chainIdDeposit,
            idRequest,
            idOffer
        );
        return true;
    }

    // Pay the offer cross chain (Native token)
    function payOfferCrossChainNative(bytes32 idRequest, uint256 idOffer, uint256 chainIdDeposit, address to) external payable returns (bool) {
        (bool success, ) = to.call{value: msg.value}("");
        if (success) {
            bytes32 paymentId = keccak256(abi.encodePacked(idRequest, idOffer, chainIdDeposit));
            emit LogOfferPaidSatelliteCrossChain(idRequest, idOffer, paymentId);
            _payments[paymentId] = PaymentInfo(
                address(0),
                msg.sender,
                to,
                msg.value,
                chainIdDeposit,
                idRequest,
                idOffer
            );
        }
        return success;
    }

    function getTokenPayment(bytes32 paymentId) external view returns (address) {
        return _payments[paymentId].token;
    }

    function getSenderPayment(bytes32 paymentId) external view returns (address) {
        return _payments[paymentId].from;
    }

    function getReceiverPayment(bytes32 paymentId) external view returns (address) {
        return _payments[paymentId].to;
    }

    function getAmountPayment(bytes32 paymentId) external view returns (uint256) {
        return _payments[paymentId].amount;
    }

    function getChainIdDeposit(bytes32 paymentId) external view returns (uint256) {
        return _payments[paymentId].chainIdDeposit;
    }

    function getRequestId(bytes32 paymentId) external view returns (bytes32) {
        return _payments[paymentId].requestId;
    }

    function getOfferId(bytes32 paymentId) external view returns (uint256) {
        return _payments[paymentId].offerId;
    }

}