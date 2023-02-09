// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./reality/IRealityETH.sol";
import "./GrtDispute.sol";

contract GrtPool is OwnableUpgradeable, GrtDispute {

    // State variables
    address private _addrGRT;
    uint256 private _chainIdGRT;
    uint private _countReq;

    // Structure declarations
    struct Request {
        address userAddr;
        address destAddr;
        TokenInfo deposit;
        TokenInfo request;
        bool isOffer;
        Offer offer;
    }

    struct Offer {
        address userAddr;
        bool isAccept;
        bool isHnd;
    }

    struct TokenInfo {
        address addr;
        uint amount;
        uint chainId;
    }

    // Mapping declarations
    mapping(uint => Request) private _requests;
    mapping(address => uint) private _stakes;

    // Event declarations
    event LogDepERC20 (uint indexed _idRequest, address indexed _token, uint256 indexed _amount, uint256 _chainId);
    event LogReqERC20 (uint indexed _idRequest, address indexed _token, uint256 indexed _amount, uint256 _chainId);
    event LogCreateOffrERC20 (uint indexed _idRequest);
    event LogAcceptOffrERC20 (uint indexed _idRequest);
    event LogRejectOffrERC20 (uint indexed _idRequest);
    event LogHndOffrERC20OnChain (uint indexed _idRequest);
    event LogHndOffrERC20CrossChain (uint indexed _idRequest);

    // Initialize
    function initializePool(address addrGRT, uint chainIdGRT, address addrReality) external initializer {
        __Ownable_init();
        _addrGRT = addrGRT;
        _chainIdGRT = chainIdGRT;
        // Sam => initializing the GRT-dispuute contract 
        initializeDispute(addrReality);
    }

    // UserB must stake before submitting an offer
    function stakeGRT(uint amount) public returns (bool) {
        // Sam => changing the trasnfer address to the user staking instead of address(this)
        bool success = IERC20(_addrGRT).transfer(msg.sender, amount);
        if (success) {
            _stakes[msg.sender] += amount;
        }
        return success;
    }

    // Initial user who wants to obtain some ERC20 token: he makes a GRT deposit and a request for that
    function depositGRT(
        uint amntDepGRT,
        address addrTknReq,
        uint amntReq,
        uint chnIdReq,
        address destAddr
    ) public returns (bool) {

        bool succDep = IERC20(_addrGRT).transferFrom(msg.sender, address(this), amntDepGRT);

        if (succDep) {

            emit LogDepERC20(_countReq, _addrGRT, amntDepGRT, _chainIdGRT);
            emit LogReqERC20(_countReq, addrTknReq, amntReq, chnIdReq);

            _requests[_countReq] = Request(
                msg.sender,
                destAddr,
                setTokenInfo(_addrGRT, amntDepGRT, _chainIdGRT),
                setTokenInfo(addrTknReq, amntReq, chnIdReq),
                false,
                initOffer()
            );

            _countReq++;
        }

        return succDep;
    }

    // User can make an offer as a response to another user request
    function makeOfferERC20(
        uint idReq,
        address addrTknOffr,
        uint amntOffr,
        uint chnIdOffr
    ) public {

        require(!_requests[idReq].isOffer, "GRT pool: an offer has already been made or is already in progress on this request!");
        require(addrTknOffr == _requests[idReq].request.addr, "GRT pool: the token of your offer is not the one the user wants!");
        require(amntOffr == _requests[idReq].request.amount, "GRT pool: the amount of token of your offer doesn't correspond to what the user wants!");
        require(chnIdOffr == _requests[idReq].request.chainId, "GRT pool: the chain of your offer doesn't correspond to what the user wants!");
        require(_stakes[msg.sender] > 1, "GRT pool: your stake amount is not sufficient!");

        emit LogCreateOffrERC20(idReq);
        // Sam =>  updating the mapping _requests[idReq].isOffer to true 
        _requests[idReq].isOffer = true;
        // Sam =>  changing the offer.isAccept to false until user accepts it
        _requests[idReq].offer = Offer(msg.sender, false, false);
    }

    // User who made the request can then accept an offer associated with it
    function acceptOffer(uint idReq) public {

        require(_requests[idReq].isOffer, "GRT pool: no offer to accept!");
        require(!_requests[idReq].offer.isAccept, "GRT pool: the offer has already been accepted!");
        require(!_requests[idReq].offer.isHnd, "GRT pool: the offer has already been honoured!");
        require(msg.sender == _requests[idReq].userAddr, "GRT pool: you are not authorized to accept an offer that has not been issued by you!");

        _requests[idReq].offer.isAccept = true;
        emit LogAcceptOffrERC20(idReq);
    }

    // User who made the request can then reject an offer associated with it
    function rejectOffer(uint idReq) public {

        require(_requests[idReq].isOffer, "GRT pool: no offer to accept!");
        require(!_requests[idReq].offer.isAccept, "GRT pool: the offer has already been accepted!");
        require(!_requests[idReq].offer.isHnd, "GRT pool: the offer has already been honoured!");
        require(msg.sender == _requests[idReq].userAddr, "GRT pool: you are not authorized to reject an offer that has not been issued by you!");

        emit LogRejectOffrERC20(idReq);
        _requests[idReq].offer = initOffer();
    }

    // Honour the offer on the same chain as the request has been made
    function HnOfferERC20OnChain(
        uint idReq,
        address token,
        uint amount
    ) public returns (bool HndOffer, bool GRTReward) {

        require(_requests[idReq].isOffer, "GRT pool: no offer to honour!");
        require(block.chainid == _requests[idReq].request.chainId, "GRT pool: the offer should not be honoured on this chain!");
        require(msg.sender == _requests[idReq].offer.userAddr, "GRT pool: you are not allowed to honour this offer!");
        require(_requests[idReq].offer.isAccept, "GRT pool: the offer has not been accepted yet!");
        require(!_requests[idReq].offer.isHnd, "GRT pool: the offer has already been honoured!");

        // Bond in GRT is 1 for the moment to simplify
        bool successHndOffer = IERC20(token).transferFrom(msg.sender, _requests[idReq].destAddr, amount);
        // changing the transfer to GRT tokens to the user honoring this transaction from transferFrom to transferTo
        bool successGRTReward = IERC20(_addrGRT).transfer(msg.sender, _requests[idReq].deposit.amount);

        if (successHndOffer && successGRTReward) {
            emit LogHndOffrERC20OnChain(idReq);
            _requests[idReq].offer.isHnd = true;
        }

        return (successHndOffer, successGRTReward);
    }

    // Claim GRT after dispute
    function claimGRTWithDispute (
        uint idReq,
        bytes32 questionId,
        bytes32[] memory history_hashes,
        address[] memory addrs,
        uint256[] memory bonds,
        bytes32[] memory answers
    ) external returns (bool) {

        require(_requests[idReq].isOffer, "GRT pool: no offer to honour!");
        require(!_requests[idReq].offer.isHnd, "GRT pool: the offer has already been honoured!");
        require(msg.sender == _requests[idReq].offer.userAddr , "GRT pool: you have not made an offer for this request and therefore you are not entitled to make this request!");

        claimWinnings(questionId, history_hashes, addrs, bonds, answers);

        // Sam => checking if the final answer is equal to the hash value of true isntead of 'true' string
        if (getFinalAnswer(questionId) == keccak256(abi.encodePacked("true"))) {
            bool success = IERC20(_addrGRT).transfer(_requests[idReq].offer.userAddr, _requests[idReq].deposit.amount);
            if (success) {
                emit LogHndOffrERC20CrossChain(idReq);
                _requests[idReq].offer.isHnd = true;
            }
            return success;
        }

        return false;
    }

    // Claim GRT without dispute
    function claimGRTWithoutDispute (
        uint idReq
    ) external returns (bool) {

        require(_requests[idReq].isOffer, "GRT pool: no offer to honour!");
        require(!_requests[idReq].offer.isHnd, "GRT pool: the offer has already been honoured!");
        require(msg.sender == _requests[idReq].offer.userAddr , "GRT pool: you have not made an offer for this request and therefore you are not entitled to make this request!");

        bool success = IERC20(_addrGRT).transfer(_requests[idReq].offer.userAddr, _requests[idReq].deposit.amount);
        if (success) {
            emit LogHndOffrERC20CrossChain(idReq);
            _requests[idReq].offer.isHnd = true;
        }
        return success;

    }

    // Initialize a new offer
    function initOffer() internal pure returns (Offer memory) {
        return Offer(address(0), false, false);
    }

    // Set token infos
    function setTokenInfo(address token, uint amount, uint chainId) internal pure returns (TokenInfo memory) {
        return TokenInfo(token, amount, chainId);
    }

    // Get information for a given request (deposit)
    function getInfoDep(uint idReq) external view returns (
        address userAddr,
        address addrTokenDep,
        uint amntDep,
        uint chainIdDep
    ) {
        return (
            _requests[idReq].userAddr,
            _requests[idReq].deposit.addr,
            _requests[idReq].deposit.amount,
            _requests[idReq].deposit.chainId
        );
    }

    // Get information for a given request (request)
    function getInfoReq(uint idReq) external view returns (
        address userAddr,
        address addrTokenReq,
        uint amntReq,
        uint chainIdReq
    ) {
        return (
            _requests[idReq].userAddr,
            _requests[idReq].request.addr,
            _requests[idReq].request.amount,
            _requests[idReq].request.chainId
        );
    }

    // Get information for a given request (offer)
    function getInfoOffr(uint idReq) external view returns (
        address userAddr,
        bool isOffr,
        address offrUserAdrr,
        bool isOfferAccepted,
        bool isOfferHnd
    ) {
        return (
            _requests[idReq].userAddr,
            _requests[idReq].isOffer,
            _requests[idReq].offer.userAddr,
            _requests[idReq].offer.isAccept,
            _requests[idReq].offer.isHnd
        );
    }

    function setGRTAddr(address addr) external onlyOwner {
       _addrGRT = addr;
    }

    function setGRTChainId(uint chainId) external onlyOwner {
       _chainIdGRT = chainId;
    }

}