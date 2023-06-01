import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    '--------------------- GRT Satellite: ERC1967Stub ---------------------'
  );
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();

  const result = await deploy('GrtSatellite_ERC1967Stub', {
    contract: 'ERC1967Stub',
    from: owner,
    args: [],
    log: true,
    // estimateGasExtra: 10000,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(
        ethers.utils.toUtf8Bytes('GrtSatellite_ERC1967Stub')
      )
    ),
    waitConfirmations: 1,
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
  // await hre.run("verify:verify", {
  //   address: result.address,
  // });
  console.log(
    '-----------------------------------------------------------------'
  );
  // return true;
};
// func.id = "ERC1967Stub";
func.tags = ['GrtSatellite_ERC1967Stub'];
func.dependencies = ['GrtSatellite_GrtSatelliteImpl'];
export default func;
