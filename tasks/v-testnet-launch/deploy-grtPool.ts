import { task } from "hardhat/config";

const version_protocol = "v-testnet-launch";

task("deployGrtPool", "Deploy GRT Pool for testnet launch").setAction(
  async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;

    console.log("###############################################");
    console.log("Deploying GRT Pool on:", hre.network.name, "...");
    console.log("###############################################");

    const grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory(
        `contracts/${version_protocol}/GrtPool.sol:GrtPool`
      )
    );

    await grtPool.deployed();
    await grtPool.initializePool();

    console.log("--------------------------------------------");
    console.log("GRT pool deployed to:", grtPool.address);
    console.log("GRT pool - owner address:", await grtPool.owner());
    console.log("--------------------------------------------");

    const grtPoolUpdate = await upgrades.upgradeProxy(
      grtPool.address,
      await ethers.getContractFactory(
        `contracts/${version_protocol}/GrtPool.sol:GrtPool`
      )
    );

    console.log("--------------------------------------------");
    console.log("GRT pool updated to:", grtPoolUpdate.address);
    console.log(
      "GRT pool updated - owner address:",
      await grtPoolUpdate.owner()
    );
    console.log("--------------------------------------------");
  }
);
