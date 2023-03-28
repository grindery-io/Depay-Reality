import { task } from "hardhat/config";

const version_protocol = "v-testnet-launch";

task(
  "updateGrtLiquidityWallet",
  "Update GRT Liquidity Wallet for testnet launch"
)
  .addParam("address", "Address of the Liquidity Wallet")
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;
    const { owner } = await getNamedAccounts();

    console.log("###############################################");
    console.log("Updating GRT Liquidity Wallet on:", hre.network.name, "...");
    console.log("###############################################");

    const grtLiquidityWalletUpdate = await upgrades.upgradeProxy(
      taskArgs.address,
      await ethers.getContractFactory(
        `contracts/${version_protocol}/GrtLiquidityWallet.sol:GrtLiquidityWallet`
      )
    );

    console.log("--------------------------------------------");
    console.log(
      "GRT Liquidity Wallet updated to:",
      grtLiquidityWalletUpdate.address
    );
    console.log(
      "GRT Liquidity Wallet updated - owner address:",
      await grtLiquidityWalletUpdate.owner()
    );
    console.log("--------------------------------------------");

    if (hre.network.name === "bscTestnet" || hre.network.name === "goerli") {
      await hre.run("verify:verify", {
        address: grtLiquidityWalletUpdate.address,
      });
    }
  });
