// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.17;

interface IGrtSatellite {
    function rewardOffer(bytes32 offerId, uint256 amount) external returns (bool);
}
