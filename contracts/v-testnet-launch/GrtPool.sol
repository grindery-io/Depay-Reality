// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./GrtOffer.sol";

contract GrtPool is OwnableUpgradeable, GrtOffer, UUPSUpgradeable {
    struct Trade {
        address userAddr;
        address destAddr;
        TokenInfo deposit;
        bytes32 offerId;
    }

    struct TokenInfo {
        address token;
        uint256 amount;
        uint256 chainId;
    }

    mapping(bytes32 => Trade) internal _trades;
    mapping(address => uint256) internal _noncesDeposit;

    event LogTrade(
        bytes32 indexed _idTrade,
        address indexed _token,
        uint256 indexed _amount,
        bytes32 _idOffer
    );

    function initialize() external initializer {
        __Ownable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    error TransferedAmountMustBePositive();
    error ZeroAddressIsNotAllowed();
    error OfferInactive();
    error FailedToSendNativeTokens();

    function depositETHAndAcceptOffer(
        bytes32 offerId,
        address destAddr
    ) external payable returns (bytes32) {
        if(msg.value <= 0)
            revert TransferedAmountMustBePositive();
        if(destAddr == address(0))
            revert ZeroAddressIsNotAllowed();
        if(!_offers[offerId].isActive)
            revert OfferInactive();
        (bool sent, ) = address(this).call{value: msg.value}("");
        if(!sent)
            revert FailedToSendNativeTokens();
        bytes32 tradeId = keccak256(
            abi.encodePacked(msg.sender, _noncesDeposit[msg.sender])
        );
        Trade storage trade = _trades[tradeId];
        trade.userAddr = msg.sender;
        trade.destAddr = destAddr;
        trade.deposit = TokenInfo(address(0), msg.value, block.chainid);
        trade.offerId = offerId;
        _noncesDeposit[msg.sender]++;
        emit LogTrade(tradeId, address(0), msg.value, offerId);
        return tradeId;
    }

    function getNonceDeposit(address user) external view returns (uint256) {
        return _noncesDeposit[user];
    }

    function getIdOffer(bytes32 tradeId) external view returns (bytes32) {
        return _trades[tradeId].offerId;
    }

    function getRequester(bytes32 tradeId) external view returns (address) {
        return _trades[tradeId].userAddr;
    }

    function getRecipient(bytes32 tradeId) external view returns (address) {
        return _trades[tradeId].destAddr;
    }

    function getDepositToken(bytes32 tradeId) external view returns (address) {
        return _trades[tradeId].deposit.token;
    }

    function getDepositAmount(bytes32 tradeId) external view returns (uint256) {
        return _trades[tradeId].deposit.amount;
    }

    function getDepositChainId(
        bytes32 tradeId
    ) external view returns (uint256) {
        return _trades[tradeId].deposit.chainId;
    }

    receive() external payable {}
}
