import { task } from 'hardhat/config';

task('deployGrtPoolV1', 'Deploy GRT Pool for testnet launch').setAction(
  async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;

    console.log('###############################################');
    console.log('Deploying GRT Pool on:', hre.network.name, '...');
    console.log('###############################################');

    const grtPool = await upgrades.deployProxy(
      await ethers.getContractFactory(`contracts/v1/GrtPool.sol:GrtPool`),
      []
    );

    await grtPool.deployed();

    console.log('--------------------------------------------');
    console.log('GRT pool deployed to:', grtPool.address);
    console.log('GRT pool - owner address:', await grtPool.owner());
    console.log('--------------------------------------------');

    if (hre.network.name === 'bscTestnet' || hre.network.name === 'goerli') {
      await hre.run('verify:verify', {
        address: grtPool.address,
      });
    }
  }
);
