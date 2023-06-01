import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';
import { protocolVersion, getGrtAddress } from '../hardhat.config';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('---------------------------------------------------');

  const { getNamedAccounts, deployments } = hre;
  const { deploy, deterministic } = deployments;
  const { owner } = await getNamedAccounts();

  const result = await deploy('GrtPool', {
    contract: `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`,
    from: owner,
    args: [],
    log: true,
    proxy: {
      owner: owner,
      proxyArgs: [],
      proxyContract: 'UUPS',
      //"OpenZeppelinTransparentProxy", "ERC1967Proxy", "UUPS", "ERC1967Stub"
      execute: {
        init: {
          methodName: 'initializePool',
          args: [getGrtAddress(hre.network.name)],
        },
      },
    },
  });
  const GrtPool = (
    await ethers.getContractFactory(
      `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`
    )
  ).attach(result.address);
  console.log('GRT Pool contract address:', result.address);
  console.log('Owner GRT Pool contract:', await GrtPool.owner());
  console.log('Owner hardhat', owner);
  console.log('Address of GRT Token:', await GrtPool.getGrtAddress());
  console.log('---------------------------------------------------');
};
func.tags = ['GrtPool'];
export default func;
