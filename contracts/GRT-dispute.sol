// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IRealityETH.sol";

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
    function initializeDispute(address addrReality) external initializer {
        __Ownable_init();
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