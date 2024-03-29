import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';
import { verifyContractAddress } from '../lib/verify';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();
  const stub = await deployments.get('ERC1967Stub');
  const impl = await deployments.get('GrtPoolImplV2');

  const result = await deploy('GrtPoolV2', {
    contract: 'ERC1967Proxy',
    from: owner,
    args: [stub.address, '0x'],
    log: true,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.toUtf8Bytes('GrtPoolV2'))
    ),
    waitConfirmations: 1,
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
  verifyContractAddress(await hre.getChainId(), 'POOL', result.address);
  const factory = await ethers.getContractFactory('GrtPoolV2');
  const GrtPoolV2 = factory
    .attach(result.address)
    .connect(await hre.ethers.getSigner(owner));
  const currentImplAddress = ethers.BigNumber.from(
    await hre.ethers.provider.getStorageAt(
      result.address,
      '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
    )
  );
  if (currentImplAddress.eq(stub.address)) {
    await GrtPoolV2.upgradeToAndCall(
      impl.address,
      GrtPoolV2.interface.encodeFunctionData('initialize', [
        '0x0000000000000000000000000000000000000000',
      ]),
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
  } else if (
    (await GrtPoolV2.owner()) === '0x0000000000000000000000000000000000000000'
  ) {
    console.log('Calling initialize only');
    await GrtPoolV2.initialize(
      '0x0000000000000000000000000000000000000000',
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
  }
  await hre.upgrades.forceImport(GrtPoolV2.address, factory, {
    kind: 'uups',
  });
  return true;
};
func.id = 'GrtPoolV2';
func.tags = ['GrtPoolV2'];
func.dependencies = [
  'DeterministicDeploymentProxy',
  'ERC1967Stub',
  'GrtPoolImplV2',
];
export default func;
