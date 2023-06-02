import { task } from 'hardhat/config';
import { registerSigner } from '../../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';

task('updateGrtPoolV2', 'Update GRT Pool for testnet launch')
  .addParam('address', 'Address of the GRT Pool')
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Updating GRT Pool on:', hre.network.name, '...');
    console.log('###############################################');

    const grtPoolUpdate = await upgrades.upgradeProxy(
      taskArgs.address,
      await ethers.getContractFactory('contracts/v2/GrtPool.sol:GrtPool')
    );

    console.log('--------------------------------------------');
    console.log('GRT pool updated to:', grtPoolUpdate.address);
    console.log(
      'GRT pool updated - owner address:',
      await grtPoolUpdate.owner()
    );
    console.log('--------------------------------------------');
  });
