// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./GrtOffer.sol";

contract GrtPoolV2 is OwnableUpgradeable, GrtOffer, UUPSUpgradeable {
    using SafeERC20 for IERC20;

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
    address private _tokenTest;

    event LogTrade(
        address indexed _offerer,
        bytes32 indexed _tradeId,
        address indexed _token,
        uint256 _amount,
        bytes32 _offerId
    );

    function initialize(address tokenTest) external initializer {
        __Ownable_init();
        _tokenTest = tokenTest;
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    receive() external payable {}

    function withdraw(uint256 amount, address to) external onlyOwner {
        require(
            amount <= address(this).balance,
            "Grindery Pool: insufficient balance."
        );
        (bool success, ) = to.call{value: amount}("");
        require(success, "Grindery Pool: withdraw failed.");
    }

    function withdrawTokens(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function depositETHAndAcceptOffer(
        bytes32 offerId,
        address destAddr,
        uint256 amountOffer
    ) external payable returns (bytes32) {
        require(
            msg.value > 0,
            "Grindery Pool: transfered amount must be positive."
        );
        require(
            destAddr != address(0),
            "Grindery Pool: zero address as destination address is not allowed."
        );
        require(
            _offers[offerId].isActive,
            "Grindery Pool: the offer is inactive."
        );

        (bool sent, ) = address(this).call{value: msg.value}("");
        require(sent, "Grindery Pool: failed to send native tokens.");

        return
            setTradeInfo(destAddr, address(0), msg.value, offerId, amountOffer);
    }

    function depositTestTokenAndAcceptOffer(
        address token,
        uint256 amount,
        bytes32 offerId,
        address destAddr,
        uint256 amountOffer
    ) external returns (bytes32) {
        require(
            token != address(0),
            "Grindery Pool: the token must not be zero address."
        );
        require(
            token == _tokenTest,
            "Grindery Pool: the token sent must be the test token."
        );
        require(
            amount > 0,
            "Grindery Pool: transfered amount must be positive."
        );
        require(
            destAddr != address(0),
            "Grindery Pool: zero address as destination address is not allowed."
        );
        require(
            _offers[offerId].isActive,
            "Grindery Pool: the offer is inactive."
        );

        IERC20(_tokenTest).safeTransferFrom(msg.sender, address(this), amount);
        return setTradeInfo(destAddr, _tokenTest, amount, offerId, amountOffer);
    }

    function setTradeInfo(
        address destAddr,
        address token,
        uint256 amount,
        bytes32 offerId,
        uint256 amountOffer
    ) internal returns (bytes32) {
        bytes32 tradeId = keccak256(
            abi.encodePacked(
                msg.sender,
                _noncesDeposit[msg.sender],
                block.chainid
            )
        );
        Trade storage trade = _trades[tradeId];
        trade.userAddr = msg.sender;
        trade.destAddr = destAddr;
        trade.deposit = setTokenInfo(token, amount, block.chainid);
        trade.offerId = offerId;
        trade.amountOffer = amountOffer;
        _noncesDeposit[msg.sender]++;
        emit LogTrade(getOfferer(offerId), tradeId, token, amount, offerId);
        return tradeId;
    }

    function setTokenTest(address tokenTest) external onlyOwner {
        _tokenTest = tokenTest;
    }

    function setOrderComplete(bytes32 tradeId) external returns (bool) {
        require(
            !_trades[tradeId].isComplete,
            "Grindery Pool: the order is already complete."
        );
        require(
            msg.sender == _trades[tradeId].userAddr,
            "Grindery Pool: you are not the user who made the order."
        );

        _trades[tradeId].isComplete = true;
        return true;
    }

    function getPaymentInfo(
        bytes32 tradeId
    )
        external
        view
        returns (
            bytes32 offerId,
            address destAddr,
            address token,
            uint256 amount
        )
    {
        return (
            _trades[tradeId].offerId,
            _trades[tradeId].destAddr,
            _offers[_trades[tradeId].offerId].token,
            _trades[tradeId].amountOffer
        );
    }

    function getTokenTest() external view returns (address) {
        return _tokenTest;
    }

    function getNonceDeposit(address user) external view returns (uint256) {
        return _noncesDeposit[user];
    }

    function getOrderComplete(bytes32 tradeId) external view returns (bool) {
        return _trades[tradeId].isComplete;
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
