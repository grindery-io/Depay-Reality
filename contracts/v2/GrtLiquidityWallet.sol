// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GrtLiquidityWalletV2 is OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;
    address private _bot;

    event LogTradePaid(
        bytes32 indexed _offerId,
        bytes32 indexed _tradeId,
        address indexed _token,
        address _to,
        uint256 _amount
    );

    function initialize(address bot) external initializer {
        __Ownable_init();
        _bot = bot;
    }

    function _authorizeUpgrade(address) internal override onlyOwner onlyProxy {}

    receive() external payable {}

    function setBot(address bot) external onlyOwner {
        _bot = bot;
    }

    function getBot() external view returns (address) {
        return _bot;
    }

    function withdrawERC20(address token, uint256 amount) external onlyOwner {
        return IERC20(token).safeTransfer(msg.sender, amount);
    }

    function withdrawNative(uint256 amount) external onlyOwner returns (bool) {
        require(address(this).balance >= amount, "Grindery wallet: insufficient balance.");
        (bool sent, ) = msg.sender.call{ value: amount }("");
        require(sent, "Grindery wallet: failed to send native tokens.");
        return sent;
    }

    function payTradeWithERC20Tokens(
        bytes32 offerId,
        bytes32 tradeId,
        address token,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(msg.sender == owner() || msg.sender == _bot, "Grindery wallet: not allowed to pay the trade.");
        IERC20(token).safeTransfer(to, amount);
        emit LogTradePaid(offerId, tradeId, token, to, amount);
        return true;
    }

    function payTradeWithNativeTokens(
        bytes32 offerId,
        bytes32 tradeId,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(msg.sender == owner() || msg.sender == _bot, "Grindery wallet: not allowed to pay the trade.");
        require(address(this).balance >= amount, "Grindery wallet: insufficient balance.");
        (bool sent, ) = to.call{ value: amount }("");
        require(sent, "Grindery wallet: failed to send native tokens.");
        emit LogTradePaid(offerId, tradeId, address(0), to, amount);
        return true;
    }
}
