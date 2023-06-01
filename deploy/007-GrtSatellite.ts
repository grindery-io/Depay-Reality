import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'hardhat';
import { getGasConfiguration } from '../lib/gas';
import { verifyContractAddress } from '../lib/verify';
import { protocolVersion, getGrtAddress } from '../hardhat.config';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('--------------------- GRT Satellite ---------------------');
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { owner } = await getNamedAccounts();
  const stub = await deployments.get('GrtSatellite_ERC1967Stub');
  const impl = await deployments.get('GrtSatellite_GrtSatelliteImpl');

  const result = await deploy('GrtSatellite_GrtSatellite', {
    contract: 'ERC1967Proxy',
    from: owner,
    args: [stub.address, '0x'],
    // args: [],
    log: true,
    deterministicDeployment: ethers.utils.keccak256(
      ethers.utils.arrayify(
        ethers.utils.toUtf8Bytes('GrtSatellite_GrtSatellite')
      )
    ),
    waitConfirmations: 1,
    ...(await getGasConfiguration(hre.ethers.provider)),
  });

  const factory = await ethers.getContractFactory(
    `contracts/v${protocolVersion}/GrtSatellite.sol:GrtSatellite`
  );
  const GrtSatellite = factory.attach(result.address);
  try {
    await GrtSatellite.upgradeToAndCall(
      impl.address,
      GrtSatellite.interface.encodeFunctionData('initializeGrtSatellite', [
        getGrtAddress(hre.network.name),
      ]),
      await getGasConfiguration(hre.ethers.provider)
    ).then((x) => x.wait());
  } catch (e) {
    // The contract may be already deployed before, if it is in correct state, the next script should succeed
  }
  console.log('Owner of the GRT Satellite:', await GrtSatellite.owner());
  console.log('Address of GRT Token:', await GrtSatellite.getGrtAddress());
  console.log('GrtSatellite.address', GrtSatellite.address);
  try {
    await hre.upgrades.forceImport(GrtSatellite.address, factory, {
      kind: 'uups',
    });
  } catch (e) {}
  console.log(
    '-----------------------------------------------------------------'
  );
  // return true;
};
// func.id = "GrtSatellite";
func.tags = ['GrtSatellite_GrtSatellite'];
// func.dependencies = ["DeterministicDeploymentProxy", "ERC1967Stub2", "GrtSatelliteImpl"];
func.dependencies = [
  'GrtSatellite_ERC1967Stub',
  'GrtSatellite_GrtSatelliteImpl',
];
export default func;
