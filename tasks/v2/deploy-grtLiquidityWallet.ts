import { task } from 'hardhat/config';

task(
  'deployGrtLiquidityWalletV2',
  'Deploy GRT Liquidity Wallet for testnet launch'
)
  .addParam('owner', 'Owner of the liquidity wallet')
  .addParam('bot', 'Address of the bot who can pay offers')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;
    const { owner } = await getNamedAccounts();

    console.log('###############################################');
    console.log('Deploying GRT Liquidity Wallet on:', hre.network.name, '...');
    console.log('###############################################');

    const grtLiquidityWallet = await upgrades.deployProxy(
      await ethers.getContractFactory(
        'contracts/v2/GrtLiquidityWallet.sol:GrtLiquidityWalletV2'
      ),
      [taskArgs.bot]
    );

    await grtLiquidityWallet.deployed();

    console.log('--------------------------------------------');
    console.log(
      'GRT Liquidity Wallet deployed to:',
      grtLiquidityWallet.address
    );
    console.log(
      'GRT Liquidity Wallet - owner address:',
      await grtLiquidityWallet.owner()
    );
    console.log(
      'GRT Liquidity Wallet - bot address:',
      await grtLiquidityWallet.getBot()
    );
    console.log('--------------------------------------------');

    if ((await grtLiquidityWallet.owner()) !== taskArgs.owner) {
      await (
        await grtLiquidityWallet
          .connect(await ethers.getSigner(owner))
          .transferOwnership(taskArgs.owner)
      ).wait();

      console.log('--------------------------------------------');
      console.log(
        'GRT Liquidity Wallet owner updated to:',
        await grtLiquidityWallet.owner()
      );
      console.log('--------------------------------------------');
    }
  });
