// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./reality/IRealityETH.sol";
import "./GrtDispute.sol";

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
        Offer[] offers;
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
        bool success = depositGRT(amount);
        if (success) {
            emit LogStake(msg.sender, amount);
            _stakes[msg.sender] += amount;
        }
        return success;
    }

    function getUserStake (address _addr) external view returns (uint256) {
        return _stakes[_addr];
    }

    // Initial user who wants to obtain some ERC20 token: he makes a GRT deposit and a request for that
    function depositGRTRequestERC20(
        uint256 amntDepGRT,
        address tokenRequest,
        uint256 amntReq,
        uint256 chnIdReq,
        address destAddr
    ) external returns (bool) {
        bool succDep = depositGRT(amntDepGRT);
        if (succDep) {
            emit LogDeposit(_countReq, _addrGRT, amntDepGRT, _chainIdGRT);
            addRequest(amntDepGRT, tokenRequest, amntReq, chnIdReq, destAddr);
        }
        return succDep;
    }

    // Initial user who wants to obtain some native token: he makes a GRT deposit and a request for that
    function depositGRTRequestNative(
        uint256 amntDepGRT,
        uint256 amntReq,
        uint256 chnIdReq,
        address destAddr
    ) external returns (bool) {
        bool succDep = depositGRT(amntDepGRT);
        if (succDep) {
            emit LogDeposit(_countReq, _addrGRT, amntDepGRT, _chainIdGRT);
            addRequest(amntDepGRT, address(0), amntReq, chnIdReq, destAddr);
        }
        return succDep;
    }

    // User can make an offer as a response to another user request
    function createOffer(uint256 idRequest, uint256 amount) external {
        require(_requests[idRequest].isRequest, "GRT pool: the request for which you are trying to place an offer does not exist!");
        require(_stakes[msg.sender] > 1, "GRT pool: your stake amount is not sufficient!");
        // juju => swapping the events emitted for the offer addition to the _requests mapping, so it returns the new offer as part of the offer length
        _requests[idRequest].offers.push(Offer(msg.sender, amount, false, false));
        emit LogCreateOffer(idRequest, _requests[idRequest].offers.length);
    }

    // User who made the request can then accept an offer associated with it
    function acceptOffer(uint256 idRequest, uint256 idOffer) external {
        require(_requests[idRequest].isRequest, "GRT pool: the request for which you are trying to accept an offer does not exist!");
        require(idOffer > 0 && idOffer < _requests[idRequest].offers.length, "GRT pool: the offer Id is invalid!");
        require(!_requests[idRequest].offers[idOffer].isAccept, "GRT pool: the offer has already been accepted!");
        require(msg.sender == _requests[idRequest].userAddr, "GRT pool: you are not authorized to accept an offer that has not been issued by you!");
        _requests[idRequest].offers[idOffer].isAccept = true;
        emit LogAcceptOffer(idRequest, idOffer);
    }

    // Honour the offer on the same chain as the request has been made
    function payOfferOnChainERC20(
        uint256 idRequest,
        uint256 idOffer,
        address token,
        uint256 amount
    ) external returns (bool HndOffer, bool GRTReward) {

        require(_requests[idRequest].offers[idOffer].isAccept, "GRT pool: the offer you are trying to pay has not been accepted yet!");
        require(!_requests[idRequest].offers[idOffer].isPaid, "GRT pool: the offer you are trying to pay has already been paid!");
        require(block.chainid == _requests[idRequest].request.chainId, "GRT pool: the offer should not be paid on this chain!");
        require(amount == _requests[idRequest].request.amount, "GRT pool: the amount you entered does not match the offer you made!");
        require(msg.sender == _requests[idRequest].offers[idOffer].userAddr, "GRT pool: you are not allowed to honour this offer!");
        require(token == _requests[idRequest].request.token, "GRT pool: the token you wish to propose is not the one expected!");

        bool successHndOffer = IERC20(token).transferFrom(msg.sender, _requests[idRequest].destAddr, amount);
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
        // juju => add a require statement to check if the offer has been accepted
        // There should be more checks to ensure whoever is claiming this function has been approved to do so.
        // suggestion is a function that the requester signs to approve this offerer to claim this GRT without dispute
        bool success = IERC20(_addrGRT).transfer(_requests[idRequest].offers[idOffer].userAddr, _requests[idRequest].deposit.amount);
        if (success) {
            emit LogOfferPaidCrossChain(idRequest, idOffer);
            _requests[idRequest].offers[idOffer].isPaid = true;
        }
        return success;
    }

    // Get information for a given request (deposit)
    function getInfoDeposit(uint256 idRequest) external view returns (
        address userAddr,
        address addrTokenDep,
        uint256 amntDep,
        uint256 chainIdDep
    ) {
        return (
            _requests[idRequest].userAddr,
            _requests[idRequest].deposit.token,
            _requests[idRequest].deposit.amount,
            _requests[idRequest].deposit.chainId
        );
    }

    // Get information for a given request (request)
    function getInfoRequest(uint256 idRequest) external view returns (
        address userAddr,
        address addrTokenReq,
        address receipientAddr,
        uint256 amntReq,
        uint256 chainIdReq,
        bool isRequest
    ) {
        return (
            _requests[idRequest].userAddr,
            _requests[idRequest].request.token,
            _requests[idRequest].destAddr,
            _requests[idRequest].request.amount,
            _requests[idRequest].request.chainId,
            _requests[idRequest].isRequest
        );
    }

    // Get information for a given request (offer)
    function getInfoOffer(uint256 idRequest, uint256 idOffer) external view returns (
        address userAddr,
        bool isOffr,
        address offrUserAdrr,
        bool isOfferAccepted,
        bool isOfferHnd
    ) {
        return (
            _requests[idRequest].userAddr,
            _requests[idRequest].isRequest,
            _requests[idRequest].offers[idOffer].userAddr,
            _requests[idRequest].offers[idOffer].isAccept,
            _requests[idRequest].offers[idOffer].isPaid
        );
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

    // get current GRT address
    function getGRTAddr() external view returns (address) {
       return _addrGRT;
    }

    // Modify GRT Chain Id
    function setGRTChainId(uint256 chainId) external onlyOwner {
       _chainIdGRT = chainId;
    }

    function getGRTChainId() external view returns(uint256) {
       return _chainIdGRT;
    }

    // Deposit GRT on the pool
    function depositGRT(uint256 amount) public returns (bool) {
        return IERC20(_addrGRT).transferFrom(msg.sender, address(this), amount);
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
        // request.offer = initOffer();
        request.offers.push(initOffer());
        _requests[_countReq] = request;

        _countReq++;
    }

    function getAllRequestOffers(uint256 id) external view returns (Offer[] memory) {
        uint256 count = _requests[id].offers.length;
        Offer[] memory _offers = new Offer[](count);
        _offers = _requests[id].offers;
        return _offers;
    }


    function getCounter() external view returns (uint256){
        return _countReq;
    }


}