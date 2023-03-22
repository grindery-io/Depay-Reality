// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import "../reality/IRealityETH.sol";
import "./GrtOffer.sol";
import "hardhat/console.sol";

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

    // function initializedVersion() external view returns (uint8) {
    //     return _getInitializedVersion();
    // }

    function initializePool(address addrGRT) external initializer {
        __Ownable_init();
        initializeGrtTokenUtils(addrGRT);
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    function setGrtAddress(address grt) external onlyOwner {
        _addrGRT = grt;
    }

    function depositGRTWithOffer(
        uint256 amntDepGRT,
        bytes32 offerId,
        address destAddr
    ) external returns (bool) {
        require(destAddr != address(0), "zero address as destination address");
        require(_offers[offerId].isActive, "the offer is inactive");
        depositGRT(amntDepGRT);
        bytes32 tradeId = keccak256(
            abi.encodePacked(msg.sender, _noncesDeposit[msg.sender])
        );
        emit LogTrade(tradeId, _addrGRT, amntDepGRT, offerId);
        Trade storage trade = _trades[tradeId];
        trade.userAddr = msg.sender;
        trade.destAddr = destAddr;
        trade.deposit = setTokenInfo(_addrGRT, amntDepGRT, block.chainid);
        trade.offerId = offerId;
        _noncesDeposit[msg.sender]++;
        return true;
    }

    function getIdOffer(bytes32 tradeId) external view returns (bytes32) {
        return _trades[tradeId].offerId;
    }

    function getNonceDeposit(address user) external view returns (uint256) {
        return _noncesDeposit[user];
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
