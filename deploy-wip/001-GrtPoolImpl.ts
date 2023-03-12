import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { getGasConfiguration } from "../lib/gas";
import { protocolVersion } from "../hardhat.config";
import { ensureDeploymentProxy, contractAddress } from "../lib/deterministicDeployment";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log("contractAddress", contractAddress);

  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();
  await hre.upgrades.validateImplementation(
    await ethers.getContractFactory(
      `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`),
      {
        kind: "uups",
      }
  );
  await deploy("GrtPoolImpl", {
    contract: `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`,
    from: owner,
    log: true,
    // gasLimit: 210000,
    // gasPrice: "8000000000",
    // estimateGasExtra: 10000,
    waitConfirmations: 1,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.toUtf8Bytes("GrtPoolImpl"))
    ),
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
};
func.tags = ["GrtPoolImpl"];
func.dependencies = ["DeterministicDeploymentProxy"];
export default func;
