import { task } from 'hardhat/config';
import { registerSigner } from '../../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../../secrets';

task('transferG1Token', 'Transfer G1 Token')
  .addParam('address', 'Contract address')
  .addParam('target', 'Target address')
  .addParam('amount', 'Amount to mint (in ETH)')
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);

    console.log('###############################################');
    console.log('Transferring Grindery One Token on:', hre.network.name, '...');
    console.log('###############################################');

    const G1TokenFactory = await ethers.getContractFactory(
      `contracts/v2/G1Token.sol:G1Token`
    );
    const G1Token = await G1TokenFactory.attach(taskArgs.address);
    await G1Token.transfer(
      taskArgs.target,
      ethers.utils.parseEther(taskArgs.amount)
    );

    console.log('--------------------------------------------');
    console.log('Transferred', taskArgs.amount, 'to', taskArgs.target);
    console.log('--------------------------------------------');
  });
