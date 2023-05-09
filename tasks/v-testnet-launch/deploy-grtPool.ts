import { task } from "hardhat/config";

const version_protocol = "v-mainnet-launch";

task("deployGrtPool", "Deploy GRT Pool for testnet launch")
  .addParam("tokenaddress", "ERC20 token address")
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;

    console.log("###############################################");
    console.log("Deploying GRT Pool on:", hre.network.name, "...");
    console.log("###############################################");

    const grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory(
        `contracts/${version_protocol}/GrtPool.sol:GrtPool`
      ),
      [taskArgs.tokenaddress]
    );

    await grtPool.deployed();

    console.log("--------------------------------------------");
    console.log("GRT pool deployed to:", grtPool.address);
    console.log("GRT pool - owner address:", await grtPool.owner());
    console.log("--------------------------------------------");

    if (hre.network.name === "bscTestnet" || hre.network.name === "goerli") {
      await hre.run("verify:verify", {
        address: grtPool.address,
      });
    }
  });
