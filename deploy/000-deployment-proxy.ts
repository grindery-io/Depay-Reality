import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  ensureDeploymentProxy,
  contractAddress,
} from '../lib/deterministicDeployment';
import { registerSigner } from '../lib/gcpSigner';
import { OWNER_ADDRESS, OWNER_KMS_KEY_PATH } from '../secrets';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (hre.network.name !== 'hardhat') {
    registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);
  }
  const { getNamedAccounts, deployments } = hre;
  const { owner } = await getNamedAccounts();

  console.log(owner, OWNER_ADDRESS);

  await ensureDeploymentProxy(await hre.ethers.getSigner(owner));
  await deployments.save('DeterministicDeploymentProxy', {
    abi: [],
    address: contractAddress,
  });
  return true;
};
func.id = 'DeterministicDeploymentProxy';
func.tags = ['DeterministicDeploymentProxy'];
export default func;
