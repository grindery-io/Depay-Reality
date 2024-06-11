import { task } from 'hardhat/config';
import { registerSigner } from '../../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';

task('addMinterG1Token', 'Deploy G1 Token')
  .addParam('address', 'Contract address')
  .addParam('minter', 'Minter address')
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Adding minter of Grindery One Token on:', hre.network.name, '...');
    console.log('###############################################');

    const G1TokenFactory = await ethers.getContractFactory(
      `contracts/v2/G1Token.sol:G1Token`
    );
    const G1Token = await G1TokenFactory.attach(
      taskArgs.address
    );
    await G1Token.grantRole(await G1Token.MINTER_BURNER_ROLE(), taskArgs.minter);

    console.log('--------------------------------------------');
    console.log('Added minter:', taskArgs.minter);
    console.log('--------------------------------------------');
  });
