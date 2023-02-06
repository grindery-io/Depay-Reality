// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "./interfaces/IRealityETH.sol";
//import "https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IRealityETH_ERC20.sol";
import "https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IRealityETH.sol";

contract GRTPOOL is OwnableUpgradeable {

    address _addrGRT = 0x1e3C935E9A45aBd04430236DE959d12eD9763162;
    uint256 internal _chainIdGRT = 5;
    uint internal _countReq;

    struct Request {
        address userAdrr;
        address addrTokenDep;
        uint amntDep;
        uint chainIdDep;
        address addrTokenReq;
        uint amntReq;
        uint chainIdReq;
        bool isOffer;
        Offer offer;
        bool isOfferAccepted;
        bool isOfferHnd;
    }

    struct Offer {
        address userAdrr;
        uint bondGRT;
    }

    mapping(uint => Request) internal requests;

    event LogDepERC20 (uint indexed _idReq, address indexed _addrTkn, uint256 indexed _amt, uint256 _chainId);
    event LogReqERC20 (uint indexed _idReq, address indexed _addrTkn, uint256 indexed _amt, uint256 _chainId);
    event LogCreateOffrERC20 (uint indexed _idReq, uint256 indexed _amtBond);
    event LogAcceptOffrERC20 (uint indexed _idReq);
    event LogRejectOffrERC20 (uint indexed _idReq);

    // Initialize
    function initialize() external initializer {
        __Ownable_init();
    }

    // Initial user who wants to obtain some ERC20 token: he makes a GRT deposit and a request for that
    function depositERC20(
        uint amntDepGRT_,
        address addrTknReq_,
        uint amntReq_,
        uint chnIdReq_
    ) public returns (bool) {
        
        bool succDep = IERC20(_addrGRT).transferFrom(msg.sender, address(this), amntDepGRT_);
        
        if (succDep) {
            
            emit LogDepERC20(_countReq, _addrGRT, amntDepGRT_, _chainIdGRT);
            emit LogReqERC20(_countReq, addrTknReq_, amntReq_, chnIdReq_);
            
            requests[_countReq] = Request(
                msg.sender,
                _addrGRT,
                amntDepGRT_,
                _chainIdGRT,
                addrTknReq_,
                amntReq_,
                chnIdReq_,
                false,
                initOffer(),
                false,
                false
            );
            
            _countReq++;
        }
        
        return succDep;
    }

    // User can make an offer as a response to another user request
    function makeOfferERC20(
        uint _idReq,
        address addrTknOffr_,
        uint amntOffr_,
        uint chnIdOffr_
    ) public returns (bool) {

        require(!requests[_idReq].isOffer, "GRT pool: an offer has already been made or is already in progress on this request");
        require(addrTknOffr_ == requests[_idReq].addrTokenReq, "GRT pool: the token you propose is not the one the user wants");
        require(amntOffr_ == requests[_idReq].amntReq, "GRT pool: the amount of token you propose is not the one the user wants");
        require(chnIdOffr_ == requests[_idReq].chainIdReq, "GRT pool: the chain you propose is not the one the user wants");

        bool success = IERC20(_addrGRT).transferFrom(msg.sender, address(this), 1);
        
        if (success) {
            emit LogCreateOffrERC20(_idReq, 1);
            requests[_idReq].isOffer = true;
            requests[_idReq].offer = Offer(msg.sender, 1);
        }
        
        return success;
    }

    // User who made the request can then accept an offer associated with it
    function acceptOffer(uint _idReq) public {

        require(requests[_idReq].isOffer, "GRT pool: no offer to accept");
        require(!requests[_idReq].isOfferHnd, "GRT pool: the offer has already been honoured");
        require(msg.sender == requests[_idReq].userAdrr, "GRT pool: you are not authorized to accept an offer that has not been issued by you");

        requests[_idReq].isOfferAccepted = true;
        emit LogAcceptOffrERC20(_idReq);
    }

    // User who made the request can then reject an offer associated with it
    function rejectOffer(uint _idReq) public returns (bool) {

        require(requests[_idReq].isOffer, "GRT pool: no offer to accept");
        require(!requests[_idReq].isOfferHnd, "GRT pool: the offer has already been honoured");
        require(msg.sender == requests[_idReq].userAdrr, "GRT pool: you are not authorized to accept an offer that has not been issued by you");

        bool success = IERC20(_addrGRT).transfer(requests[_idReq].offer.userAdrr, requests[_idReq].offer.bondGRT);

        if (success) {
            emit LogRejectOffrERC20(_idReq);
            requests[_idReq].offer = initOffer(); 
        }
        return success;            
    }

    // Initialize a new offer
    function initOffer() internal pure returns (Offer memory) {
        return Offer(address(0), 0);
    }

    // Get information for a given request (deposit)
    function getInfoDep(uint _idReq) external view returns (
        address userAdrr,
        address addrTokenDep,
        uint amntDep,
        uint chainIdDep
    ) {
        return (
            requests[_idReq].userAdrr,
            requests[_idReq].addrTokenDep,
            requests[_idReq].amntDep,
            requests[_idReq].chainIdDep
        );
    }

    // Get information for a given request (request)
    function getInfoReq(uint _idReq) external view returns (
        address userAdrr,
        address addrTokenReq,
        uint amntReq,
        uint chainIdReq
    ) {
        return (
            requests[_idReq].userAdrr,
            requests[_idReq].addrTokenReq,
            requests[_idReq].amntReq,
            requests[_idReq].chainIdReq
        );
    }

    // Get information for a given request (offer)
    function getInfoOffr(uint _idReq) external view returns (
        address userAdrr,
        bool isOffer,
        address offrUserAdrr,
        uint offrBondGRT,
        bool isOfferAccepted,
        bool isOfferHnd
    ) {
        return (
            requests[_idReq].userAdrr,
            requests[_idReq].isOffer,
            requests[_idReq].offer.userAdrr,
            requests[_idReq].offer.bondGRT,
            requests[_idReq].isOfferAccepted,
            requests[_idReq].isOfferHnd
        );

    }

    function tmpModifyGRTAddr(address addr) external {
       _addrGRT = addr;
    }   


}