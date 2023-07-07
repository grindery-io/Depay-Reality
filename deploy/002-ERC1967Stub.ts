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

  await deploy('ERC1967Stub', {
    contract: 'ERC1967Stub',
    from: owner,
    args: [],
    log: true,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.toUtf8Bytes('ERC1967Stub'))
    ),
    waitConfirmations: 1,
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
  return true;
};
func.id = 'ERC1967Stub';
func.tags = ['ERC1967Stub'];
func.dependencies = ['DeterministicDeploymentProxy'];
export default func;
