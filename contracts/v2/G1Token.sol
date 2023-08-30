//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract G1Token is ERC20, AccessControl {
    bytes32 public constant MINTER_BURNER_ROLE = keccak256("MINTER_BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor(string memory name, string memory symbol, address minter) ERC20(name, symbol) {
        _setupRole(MINTER_BURNER_ROLE, minter);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address account, uint256 amount) external onlyRole(MINTER_BURNER_ROLE) {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external onlyRole(MINTER_BURNER_ROLE) {
        _burn(account, amount);
    }
}
