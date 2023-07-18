import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { owner } = await getNamedAccounts();
  const impl = await deployments.get('GrtPoolImplV2');
  const proxy = await deployments.get('GrtPoolV2');
  const factory = await ethers.getContractFactory('GrtPoolV2');
  const GrtPoolV2 = factory
    .attach(proxy.address)
    .connect(await hre.ethers.getSigner(owner));
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
      `Upgrading implementation of GrtPoolV2 (${GrtPoolV2.address}) to ${impl.address}`
    );
    await GrtPoolV2.upgradeTo(
      impl.address,
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
    await hre.upgrades.forceImport(GrtPoolV2.address, factory, {
      kind: 'uups',
    });
  }
};
func.tags = ['upgrade-GrtPoolV2'];
func.dependencies = ['GrtPoolV2', 'GrtPoolImplV2'];
export default func;
