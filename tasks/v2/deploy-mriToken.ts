import { task } from 'hardhat/config';
import { registerSigner } from '../../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';

task('deployMRIToken', 'Deploy MRI Token')
  .addParam('name', 'Name of the token')
  .addParam('symbol', 'Symbol of the token')
  .addParam('minter', 'Minter address')
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Deploying MRI Token on:', hre.network.name, '...');
    console.log('###############################################');

    const mriToken = await upgrades.deployProxy(
      await ethers.getContractFactory(
        'contracts/v2/GrtMRIToken.sol:GrtMRIToken'
      ),
      [taskArgs.name, taskArgs.symbol, taskArgs.minter]
    );

    await mriToken.deployed();

    console.log('--------------------------------------------');
    console.log('MRI token deployed to:', mriToken.address);
    console.log('--------------------------------------------');
  });
