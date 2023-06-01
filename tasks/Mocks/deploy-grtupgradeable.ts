import { task } from 'hardhat/config';

task('deployGrtUpgradeable', 'Deploy GRT Upgradeable token').setAction(
  async (taskArgs, hre) => {
    const { ethers, upgrades } = hre;

    console.log('###############################################');
    console.log('Deploying GRTUpgradeable on:', hre.network.name, '...');
    console.log('###############################################');

    const grtUpgradeable = await upgrades.deployProxy(
      await ethers.getContractFactory('GRTUpgradeable'),
      []
    );

    await grtUpgradeable.deployed();

    console.log('--------------------------------------------');
    console.log('GRTUpgradeable deployed to:', grtUpgradeable.address);
    console.log(
      'GRTUpgradeable - owner address:',
      await grtUpgradeable.owner()
    );
    console.log('--------------------------------------------');

    if (hre.network.name === 'bscTestnet' || hre.network.name === 'goerli') {
      await hre.run('verify:verify', {
        address: grtUpgradeable.address,
      });
    }
  }
);
