// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./GrtOffer.sol";

contract GrtPool is OwnableUpgradeable, GrtOffer, UUPSUpgradeable {
    struct Trade {
        bool isComplete;
        address userAddr;
        address destAddr;
        TokenInfo deposit;
        bytes32 offerId;
        uint256 amountOffer;
    }

    struct TokenInfo {
        address token;
        uint256 amount;
        uint256 chainId;
    }

    mapping(bytes32 => Trade) internal _trades;
    mapping(address => uint256) internal _noncesDeposit;

    event LogTrade(
        address indexed _offerer,
        bytes32 indexed _idTrade,
        address indexed _token,
        uint256 _amount,
        bytes32 _idOffer
    );

    function initialize() external initializer {
        __Ownable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    receive() external payable {}

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Grindery Pool: insufficient balance.");
        (bool success, ) = owner().call{ value: amount }("");
        require(success, "Grindery Pool: withdraw failed.");
    }

    function depositETHAndAcceptOffer(
        bytes32 offerId,
        address destAddr,
        uint256 amountOffer
    ) external payable returns (bytes32) {
        require(msg.value > 0, "Grindery Pool: transfered amount must be positive.");
        require(destAddr != address(0), "Grindery Pool: zero address as destination address is not allowed.");
        require(_offers[offerId].isActive, "Grindery Pool: the offer is inactive.");

        (bool sent, ) = address(this).call{ value: msg.value }("");
        require(sent, "Grindery Pool: failed to send native tokens.");
        bytes32 tradeId = keccak256(abi.encodePacked(msg.sender, _noncesDeposit[msg.sender]));
        Trade storage trade = _trades[tradeId];
        trade.userAddr = msg.sender;
        trade.destAddr = destAddr;
        trade.deposit = setTokenInfo(address(0), msg.value, block.chainid);
        trade.offerId = offerId;
        trade.amountOffer = amountOffer;
        _noncesDeposit[msg.sender]++;
        emit LogTrade(getOfferer(offerId), tradeId, address(0), msg.value, offerId);
        return tradeId;
    }

    function getNonceDeposit(address user) external view returns (uint256) {
        return _noncesDeposit[user];
    }

    function getAmountOffer(bytes32 tradeId) external view returns (uint256) {
        return _trades[tradeId].amountOffer;
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

    function getDepositChainId(bytes32 tradeId) external view returns (uint256) {
        return _trades[tradeId].deposit.chainId;
    }

    function setTokenInfo(address token, uint256 amount, uint256 chainId) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }
}
