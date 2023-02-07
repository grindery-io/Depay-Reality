// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IRealityEth.sol";

contract GRTPOOL is OwnableUpgradeable {

    address addrtmpReality;
    struct Question {
        uint256 templateId;
        uint256 questionId;
    }


    constructor (address _addrtmpReality) {
        addrtmpReality = _addrtmpReality;
    }
    
    address internal GRTaddress = 0x1e3C935E9A45aBd04430236DE959d12eD9763162;
    uint256 internal _chainIdGRT = 5;
    uint256 internal templateIdERC20;
    mapping(address => uint256) tokenExchangeRate;
    mapping(address => mapping(address => uint256)) balanceTokens;
    mapping (address => mapping(bytes32 => Deposit)) questionIdToDeposit;
    mapping(address => mapping(bytes32 => bool)) public canWithdrawFunds;

    mapping(bytes32 => bytes32) QuestionTx;
    mapping(bytes32 => bool) isTxAlreadyCovered;

    event LogDepositERC20 (address indexed _addrToken, uint256 indexed _amount);
    event LogWithdrawInfoERC20 (address indexed _addrToken, uint256 indexed _chainId, uint256 indexed _amount, uint256 _rewardAmnt);

    event logTemplateCreated(uint256 templateId);
    event logQuestionCreated(bytes32 questionId);

    struct Deposit {
        uint256 amount;
        uint96 chainId;
        address recipientAddr;
        address tokenWithdrawAddr;
        uint256 tokenWithdrawalAmount;
    }

    function initialize() external initializer {
        __Ownable_init();
    }

    function createRealityERC20Template(string memory _templateERC20) external returns (uint256) {
        templateIdERC20 = IRealityETH(addrtmpReality).createTemplate(_templateERC20);
        emit logTemplateCreated(templateIdERC20);
        return templateIdERC20;
    }

    function createQuestionERC20(
        string memory question,
        bytes32 _txHash, 
        uint256 _amountDeposit,
        address _addrTokenWithdraw,
        address _recieverAddress,
        uint256 templateId
    ) public payable returns (bytes32) {
        require (msg.value > 0 , "Question bond must be greater than 0");
        uint256 exchange = tokenExchangeRate[_addrTokenWithdraw];
        uint256 amountOfTokenExpected = exchange * _amountDeposit;
        bytes32 questionReality = IRealityETH(addrtmpReality).askQuestion{value: msg.value}(
            templateId,
            question,
            address(this),
            1 days,
            0,
            0
        );

        QuestionTx[keccak256(abi.encodePacked(_txHash, _chainIdGRT))] = questionReality;
        emit logQuestionCreated(questionReality);
        questionIdToDeposit[msg.sender][questionReality] = Deposit(_amountDeposit, uint96(_chainIdGRT), _recieverAddress, _addrTokenWithdraw, amountOfTokenExpected);
        return questionReality;     
    }

    function setExchangeRate (address _tokenAddress, uint256 exchangeRate) external onlyOwner{
        require (tokenExchangeRate[_tokenAddress] == 0, "Exchange rate set");
        tokenExchangeRate[_tokenAddress] = exchangeRate;
    }

    function transferERC20(
        uint amount_, 
        uint chainId_, 
        address tokenWithdrawAddr_
    ) external returns (bool) {
        require (tokenExchangeRate[tokenWithdrawAddr_] != 0, "exchange rate does not exist");
        uint256 exchange = tokenExchangeRate[tokenWithdrawAddr_];
        uint256 amountOfTokenExpected = exchange * amount_;
        require (IERC20(tokenWithdrawAddr_).balanceOf(address(this)) >= amountOfTokenExpected, "Not enough funds to secure this transaction");
        bool success = IERC20(GRTaddress).transferFrom(msg.sender, address(this), amount_);
        if (success) {
            emit LogDepositERC20(GRTaddress, amount_);
            emit LogWithdrawInfoERC20(tokenWithdrawAddr_, chainId_, amount_, amountOfTokenExpected);
        }
        return success;
    }

    function answerQuestion(
        string memory _answer,
        bytes32 _questionId,
        uint256 _maxPrevious
    ) public payable{
        require (msg.value > 0, "Bond must be greater than zero");
        bytes32 answer = keccak256(abi.encodePacked(_answer));
        IRealityETH(addrtmpReality).submitAnswerFor{value: msg.value}(_questionId, answer, _maxPrevious, msg.sender);
    }

    function claimWinnings (
        bytes32 _questionId,
        bytes32[] memory _history_hashes,
        address[] memory _addrs,
        uint256[] memory _bonds,
        bytes32[] memory _answers
        ) external {
        address recieverAddress = questionIdToDeposit[msg.sender][_questionId].recipientAddr;
        IRealityETH(addrtmpReality).claimWinnings( _questionId, _history_hashes, _addrs, _bonds, _answers);
        canWithdrawFunds[recieverAddress][_questionId] = true;
    }

    function claimDepositExchange (bytes32 _questionId, address _grtDepositor) external {
        address addrTokenWithdraw = questionIdToDeposit[_grtDepositor][_questionId].tokenWithdrawAddr;
        address recieverAddress = questionIdToDeposit[_grtDepositor][_questionId].recipientAddr;
        require(msg.sender == recieverAddress, "Wrong reward claimer" );
        uint256 tokenAmount = questionIdToDeposit[_grtDepositor][_questionId].tokenWithdrawalAmount;
        require (canWithdrawFunds[recieverAddress][_questionId] == true, "Cannot yet claim exchange deposit");
        IERC20(addrTokenWithdraw).transfer(recieverAddress, tokenAmount);
        canWithdrawFunds[recieverAddress][_questionId] = false;
    } 

    function isFinalized(bytes32 question_id) 
    view public returns (bool) {
        return  IRealityETH(addrtmpReality).isFinalized(question_id);
    }

    function getFinalAnswer(bytes32 question_id) 
    external view returns (bytes32) {
        return IRealityETH(addrtmpReality).getFinalAnswer(question_id);
    }

    function getBounty (bytes32 question_id) 
    external view returns (uint256) {
        return IRealityETH(addrtmpReality).getBounty(question_id);
    }

    function getBestAnswer(bytes32 question_id) 
    public view returns(bytes32) {
        return IRealityETH(addrtmpReality).getBestAnswer(question_id);
    }

    function getHistoryHash (bytes32 question_id) public view returns (bytes32) {
        return IRealityETH(addrtmpReality).getHistoryHash(question_id);
    }

    // function isTxCovered(bytes32 hash_, uint256 chainId_) external view returns (bool) {
    //     return isTxAlreadyCovered[keccak256(abi.encodePacked(hash_, chainId_))];
    // }

    // function _setTxCovered(bytes32 hash_, uint256 chainId_) internal {
    //     isTxAlreadyCovered[keccak256(abi.encodePacked(hash_, chainId_))] = true;
    // }

    


}