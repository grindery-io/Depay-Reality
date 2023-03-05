// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.17;


contract ChainlinkTest {

    function latestRoundData()
    external
    pure
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    ) {
        return (
            10,
            20,
            30,
            5,
            67
        );
    }
}