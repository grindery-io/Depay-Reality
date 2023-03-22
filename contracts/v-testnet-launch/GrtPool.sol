// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

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

    function initializePool() external initializer {
        __Ownable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    function depositETHAndAcceptOffer(
        uint256 amount,
        bytes32 offerId,
        address destAddr
    ) external payable returns (bytes32) {
        require(amount > 0, "Grindery Pool: amount must be positive.");
        require(
            destAddr != address(0),
            "Grindery Pool: zero address as destination address."
        );
        require(
            _offers[offerId].isActive,
            "Grindery Pool: the offer is inactive."
        );
        (bool sent, ) = address(this).call{value: amount}("");
        require(sent, "Grindery Pool: failed to send native tokens.");
        bytes32 tradeId = keccak256(
            abi.encodePacked(msg.sender, _noncesDeposit[msg.sender])
        );
        Trade storage trade = _trades[tradeId];
        trade.userAddr = msg.sender;
        trade.destAddr = destAddr;
        trade.deposit = setTokenInfo(address(0), amount, block.chainid);
        trade.offerId = offerId;
        _noncesDeposit[msg.sender]++;
        emit LogTrade(tradeId, address(0), amount, offerId);
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

    function setTokenInfo(
        address token,
        uint256 amount,
        uint256 chainId
    ) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }
}
