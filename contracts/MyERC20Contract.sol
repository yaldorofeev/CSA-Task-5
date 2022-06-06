//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract MyERC20Contract is ERC20, AccessControl {

  bytes32 public constant MINTER_BURNER = keccak256("MINTER_BURNER");

  constructor() ERC20("SuperTokenCrossChain", "STCC") {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function mint(address _account, uint256 _amount) public returns (bool success) {
    require(hasRole(MINTER_BURNER, msg.sender), "Caller is not a minter");
    _mint(_account, _amount);
    return true;
  }

  function burn(address _account, uint256 _amount) public returns (bool success) {
    require(hasRole(MINTER_BURNER, msg.sender), "Caller is not a burner");
    _burn(_account, _amount);
    return true;
  }

}
