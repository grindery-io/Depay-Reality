// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./reality/IRealityETH.sol";
import "./GrtDispute.sol";

import "hardhat/console.sol";

contract GrtPool is OwnableUpgradeable, GrtDispute {

    // State variables
    uint256 internal _countReq;
    address internal _addrGRT;
    uint256 internal _chainIdGRT;

    // Structure declarations
    struct Request {
        address userAddr;
        address destAddr;
        TokenInfo deposit;
        TokenInfo request;
        bool isRequest;
        uint256 countOffers;
        mapping(uint256 => Offer) offers;
    }
    struct Offer {
        address userAddr;
        uint256 amount;
        bool isAccept;
        bool isPaid;
    }
    struct TokenInfo {
        address token;
        uint256 amount;
        uint256 chainId;
    }

    // Mapping declarations
    mapping(uint256 => Request) internal _requests;
    mapping(address => uint256) internal _stakes;

    // Event declarations
    event LogStake (address indexed _user, uint256 indexed _amount);
    event LogDeposit (uint256 indexed _idRequest, address indexed _token, uint256 indexed _amount, uint256 _chainId);
    event LogRequest (uint256 indexed _idRequest, address indexed _token, uint256 indexed _amount, uint256 _chainId);
    event LogCreateOffer (uint256 indexed _idRequest, uint256 indexed _idOffer);
    event LogAcceptOffer (uint256 indexed _idRequest, uint256 indexed _idOffer);
    event LogRejectOffer (uint256 indexed _idRequest, uint256 indexed _idOffer);
    event LogOfferPaidOnChain (uint256 indexed _idRequest, uint256 indexed _idOffer);
    event LogOfferPaidCrossChain (uint256 indexed _idRequest, uint256 indexed _idOffer);

    // Initialize
    function initializePool(address addrGRT, uint256 chainIdGRT, address addrReality) external initializer {
        __Ownable_init();
        _addrGRT = addrGRT;
        _chainIdGRT = chainIdGRT;
        initializeDispute(addrReality);
    }

    // UserB must stake before submitting an offer
    function stakeGRT(uint256 amount) external returns (bool) {
        depositGRT(amount);
        emit LogStake(msg.sender, amount);
        _stakes[msg.sender] += amount;
        return true;
    }

    // Initial user who wants to obtain some ERC20 token: he makes a GRT deposit and a request for that
    function depositGRTRequestERC20(
        uint256 amntDepGRT,
        address tokenRequest,
        uint256 amntReq,
        uint256 chnIdReq,
        address destAddr
    ) external returns (bool) {
        depositGRT(amntDepGRT);
        emit LogDeposit(_countReq, _addrGRT, amntDepGRT, _chainIdGRT);
        addRequest(amntDepGRT, tokenRequest, amntReq, chnIdReq, destAddr);
        return true;
    }

    // Initial user who wants to obtain some native token: he makes a GRT deposit and a request for that
    function depositGRTRequestNative(
        uint256 amntDepGRT,
        uint256 amntReq,
        uint256 chnIdReq,
        address destAddr
    ) external returns (bool) {
        depositGRT(amntDepGRT);
        emit LogDeposit(_countReq, _addrGRT, amntDepGRT, _chainIdGRT);
        addRequest(amntDepGRT, address(0), amntReq, chnIdReq, destAddr);
        return true;
    }

    // User can make an offer as a response to another user request
    function createOffer(uint256 idRequest, uint256 amount) external returns (bool) {
        require(_requests[idRequest].isRequest, "GRT pool: the request does not exist!");
        require(_stakes[msg.sender] > 1, "GRT pool: your stake amount is not sufficient!");
        uint256 _countOffers = _requests[idRequest].countOffers;
        emit LogCreateOffer(idRequest, _countOffers);
        _requests[idRequest].offers[_countOffers] = Offer(msg.sender, amount, false, false);
        _requests[idRequest].countOffers++;
        return true;
    }

    // User who made the request can then accept an offer associated with it
    function acceptOffer(uint256 idRequest, uint256 idOffer) external returns (bool) {
        require(_requests[idRequest].isRequest, "GRT pool: the request does not exist!");
        require(_requests[idRequest].offers[idOffer].userAddr != address(0), "GRT pool: the offer does not exist!");
        require(!_requests[idRequest].offers[idOffer].isAccept, "GRT pool: the offer has already been accepted!");
        require(msg.sender == _requests[idRequest].userAddr, "GRT pool: you are not the requester!");
        for (uint i = 0; i < _requests[idRequest].countOffers; i++) {
            if (_requests[idRequest].offers[i].isAccept) {
                revert("GRT pool: there is already an accepted offer for this request!");
            }
        }
        _requests[idRequest].offers[idOffer].isAccept = true;
        emit LogAcceptOffer(idRequest, idOffer);
        return true;
    }

    function rejectOffer(uint256 idRequest, uint256 idOffer) public returns (bool) {
        require(_requests[idRequest].offers[idOffer].isAccept, "GRT pool: the offer is not accepted yet!");
        require(!_requests[idRequest].offers[idOffer].isPaid, "GRT pool: the offer has already been paid!");
        require(msg.sender == _requests[idRequest].userAddr, "GRT pool: you are not the requester!");
        _requests[idRequest].offers[idOffer].isAccept = false;
        emit LogRejectOffer(idRequest, idOffer);
        return true;
    }

    // Honour the offer on the same chain as the request has been made
    function payOfferOnChainERC20(
        uint256 idRequest,
        uint256 idOffer
    ) external returns (bool) {

        require(_requests[idRequest].offers[idOffer].isAccept, "GRT pool: the offer has not been accepted yet!");
        require(!_requests[idRequest].offers[idOffer].isPaid, "GRT pool: the offer has already been paid!");
        require(block.chainid == _requests[idRequest].request.chainId, "GRT pool: the offer should not be paid on this chain!");
        require(msg.sender == _requests[idRequest].offers[idOffer].userAddr, "GRT pool: you are not allowed to pay this offer!");

        IERC20(_requests[idRequest].request.token).transferFrom(
            msg.sender,
            _requests[idRequest].destAddr,
            _requests[idRequest].request.amount
        );
        IERC20(_addrGRT).transfer(msg.sender, _requests[idRequest].deposit.amount);
        emit LogOfferPaidOnChain(idRequest, idOffer);
        _requests[idRequest].offers[idOffer].isPaid = true;
        return true;
    }

    // Honour the offer on the same chain as the request has been made
    function payOfferOnChainNative(
        uint256 idRequest,
        uint256 idOffer
    ) external payable returns (bool HndOffer, bool GRTReward) {

        require(_requests[idRequest].offers[idOffer].isAccept, "GRT pool: the offer you are trying to pay has not been accepted yet!");
        require(!_requests[idRequest].offers[idOffer].isPaid, "GRT pool: the offer you are trying to pay has already been paid!");
        require(block.chainid == _requests[idRequest].request.chainId, "GRT pool: the offer should not be paid on this chain!");
        require(msg.value == _requests[idRequest].request.amount, "GRT pool: the amount you entered does not match the offer you made!");
        require(msg.sender == _requests[idRequest].offers[idOffer].userAddr, "GRT pool: you are not allowed to honour this offer!");

        (bool successHndOffer, ) = _requests[idRequest].destAddr.call{value: msg.value}("");
        bool successGRTReward;

        if (successHndOffer) {
            successGRTReward = IERC20(_addrGRT).transfer(msg.sender, _requests[idRequest].deposit.amount);
            if (successGRTReward) {
                emit LogOfferPaidOnChain(idRequest, idOffer);
                _requests[idRequest].offers[idOffer].isPaid = true;
            }
        }

        return (successHndOffer, successGRTReward);
    }

    // Claim GRT after dispute
    function claimGRTWithDispute (
        uint256 idRequest,
        uint256 idOffer,
        bytes32 questionId,
        bytes32[] memory history_hashes,
        address[] memory addrs,
        uint256[] memory bonds,
        bytes32[] memory answers
    ) external returns (bool) {

        require(!_requests[idRequest].offers[idOffer].isPaid, "GRT pool: the offer you are trying to pay has already been paid!");
        require(msg.sender == _requests[idRequest].offers[idOffer].userAddr , "GRT pool: you have not made an offer for this request and therefore you are not entitled to make this request!");

        claimWinnings(questionId, history_hashes, addrs, bonds, answers);

        if (getFinalAnswer(questionId) == keccak256(abi.encodePacked("true"))) {
            bool success = IERC20(_addrGRT).transfer(_requests[idRequest].offers[idOffer].userAddr, _requests[idRequest].deposit.amount);
            if (success) {
                emit LogOfferPaidCrossChain(idRequest, idOffer);
                _requests[idRequest].offers[idOffer].isPaid = true;
            }
            return success;
        }

        return false;
    }

    // Claim GRT without dispute
    function claimGRTWithoutDispute (uint256 idRequest, uint256 idOffer) external returns (bool) {

        require(!_requests[idRequest].offers[idOffer].isPaid, "GRT pool: the offer you are trying to pay has already been paid!");
        require(msg.sender == _requests[idRequest].offers[idOffer].userAddr , "GRT pool: you have not made an offer for this request and therefore you are not entitled to make this request!");

        bool success = IERC20(_addrGRT).transfer(_requests[idRequest].offers[idOffer].userAddr, _requests[idRequest].deposit.amount);
        if (success) {
            emit LogOfferPaidCrossChain(idRequest, idOffer);
            _requests[idRequest].offers[idOffer].isPaid = true;
        }
        return success;

    }

    function getRequester(uint256 idRequest) external view returns (address) {
        return _requests[idRequest].userAddr;
    }

    function getRecipient(uint256 idRequest) external view returns (address) {
        return _requests[idRequest].destAddr;
    }

    function getDepositToken(uint256 idRequest) external view returns (address) {
        return _requests[idRequest].deposit.token;
    }

    function getDepositAmount(uint256 idRequest) external view returns (uint256) {
        return _requests[idRequest].deposit.amount;
    }

    function getDepositChainId(uint256 idRequest) external view returns (uint256) {
        return _requests[idRequest].deposit.chainId;
    }

    function getRequestToken(uint256 idRequest) external view returns (address) {
        return _requests[idRequest].request.token;
    }

    function getRequestAmount(uint256 idRequest) external view returns (uint256) {
        return _requests[idRequest].request.amount;
    }

    function getRequestChainId(uint256 idRequest) external view returns (uint256) {
        return _requests[idRequest].request.chainId;
    }

    function isrequest(uint256 idRequest) external view returns (bool) {
        return _requests[idRequest].isRequest;
    }

    function getOfferCreator(uint256 idRequest, uint256 idOffer) external view returns (address) {
        return _requests[idRequest].offers[idOffer].userAddr;
    }

    function getOfferAmount(uint256 idRequest, uint256 idOffer) external view returns (uint256) {
        return _requests[idRequest].offers[idOffer].amount;
    }

    function isOfferAccepted(uint256 idRequest, uint256 idOffer) external view returns (bool) {
        return _requests[idRequest].offers[idOffer].isAccept;
    }

    function isOfferPaid(uint256 idRequest, uint256 idOffer) external view returns (bool) {
        return _requests[idRequest].offers[idOffer].isPaid;
    }

    function nbrOffersRequest(uint256 idRequest) external view returns (uint256) {
        return _requests[idRequest].countOffers;
    }

    // Initialize a new offer
    function initOffer() internal pure returns (Offer memory) {
        return Offer(address(0), 0, false, false);
    }

    // Set token infos
    function setTokenInfo(address token, uint256 amount, uint256 chainId) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }

    // Modify GRT address
    function setGRTAddr(address token) external onlyOwner {
       _addrGRT = token;
    }

    // Modify GRT Chain Id
    function setGRTChainId(uint256 chainId) external onlyOwner {
       _chainIdGRT = chainId;
    }

    // Deposit GRT on the pool
    function depositGRT(uint256 amount) internal returns (bool) {
        return IERC20(_addrGRT).transferFrom(msg.sender, address(this), amount);
    }

    // Get GRT token address
    function grtAddress() external view returns (address) {
       return _addrGRT;
    }

    // Get GRT token address
    function grtChainId() external view returns (uint256) {
       return _chainIdGRT;
    }

    function stakeOf(address account) external view returns (uint256) {
       return _stakes[account];
    }

    function nbrRequest() external view returns (uint256) {
       return _countReq;
    }

    // Add new request
    function addRequest(
        uint256 amntDepGRT,
        address tokenRequest,
        uint256 amntReq,
        uint256 chnIdReq,
        address recipient
    ) internal {

        emit LogRequest(_countReq, tokenRequest, amntReq, chnIdReq);

        Request storage request = _requests[_countReq];

        request.userAddr = msg.sender;
        request.destAddr = recipient;
        request.deposit = setTokenInfo(_addrGRT, amntDepGRT, _chainIdGRT);
        request.request = setTokenInfo(tokenRequest, amntReq, chnIdReq);
        request.isRequest = true;

        _countReq++;
    }

}