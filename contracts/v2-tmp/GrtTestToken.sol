//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract GrtTestToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    address private _minter;

    function initialize(string memory name, string memory symbol, address minter) external initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();
        _minter = minter;
    }

    modifier onlyMinter() {
        require(_minter == _msgSender(), "Caller is not the minter");
        _;
    }

    function setMinter(address minter) external onlyOwner {
        _minter = minter;
    }

    function getMinter() external view returns (address) {
        return _minter;
    }

    function mint(address account, uint amount) external onlyMinter {
        _mint(account, amount);
    }

    function burn(address account, uint amount) external onlyMinter {
        _burn(account, amount);
    }
}
