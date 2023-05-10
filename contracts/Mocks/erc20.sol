// SPDX-License-Identifier: MIT
// compiler version must be greater than or equal to 0.8.13 and less than 0.9.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Sample is ERC20 {
    constructor() ERC20("Token", "TK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
