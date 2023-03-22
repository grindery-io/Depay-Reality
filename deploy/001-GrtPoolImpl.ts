import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { getGasConfiguration } from "../lib/gas";
import { protocolVersion } from "../hardhat.config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    "--------------------- GRT Pool implementation ---------------------"
  );
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();
  await hre.upgrades.validateImplementation(
    await ethers.getContractFactory(
      `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`
    ),
    { kind: "uups" }
  );
  const result = await deploy("GrtPool_GrtPoolImpl", {
    contract: `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`,
    from: owner,
    log: true,
    estimateGasExtra: 10000,
    waitConfirmations: 1,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.toUtf8Bytes("GrtPool_GrtPoolImpl"))
    ),
    ...(await getGasConfiguration(hre.ethers.provider)),
  });

  // await hre.run("verify:verify", {
  //   address: result.address,
  // });

  console.log(
    "-----------------------------------------------------------------"
  );
};
func.tags = ["GrtPool_GrtPoolImpl"];
// func.dependencies = ["DeterministicDeploymentProxy"];
export default func;
