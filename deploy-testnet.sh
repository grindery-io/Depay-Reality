#!/bin/bash

echo --------------- DEPLOYING ON GOERLI -------------------------
npx hardhat deploy --network goerli
echo --------------- DEPLOYING ON BSC TESTNET -------------------------
npx hardhat deploy --network bscTestnet
echo --------------- DEPLOYING ON CRONOS TESTNET -------------------------
npx hardhat deploy --network cronosTestnet
