// SPDX-License-Identifier: GPL-3.0-only

pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GrtLiquidityWallet is OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;
    address _bot;

    event LogOfferPaid(bytes32 indexed _offerId, address indexed _token, address indexed _to, uint256 _amount);

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

    function payOfferWithERC20Tokens(
        bytes32 offerId,
        address token,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(msg.sender == owner() || msg.sender == _bot, "Grindery wallet: not allowed to pay the offer.");
        IERC20(token).safeTransfer(to, amount);
        emit LogOfferPaid(offerId, token, to, amount);
        return true;
    }

    function payOfferWithNativeTokens(bytes32 offerId, address to, uint256 amount) external returns (bool) {
        require(msg.sender == owner() || msg.sender == _bot, "Grindery wallet: not allowed to pay the offer.");
        require(address(this).balance >= amount, "Grindery wallet: insufficient balance.");
        (bool sent, ) = to.call{ value: amount }("");
        require(sent, "Grindery wallet: failed to send native tokens.");
        emit LogOfferPaid(offerId, address(0), to, amount);
        return true;
    }
}
