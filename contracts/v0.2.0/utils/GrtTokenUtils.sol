// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract GrtTokenUtils {

    address internal _addrGRT;

    mapping(address => uint256) internal _stakes;

    event LogStake(
        address indexed _user,
        uint256 indexed _amount
    );

    function initializeGrtTokenUtils(address addrGRT) internal {
        // __Ownable_init();
        _addrGRT = addrGRT;
    }

    function stakeGRT(uint256 amount) external returns (bool) {
        depositGRT(amount);
        emit LogStake(msg.sender, amount);
        _stakes[msg.sender] += amount;
        return true;
    }

    function depositGRT(uint256 amount) internal returns (bool) {
        return IERC20(_addrGRT).transferFrom(msg.sender, address(this), amount);
    }

    function getGrtAddress() external view returns (address) {
        return _addrGRT;
    }

    function stakeOf(address account) external view returns (uint256) {
       return _stakes[account];
    }

}