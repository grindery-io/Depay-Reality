// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;

// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GrtTokenUtils {

    address internal _addrGRT;

    mapping(address => mapping(uint256 => uint256)) internal _stakes;

    event LogStake(
        address indexed _user,
        uint256 indexed _chainId,
        uint256 indexed _amount
    );
    event LogUnStake(
        address indexed _user,
        uint256 indexed _chainId,
        uint256 indexed _amount
    );

    function initializeGrtTokenUtils(address addrGRT) internal {
        // __Ownable_init();
        _addrGRT = addrGRT;
    }

    function stakeGRT(
        uint256 amount,
        uint256 chainId
    ) external returns (bool) {
        depositGRT(amount);
        emit LogStake(msg.sender, chainId, amount);
        _stakes[msg.sender][chainId] += amount;
        return true;
    }

    function unstakeGRT(
        uint256 amount,
        uint256 chainId
    ) external returns (bool) {
        require(_stakes[msg.sender][chainId] > amount, "not enough staked GRT");
        IERC20(_addrGRT).transfer(msg.sender, amount);
        emit LogUnStake(msg.sender, chainId, amount);
        _stakes[msg.sender][chainId] -= amount;
        return true;
    }

    function depositGRT(uint256 amount) internal returns (bool) {
        return IERC20(_addrGRT).transferFrom(msg.sender, address(this), amount);
    }

    function getGrtAddress() external view returns (address) {
        return _addrGRT;
    }

    function stakeOf(
        address account,
        uint256 chainId
    ) external view returns (uint256) {
       return _stakes[account][chainId];
    }

}