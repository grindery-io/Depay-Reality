// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

// import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./reality/IRealityETH.sol";

contract GrtDispute is OwnableUpgradeable {

    // Variables
    address private _addrReality;
    uint private _countQuestion;

    // Structure declarations
    struct QuestionReality {
        bytes32 txHash;
        address fromOffer;
        address toOffer;
        address tokenOffer;
        uint256 amountOffer;
        uint256 chainIdOffer;
    }

    // Mapping declarations
    mapping(uint => bytes32) private _questions;

    // Event declaration
    event LogTemplateCreated(uint indexed _templateId);
    event LogQuestionCreated(uint indexed _questionId, bytes32 indexed _realityQuestionId);

    // Initialize
    function initializeDispute(address addrReality) internal {
        //juju => removing the initializer modifier and __Ownable_init() from this function and making it internal to call with the GRT pool initializer function
        _addrReality = addrReality;
    }

    // Owner of the contract can create a new Reality template
    function createRealityERC20Template(string memory templateERC20) external onlyOwner returns (uint) {
        uint templateIdERC20 = IRealityETH(_addrReality).createTemplate(templateERC20);
        emit LogTemplateCreated(templateIdERC20);
        return templateIdERC20;
    }

    function createQuestionERC20(
        string memory question,
        uint256 templateId,
        bytes32 txHashOffer,
        address fromOffer,
        address toOffer,
        address tokenOffer,
        uint256 amountOffer,
        uint256 chainIdOffer
    ) public payable returns (bytes32, QuestionReality memory) {

        bytes32 questionReality = IRealityETH(_addrReality).askQuestion{value: msg.value}(
            templateId,
            question,
            address(this),
            1 days,
            0,
            0
        );

        _questions[_countQuestion] = questionReality;
        emit LogQuestionCreated(_countQuestion, questionReality);
        return (questionReality,  QuestionReality(
            txHashOffer,
            fromOffer,
            toOffer,
            tokenOffer,
            amountOffer,
            chainIdOffer
        ));
    }

    // exposing functions to submit answers and commitments
     function submitAnswerCommitment (
        bytes32 _answer_hash,
        bytes32 _questionId,
        uint256 _maxPrevious
    ) 
    external payable {
        require (msg.value > 0, "Bond must be greater than zero");
        IRealityETH(_addrReality).submitAnswerCommitment{value: msg.value}(_questionId, _answer_hash, _maxPrevious, msg.sender);
    }

    function submitAnswerReveal (
         string memory _answer,
         uint256 nonce,
        bytes32 _questionId,
        uint256 bond
    ) 
    external {
        bytes32 answer = keccak256(abi.encodePacked(_answer));
        IRealityETH(_addrReality).submitAnswerReveal(_questionId, answer, nonce, bond);
    }

    function answerQuestion(
        string memory _answer,
        bytes32 _questionId,
        uint256 _maxPrevious
    ) public payable {
        require (msg.value > 0, "Bond must be greater than zero");
        bytes32 answer = keccak256(abi.encodePacked(_answer));
        IRealityETH(_addrReality).submitAnswerFor{value: msg.value}(_questionId, answer, _maxPrevious, msg.sender);
    }

    // Extra function for test purposes
    function getBytes(string memory _str) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_str));
    }

    function claimWinnings (
        bytes32 questionId,
        bytes32[] memory history_hashes,
        address[] memory addrs,
        uint256[] memory bonds,
        bytes32[] memory answers
    ) internal {
        IRealityETH(_addrReality).claimWinnings( questionId, history_hashes, addrs, bonds, answers);
    }

    function isFinalized(bytes32 question_id) external view returns (bool) {
        return  IRealityETH(_addrReality).isFinalized(question_id);
    }

    function getFinalAnswer(bytes32 question_id) public view returns (bytes32) {
        return IRealityETH(_addrReality).getFinalAnswer(question_id);
    }

    function getHistoryHash (bytes32 question_id) public view returns (bytes32) {
        return IRealityETH(_addrReality).getHistoryHash(question_id);
    }


    function setAddrReality(address addr) external onlyOwner {
       _addrReality = addr;
    }
}