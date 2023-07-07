import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';
import { registerSigner } from '../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../secrets';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name !== 'hardhat') {
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);
  }
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();

  await hre.upgrades.validateImplementation(
    await ethers.getContractFactory('GrtPoolV2'),
    {
      kind: 'uups',
    }
  );

  await deploy('GrtPoolImpl', {
    contract: 'GrtPoolV2',
    from: owner,
    log: true,
    waitConfirmations: 1,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.toUtf8Bytes('GrtPoolImpl'))
    ),
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
};
func.tags = ['GrtPoolImpl'];
export default func;
