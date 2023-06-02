import { task } from 'hardhat/config';
import { registerSigner } from '../../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';

task('deployGrtPoolV2', 'Deploy GRT Pool for testnet launch')
  .addParam('tokenaddress', 'ERC20 token address')
  .setAction(async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Deploying GRT Pool on:', hre.network.name, '...');
    console.log('###############################################');

    const grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory('contracts/v2/GrtPool.sol:GrtPoolV2'),
      [taskArgs.tokenaddress]
    );

    await grtPool.deployed();

    console.log('--------------------------------------------');
    console.log('GRT pool deployed to:', grtPool.address);
    console.log('GRT pool - owner address:', await grtPool.owner());
    console.log('--------------------------------------------');
  });
