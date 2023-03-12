#!/bin/bash

echo --------------- DEPLOYING ON GOERLI -------------------------
npx hardhat deploy --network goerli --tags GrtPool,GrtSatellite
echo --------------- DEPLOYING ON BSC TESTNET -------------------------
npx hardhat deploy --network bscTestnet --tags GrtPool,GrtSatellite
echo --------------- DEPLOYING ON CRONOS TESTNET -------------------------
npx hardhat deploy --network cronostestnet --tags GrtPool,GrtSatellite




# echo --------------- DEPLOYING ON GOERLI -------------------------
# npx hardhat deploy
# echo --------------- DEPLOYING ON BSC TESTNET -------------------------
# npx hardhat deploy
# # echo --------------- DEPLOYING ON CRONOS TESTNET -------------------------
# # npx hardhat deploy --network cronostestnet

