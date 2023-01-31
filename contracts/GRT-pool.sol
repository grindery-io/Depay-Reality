// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

import './RealityETH_ERC20_v3_0.sol';
import './IERC20.sol';

contract GRTPOOL is RealityETH_ERC20_v3_0 {

    address owner;
    address GRTaddress;
    mapping(address => uint256) tokenExchangeRate;
    modifier onlyOwner () {
    require (msg.sender == owner, "Not owner");
    _;
    }
    constructor () {
        owner = msg.sender;
    }
    function setExchangeRate (address _tokenAddress, uint256 exchangeRate) external onlyOwner{
        require (tokenExchangeRate[_tokenAddress] == 0, "Exchange rate set");
        tokenExchangeRate[_tokenAddress] = exchangeRate;
    }

    function depositGRT (uint256 grt_amount, uint256 chain_id, address token_to_withdraw, address recipient_address, uint32 timeout, uint32 opening_ts, uint256 nonce) external returns (address, uint256, bytes32) {
        require (tokenExchangeRate[token_to_withdraw] != 0, "exchange rate does not exist");
        uint256 exchange = tokenExchangeRate[token_to_withdraw];
        uint256 amountOfTokenExpected = exchange * grt_amount;
        require (IERC20(token_to_withdraw).balanceOf(address(this)) >= amountOfTokenExpected, "Not enough funds to secure this transaction");
        string memory tokensAmount = uintToString(amountOfTokenExpected);
        string memory chainId = uintToString(chain_id);
        string memory tokenAddress = addressToString(token_to_withdraw);
        string memory receipientAddress = addressToString(recipient_address);
        string memory question = string.concat(receipientAddress, tokenAddress, chainId, tokensAmount);
        uint id = createTemplate(question);
        bytes32 questionId = askQuestionERC20(id, question, address(0), 1, 0, 0, grt_amount);
        return (recipient_address, amountOfTokenExpected, questionId);
    }

    function submitClaim (address recipient_address, address token_to_withdraw, uint256 token_amount, bytes32 question_id, uint256 chain_id, uint256 security_deposit, uint256 max_previous) public {
        string memory tokensAmount = uintToString(token_amount);
        string memory chainId = uintToString(chain_id);
        string memory tokenAddress = addressToString(token_to_withdraw);
        string memory receipientAddress = addressToString(recipient_address);
        bytes32 answer = keccak256(abi.encodePacked(string.concat(receipientAddress, tokenAddress, chainId, tokensAmount)));
        submitAnswerERC20(question_id, answer, max_previous, security_deposit);
    }

    function addressToString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }

    function uintToString(uint256 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }


    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}