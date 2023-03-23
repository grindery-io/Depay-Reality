import { task } from "hardhat/config";

const version_protocol = "v-testnet-launch";

task(
  "deployGrtLiquidityWallet",
  "Deploy GRT Liquidity Wallet for testnet launch"
)
  .addParam("owner", "Owner of the liquidity wallet")
  .addParam("bot", "Address of the bot who can pay offers")
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;
    const { owner } = await getNamedAccounts();

    console.log("###############################################");
    console.log("Deploying GRT Liquidity Wallet on:", hre.network.name, "...");
    console.log("###############################################");

    const grtLiquidityWallet = await upgrades.deployProxy(
      await ethers.getContractFactory(
        `contracts/${version_protocol}/GrtLiquidityWallet.sol:GrtLiquidityWallet`
      )
    );

    await grtLiquidityWallet.deployed();
    await grtLiquidityWallet.initializeLiquidityWallet(taskArgs.bot);

    console.log("--------------------------------------------");
    console.log(
      "GRT Liquidity Wallet deployed to:",
      grtLiquidityWallet.address
    );
    console.log(
      "GRT Liquidity Wallet - owner address:",
      await grtLiquidityWallet.owner()
    );
    console.log("--------------------------------------------");

    const grtLiquidityWalletUpdate = await upgrades.upgradeProxy(
      grtLiquidityWallet.address,
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

    if ((await grtLiquidityWalletUpdate.owner()) !== taskArgs.owner) {
      await grtLiquidityWalletUpdate
        .connect(await ethers.getSigner(owner))
        .transferOwnership(taskArgs.owner);

      console.log("--------------------------------------------");
      console.log(
        "GRT Liquidity Wallet owner updated to:",
        await grtLiquidityWalletUpdate.owner()
      );
      console.log("--------------------------------------------");
    }
  });
