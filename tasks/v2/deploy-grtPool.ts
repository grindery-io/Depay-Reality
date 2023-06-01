import { task } from 'hardhat/config';

task('deployGrtPoolV2', 'Deploy GRT Pool for testnet launch')
  .addParam('tokenaddress', 'ERC20 token address')
  .setAction(async (taskArgs, hre) => {
    const { getNamedAccounts, ethers, upgrades } = hre;

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

    if (hre.network.name === 'bscTestnet' || hre.network.name === 'goerli') {
      await hre.run('verify:verify', {
        address: grtPool.address,
      });
    }
  });
