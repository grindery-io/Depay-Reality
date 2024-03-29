import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();

  await hre.upgrades.validateImplementation(
    await ethers.getContractFactory('GrtPoolV2'),
    {
      kind: 'uups',
    }
  );

  await deploy('GrtPoolImplV2', {
    contract: 'GrtPoolV2',
    from: owner,
    log: true,
    waitConfirmations: 1,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.toUtf8Bytes('GrtPoolImplV2'))
    ),
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
};
func.tags = ['GrtPoolImplV2'];
export default func;
