import { task } from 'hardhat/config';
import { registerSigner } from '../../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';

task('deployG1Token', 'Deploy G1 Token')
  .addParam('minter', 'Minter address')
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Deploying Grindery One Token on:', hre.network.name, '...');
    console.log('###############################################');

    // const mriToken = await upgrades.deployProxy(
    //   await ethers.getContractFactory(
    //     'contracts/v2/GrtMRIToken.sol:GrtMRIToken'
    //   ),
    //   [taskArgs.name, taskArgs.symbol, taskArgs.minter]
    // );

    const G1TokenFactory = await ethers.getContractFactory(
      `contracts/v2/G1Token.sol:G1Token`
    );
    const G1Token = await G1TokenFactory.deploy(
      'Grindery One',
      'G1',
      taskArgs.minter
    );
    await G1Token.deployed();

    console.log('--------------------------------------------');
    console.log('Grindery One token deployed to:', G1Token.address);
    console.log('--------------------------------------------');
  });
