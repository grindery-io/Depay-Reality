// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../reality/IRealityETH.sol";
import "./GrtOffer.sol";
import "hardhat/console.sol";

contract GrtPool is OwnableUpgradeable, GrtOffer {

    struct Trade {
        address userAddr;
        address destAddr;
        TokenInfo deposit;
        bytes32 idOffer;
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

    function initializePool(address addrGRT) external initializer {
        __Ownable_init();
        initializeGrtTokenUtils(addrGRT);
    }

    function setGrtAddress(address grt) external onlyOwner {
        _addrGRT = grt;
    }

    function depositGRTWithOffer(
        uint256 amntDepGRT,
        bytes32 idOffer,
        address destAddr
    ) external returns (bool) {
        depositGRT(amntDepGRT);
        bytes32 idTrade = keccak256(abi.encodePacked(
            msg.sender,
            _noncesDeposit[msg.sender]
        ));
        emit LogTrade(
            idTrade,
            _addrGRT,
            amntDepGRT,
            idOffer
        );
        Trade storage trade = _trades[idTrade];
        trade.userAddr = msg.sender;
        trade.destAddr = destAddr;
        trade.deposit = setTokenInfo(_addrGRT, amntDepGRT, block.chainid);
        trade.idOffer = idOffer;
        _noncesDeposit[msg.sender]++;
        return true;
    }

    function getIdOffer(bytes32 idTrade) external view returns (bytes32) {
        return _trades[idTrade].idOffer;
    }

    function getNonceDeposit(address user) external view returns (uint256) {
        return _noncesDeposit[user];
    }

    function getRequester(bytes32 idTrade) external view returns (address) {
        return _trades[idTrade].userAddr;
    }

    function getRecipient(bytes32 idTrade) external view returns (address) {
        return _trades[idTrade].destAddr;
    }

    function getDepositToken(bytes32 idTrade) external view returns (address) {
        return _trades[idTrade].deposit.token;
    }

    function getDepositAmount(bytes32 idTrade) external view returns (uint256) {
        return _trades[idTrade].deposit.amount;
    }

    function getDepositChainId(bytes32 idTrade) external view returns (uint256) {
        return _trades[idTrade].deposit.chainId;
    }

    function setTokenInfo(address token, uint256 amount, uint256 chainId) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }
}