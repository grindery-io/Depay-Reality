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

    function initializePool() external initializer {
        __Ownable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    function depositETHAndAcceptOffer(
        uint256 amount,
        bytes32 idOffer,
        address destAddr
    ) external payable returns (bool) {
        require(amount > 0, "GRT Pool: amount must be positive.");
        require(destAddr != address(0), "GRT Pool: zero address as destination address.");
        require(_offers[idOffer].isActive, "GRT Pool: the offer is inactive.");
        (bool sent, ) = address(this).call{value: amount}("");
        if (sent) {
            bytes32 idTrade = keccak256(
                abi.encodePacked(msg.sender, _noncesDeposit[msg.sender])
            );
            emit LogTrade(idTrade, address(0), amount, idOffer);
            Trade storage trade = _trades[idTrade];
            trade.userAddr = msg.sender;
            trade.destAddr = destAddr;
            trade.deposit = setTokenInfo(address(0), amount, block.chainid);
            trade.idOffer = idOffer;
            _noncesDeposit[msg.sender]++;
            return true;
        }
        return false;
    }

    function getNonceDeposit(address user) external view returns (uint256) {
        return _noncesDeposit[user];
    }

    function getIdOffer(bytes32 idTrade) external view returns (bytes32) {
        return _trades[idTrade].idOffer;
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

    function getDepositChainId(
        bytes32 idTrade
    ) external view returns (uint256) {
        return _trades[idTrade].deposit.chainId;
    }

    function setTokenInfo(
        address token,
        uint256 amount,
        uint256 chainId
    ) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }

}
