// Right click on the script name and hit "Run" to execute
// const { ethers } = require("hardhat");
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  let GRINDERYPOOL;

  const _REALITYETH = await ethers.getContractFactory("RealityETH_v3_0");
  const REALITYETH = await _REALITYETH.deploy()
  console.log(REALITYETH.address)

  const _GRINDERYPOOL = await ethers.getContractFactory("GRINDERYPOOL");
  GRINDERYPOOL = await _GRINDERYPOOL.deploy(REALITYETH.address);
  await GRINDERYPOOL.deployed();

  console.log('GRINDERYPOOL deployed at:' + GRINDERYPOOL.address)

  const _GRTToken = await ethers.getContractFactory('ERC20')
  const GRTToken = await _GRTToken.deploy();
  await GRTToken.deployed();


};
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});