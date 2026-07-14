// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title VoiceSafe Token
/// @notice Fixed-supply ERC-20 token for the VoiceSafe ecosystem.
/// @dev The complete supply is minted once to the deployer. No mint function is exposed.
contract VoiceSafeToken is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10 ** 18;

    constructor() ERC20("VoiceSafe Token", "VSAFE") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
