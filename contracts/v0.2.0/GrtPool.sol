// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../reality/IRealityETH.sol";
import "hardhat/console.sol";

contract GrtPool is OwnableUpgradeable {

    address internal _addrGRT;
    uint256 internal _chainIdGRT;

    // Structure declarations
    struct Request {
        address userAddr;
        address destAddr;
        TokenInfo deposit;
        Offer offer;
    }
    struct Offer {
        bytes32 idOffer;
        address userAddr;
        bool isPaid;
        TokenInfo tokenInfo;
    }
    struct TokenInfo {
        address token;
        uint256 amount;
        uint256 chainId;
    }

    // Mapping declarations
    mapping(bytes32 => Request) internal _requests;
    mapping(address => uint256) internal _stakes;
    mapping(address => uint256) internal _nonces;

    // Event declarations
    event LogStake (address indexed _user, uint256 indexed _amount);
    event LogDeposit (bytes32 indexed _idRequest, address indexed _token, uint256 indexed _amount, uint256 _chainId);
    event LogRequest (bytes32 indexed _idRequest, address indexed _token, uint256 indexed _amount, uint256 _chainId);
    event LogOfferPaid (bytes32 indexed _idRequest, bytes32 indexed _idOffer);

    // Initialize
    function initializePool(address addrGRT) external initializer {
        __Ownable_init();
        _addrGRT = addrGRT;
    }

    // UserB must stake before submitting an offer
    function stakeGRT(uint256 amount) external returns (bool) {
        depositGRT(amount);
        emit LogStake(msg.sender, amount);
        _stakes[msg.sender] += amount;
        return true;
    }

    function depositGRTRequestERC20(
        uint256 amntDepGRT,
        address userOffer,
        address tokenOffer,
        uint256 amountOffer,
        uint256 chainIdOffer,
        bytes32 idOffer,
        address destAddr
    ) external returns (bool) {
        depositGRT(amntDepGRT);
        bytes32 idRequest = keccak256(abi.encodePacked(
            _nonces[msg.sender],
            msg.sender,
            block.chainid
        ));
        emit LogDeposit(idRequest, _addrGRT, amntDepGRT, block.chainid);
        addDeposit(idRequest, amntDepGRT, destAddr);
        addOffer(
            idRequest,
            idOffer,
            userOffer,
            tokenOffer,
            amountOffer,
            chainIdOffer
        );
        return true;
    }

    function depositGRTRequestNative(
        uint256 amntDepGRT,
        address userOffer,
        uint256 amountOffer,
        uint256 chainIdOffer,
        bytes32 idOffer,
        address destAddr
    ) external returns (bool) {
        depositGRT(amntDepGRT);
        bytes32 idRequest = keccak256(abi.encodePacked(
            _nonces[msg.sender],
            msg.sender,
            block.chainid
        ));
        emit LogDeposit(idRequest, _addrGRT, amntDepGRT, block.chainid);
        // addDeposit(idRequest, amntDepGRT, address(0), amountOffer, chainIdOffer, destAddr);
        addDeposit(idRequest, chainIdOffer, destAddr);
        addOffer(
            idRequest,
            idOffer,
            userOffer,
            address(0),
            amountOffer,
            chainIdOffer
        );
        return true;
    }

    function addOffer(
        bytes32 idRequest,
        bytes32 idOffer,
        address user,
        address token,
        uint256 amount,
        uint256 chainId
    ) internal {
        emit LogRequest(idRequest, token, amount, chainId);
        _requests[idRequest].offer.idOffer = idOffer;
        _requests[idRequest].offer.userAddr = user;
        _requests[idRequest].offer.tokenInfo = setTokenInfo(
            token,
            amount,
            chainId
        );
    }

    // Claim GRT without dispute
    function claimGRTWithoutDispute (bytes32 idRequest, bytes32 idOffer) external returns (bool) {

        require(_requests[idRequest].offer.userAddr != address(0), "GRT pool: the request does not exist!");
        require(!_requests[idRequest].offer.isPaid, "GRT pool: the offer has already been paid!");
        require(msg.sender == _requests[idRequest].offer.userAddr , "GRT pool: you are not allowed to make this claim!");

        IERC20(_addrGRT).transfer(_requests[idRequest].offer.userAddr, _requests[idRequest].deposit.amount);
        emit LogOfferPaid(idRequest, idOffer);
        _requests[idRequest].offer.isPaid = true;
        return true;

    }

    function getOfferId(bytes32 idRequest) external view returns (bytes32) {
        return _requests[idRequest].offer.idOffer;
    }

    function getNonce(address user) external view returns (uint256) {
        return _nonces[user];
    }

    function getRequester(bytes32 idRequest) external view returns (address) {
        return _requests[idRequest].userAddr;
    }

    function getRecipient(bytes32 idRequest) external view returns (address) {
        return _requests[idRequest].destAddr;
    }

    function getDepositToken(bytes32 idRequest) external view returns (address) {
        return _requests[idRequest].deposit.token;
    }

    function getDepositAmount(bytes32 idRequest) external view returns (uint256) {
        return _requests[idRequest].deposit.amount;
    }

    function getDepositChainId(bytes32 idRequest) external view returns (uint256) {
        return _requests[idRequest].deposit.chainId;
    }

    function getOfferToken(bytes32 idRequest) external view returns (address) {
        return _requests[idRequest].offer.tokenInfo.token;
    }

    function getOfferAmount(bytes32 idRequest) external view returns (uint256) {
        return _requests[idRequest].offer.tokenInfo.amount;
    }

    function getOfferChainId(bytes32 idRequest) external view returns (uint256) {
        return _requests[idRequest].offer.tokenInfo.chainId;
    }

    function getOfferCreator(bytes32 idRequest) external view returns (address) {
        return _requests[idRequest].offer.userAddr;
    }

    function isOfferPaid(bytes32 idRequest) external view returns (bool) {
        return _requests[idRequest].offer.isPaid;
    }

    // Set token infos
    function setTokenInfo(address token, uint256 amount, uint256 chainId) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }

    // Modify GRT address
    function setGRTAddr(address token) external onlyOwner {
       _addrGRT = token;
    }

    // Deposit GRT on the pool
    function depositGRT(uint256 amount) internal returns (bool) {
        return IERC20(_addrGRT).transferFrom(msg.sender, address(this), amount);
    }

    // Get GRT token address
    function grtAddress() external view returns (address) {
       return _addrGRT;
    }

    function stakeOf(address account) external view returns (uint256) {
       return _stakes[account];
    }

    // Add new request
    function addDeposit(
        bytes32 idRequest,
        uint256 amntDepGRT,
        address destination
    ) internal {
        Request storage request = _requests[idRequest];
        request.userAddr = msg.sender;
        request.destAddr = destination;
        request.deposit = setTokenInfo(_addrGRT, amntDepGRT, block.chainid);
        _nonces[msg.sender]++;
    }

}