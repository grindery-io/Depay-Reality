import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { getGasConfiguration } from "../lib/gas";
import { verifyContractAddress } from "../lib/verify";
import { protocolVersion, getGrtAddress } from "../hardhat.config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

  console.log("--------------------- GRT Pool ---------------------");
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();
  const stub = await deployments.get("GrtPool_ERC1967Stub");
  const impl = await deployments.get("GrtPool_GrtPoolImpl");

  const result = await deploy("GrtPool_GrtPool", {
    contract: "ERC1967Proxy",
    from: owner,
    args: [stub.address, "0x"],
    // args: [],
    log: true,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(
        ethers.utils.toUtf8Bytes("GrtPool_GrtPool")
      )
    ),
    waitConfirmations: 1,
    ...(await getGasConfiguration(hre.ethers.provider)),
  });
  const factory = await ethers.getContractFactory(
    `contracts/v${protocolVersion}/GrtPool.sol:GrtPool`
  );
  const GrtPool = factory.attach(result.address);
  try {
    await GrtPool.upgradeToAndCall(
      impl.address,
      GrtPool.interface.encodeFunctionData("initializePool", [getGrtAddress(hre.network.name)]),
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
  } catch (e) {
    // The contract may be already deployed before, if it is in correct state, the next script should succeed
  }
  console.log("Owner of the GRT Pool:", await GrtPool.owner());
  console.log("Address of GRT Token:", await GrtPool.getGrtAddress());
  try {
    await hre.upgrades.forceImport(GrtPool.address, factory, {
      kind: "uups",
    });
  } catch (e) {

  }
  console.log("-----------------------------------------------------------------");
  // return true;
};
// func.id = "GrtPool";
func.tags = ["GrtPool_GrtPool"];
// func.dependencies = ["DeterministicDeploymentProxy", "ERC1967Stub", "GrtPoolImpl"];
func.dependencies = ["GrtPool_ERC1967Stub", "GrtPool_GrtPoolImpl"];
export default func;
