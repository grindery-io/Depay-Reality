import { task } from "hardhat/config";

const version_protocol = "v-testnet-launch";

task("updateGrtPool", "Update GRT Pool for testnet launch")
  .addParam("address", "Address of the GRT Pool")
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;

    console.log("###############################################");
    console.log("Updating GRT Pool on:", hre.network.name, "...");
    console.log("###############################################");

    const grtPoolUpdate = await upgrades.upgradeProxy(
      taskArgs.address,
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

    if (hre.network.name === "bscTestnet" || hre.network.name === "goerli") {
      await hre.run("verify:verify", {
        address: grtPoolUpdate.address,
      });
    }
  });
