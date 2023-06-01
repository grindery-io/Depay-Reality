import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';
import { protocolVersion, getGrtAddress } from '../hardhat.config';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('--------------------- GRT Pool - upgrade ---------------------');
  const { deployments, getNamedAccounts } = hre;
  const impl = await deployments.get('GrtPool_GrtPoolImpl');
  const proxy = await deployments.get('GrtPool_GrtPool');
  const factory = await ethers.getContractFactory(
    `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`
  );
  const GrtPool = factory.attach(proxy.address);
  await hre.upgrades.validateUpgrade(proxy.address, factory, {
    kind: 'uups',
  });
  if (
    !ethers.BigNumber.from(
      await hre.ethers.provider.getStorageAt(
        proxy.address,
        '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
      )
    ).eq(impl.address)
  ) {
    console.log(
      `Upgrading implementation of GrtPool (${GrtPool.address}) to ${impl.address}`
    );
    await GrtPool.upgradeTo(
      impl.address,
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
    await hre.upgrades.forceImport(GrtPool.address, factory, {
      kind: 'uups',
    });
  }
  console.log(
    '-----------------------------------------------------------------'
  );
};
func.tags = ['GrtPool_upgrade-GrtPool'];
func.dependencies = ['GrtPool_GrtPool', 'GrtPool_GrtPoolImpl'];
export default func;
