import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';
import { protocolVersion } from '../hardhat.config';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    '--------------------- GRT Satellite - upgrade ---------------------'
  );
  const { deployments } = hre;
  const impl = await deployments.get('GrtSatellite_GrtSatelliteImpl');
  const proxy = await deployments.get('GrtSatellite_GrtSatellite');
  const factory = await ethers.getContractFactory(
    `contracts/v${protocolVersion}/GrtSatellite.sol:GrtSatellite`
  );
  const GrtSatellite = factory.attach(proxy.address);
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
      `Upgrading implementation of GrtSatellite (${GrtSatellite.address}) to ${impl.address}`
    );
    await GrtSatellite.upgradeTo(
      impl.address,
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
    await hre.upgrades.forceImport(GrtSatellite.address, factory, {
      kind: 'uups',
    });
  }
  console.log(
    '-----------------------------------------------------------------'
  );
};
func.tags = ['GrtSatellite_upgrade-GrtSatellite'];
func.dependencies = [
  'GrtSatellite_GrtSatellite',
  'GrtSatellite_GrtSatelliteImpl',
];
export default func;
