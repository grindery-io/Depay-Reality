import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    }
  }
};

export default config;