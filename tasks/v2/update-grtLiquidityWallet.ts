import { task } from 'hardhat/config';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';
import { registerSigner } from '../../lib/gcpSigner';

task(
  'updateGrtLiquidityWalletV2',
  'Update GRT Liquidity Wallet for testnet launch'
)
  .addParam('address', 'Address of the Liquidity Wallet')
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Updating GRT Liquidity Wallet on:', hre.network.name, '...');
    console.log('###############################################');

    const grtLiquidityWalletUpdate = await upgrades.upgradeProxy(
      taskArgs.address,
      await ethers.getContractFactory(
        'contracts/v2/GrtLiquidityWallet.sol:GrtLiquidityWalletV2'
      )
    );

    console.log('--------------------------------------------');
    console.log(
      'GRT Liquidity Wallet updated to:',
      grtLiquidityWalletUpdate.address
    );
    console.log(
      'GRT Liquidity Wallet updated - owner address:',
      await grtLiquidityWalletUpdate.owner()
    );
    console.log('--------------------------------------------');
  });
