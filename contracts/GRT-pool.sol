// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IRealityETH.sol";
//import "https://github.com/RealityETH/reality-eth-monorepo/blob/main/packages/contracts/development/contracts/IRealityETH_ERC20.sol";

contract GRTPOOL is OwnableUpgradeable {

    address addrtmpReality;
    struct Question {
        uint256 templateId;
        uint256 questionId;
    }
    struct UserDetails {
        address tokenAddressTowithdraw;
        address recieverAddress;
        uint256 tokenAmountTowithdraw;
    }

    struct IsFundsDeposited {
        bool active;
        address tokenAddressTowithdraw;
    }

    constructor (address _addrtmpReality) {
        addrtmpReality = _addrtmpReality;
    }
    address internal GRTaddress = 0x1e3C935E9A45aBd04430236DE959d12eD9763162;
    uint256 internal chainId = 5;
    uint256 internal templateIdERC20;
    mapping(address => uint256) tokenExchangeRate;
    mapping(address => mapping(address => uint256)) balanceTokens;
    mapping (address => mapping(bytes32 => UserDetails)) questionIdToUserDetails;
    mapping(address=> mapping(uint256 => IsFundsDeposited)) isFundsDeposited;
    mapping(address => mapping(bytes32 => bool)) canWithdrawFunds;

    string templateERC20 = '{'
        '"title": "I propose the transaction %s on chain %s with a deposit of %s tokens ERC20 (%s) and therefore a request of %s tokens ERC20 (%s) on chain %s, who wants to help?",'
        '"type": "address",'
        '"category": "payment-request",' 
        '"lang": "eng"'
    '}';
    mapping(bytes32 => bytes32) QuestionTx;
    mapping(bytes32 => bool) isTxAlreadyCovered;

    event LogDepositERC20 (address indexed _addrToken, uint256 indexed _amount);
    event LogWithdrawInfoERC20 (address indexed _addrToken, uint256 indexed _chainId, uint256 indexed _amount, uint256 _rewardAmnt);

    struct Deposit {
        uint256 _amount;
        address _tokenDepositAddr;
        uint256 _chainId;
        address _tokenWithdrawAddr;
        address _recipientAddr;
    }

    function initialize() external initializer {
        __Ownable_init();
    }

    function createRealityERC20Template() external returns (uint256) {
        templateIdERC20 = IRealityETH(addrtmpReality).createTemplate(templateERC20);
        return templateIdERC20;
    }

    function createQuestionERC20(
        bytes32 _txHash, 
        uint256 _chainIdDeposit,
        uint256 _amountDeposit,
        address _addrTokenDeposit,
        address _addrTokenWithdraw,
        uint256 _chainIdWithdraw,
        address _recieverAddress
    ) public payable returns (bytes32) {
        require((isFundsDeposited[msg.sender][_amountDeposit].active  == true && isFundsDeposited[msg.sender][_amountDeposit].tokenAddressTowithdraw == _addrTokenWithdraw), "Deposit funds before asking questions");
        uint256 exchange = tokenExchangeRate[_addrTokenWithdraw];
        uint256 amountOfTokenExpected = exchange * _amountDeposit;
        bytes32 questionReality = IRealityETH(addrtmpReality).askQuestion(
            templateIdERC20,
            string.concat(
                string(abi.encodePacked(_txHash)), unicode"␟", 
                Strings.toHexString(_chainIdDeposit), unicode"␟", 
                Strings.toHexString(_amountDeposit), unicode"␟", 
                Strings.toHexString(uint256(uint160(_addrTokenDeposit)), 20), unicode"␟", 
                Strings.toHexString(amountOfTokenExpected), unicode"␟", 
                Strings.toHexString(uint256(uint160(_addrTokenWithdraw)), 20), unicode"␟", 
                Strings.toHexString(_chainIdWithdraw)
            ),
            address(this),
            1 days,
            0,
            0
        );

        QuestionTx[keccak256(abi.encodePacked(_txHash, _chainIdDeposit))] = questionReality;
        delete(isFundsDeposited[msg.sender][_amountDeposit]);
        UserDetails memory _userDetails = UserDetails(_addrTokenWithdraw, _recieverAddress, amountOfTokenExpected);
        questionIdToUserDetails[msg.sender][questionReality] = _userDetails;

        return questionReality;     
    }
    function setExchangeRate (address _tokenAddress, uint256 exchangeRate) external onlyOwner{
        require (tokenExchangeRate[_tokenAddress] == 0, "Exchange rate set");
        tokenExchangeRate[_tokenAddress] = exchangeRate;
    }

    function transferERC20(
        address addrToken_, 
        uint amount_, 
        uint chainId_, 
        address tokenWithdrawAddr_
    ) external returns (bool) {
        require (tokenExchangeRate[tokenWithdrawAddr_] != 0, "exchange rate does not exist");
        uint256 exchange = tokenExchangeRate[tokenWithdrawAddr_];
        uint256 amountOfTokenExpected = exchange * amount_;
        require (IERC20(tokenWithdrawAddr_).balanceOf(address(this)) >= amountOfTokenExpected, "Not enough funds to secure this transaction");
        require((isFundsDeposited[msg.sender][amount_].active  == false && isFundsDeposited[msg.sender][amount_].tokenAddressTowithdraw == address(0)), "Complete previous transaction");
        bool success = IERC20(addrToken_).transferFrom(msg.sender, address(this), amount_);
        if (success) {
            emit LogDepositERC20(addrToken_, amount_);
            emit LogWithdrawInfoERC20(tokenWithdrawAddr_, chainId_, amount_, amountOfTokenExpected);
            IsFundsDeposited memory _a = IsFundsDeposited(true, tokenWithdrawAddr_);
            isFundsDeposited[msg.sender][amount_] = _a;
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
        IRealityETH(addrtmpReality).submitAnswer{value: msg.value}(_questionId, answer, _maxPrevious);
    }

    function claimWinnings (
        bytes32 _questionId,
        bytes32[] memory _history_hashes,
        address[] memory _addrs,
        uint256[] memory _bonds,
        bytes32[] memory _answers
        ) external {
        address recieverAddress = questionIdToUserDetails[msg.sender][_questionId].recieverAddress;
        IRealityETH(addrtmpReality).claimWinnings( _questionId, _history_hashes, _addrs, _bonds, _answers);
        canWithdrawFunds[recieverAddress][_questionId] = true;
    }

    function claimDepositExchange (bytes32 _questionId, address _grtDepositor) external {
        address addrTokenWithdraw = questionIdToUserDetails[_grtDepositor][_questionId].tokenAddressTowithdraw;
        address recieverAddress = questionIdToUserDetails[_grtDepositor][_questionId].recieverAddress;
        require(msg.sender == recieverAddress, "Wrong reward claimer" );
        uint256 tokenAmount = questionIdToUserDetails[_grtDepositor][_questionId].tokenAmountTowithdraw;
        require (canWithdrawFunds[recieverAddress][_questionId] == true, "Cannot yet claim exchange deposit");
        IERC20(addrTokenWithdraw).transferFrom(address(this), recieverAddress, tokenAmount);
        canWithdrawFunds[recieverAddress][_questionId] = false;
    } 


    function questionIdFromHash(bytes32 hash_, uint256 chainId_) external view returns (bytes32) {
        return QuestionTx[keccak256(abi.encodePacked(hash_, chainId_))];
    }

    function isTxCovered(bytes32 hash_, uint256 chainId_) external view returns (bool) {
        return isTxAlreadyCovered[keccak256(abi.encodePacked(hash_, chainId_))];
    }

    function _setTxCovered(bytes32 hash_, uint256 chainId_) internal {
        isTxAlreadyCovered[keccak256(abi.encodePacked(hash_, chainId_))] = true;
    }

    


}