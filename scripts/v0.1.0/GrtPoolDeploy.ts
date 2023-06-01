import { ethers, upgrades } from 'hardhat';

const GRT_ADDRESS = '0x1e3C935E9A45aBd04430236DE959d12eD9763162';
const GRT_CHAIN_ID = 5;
const REALITY_ADDRESS = '0x6F80C5cBCF9FbC2dA2F0675E56A5900BB70Df72f';

async function main() {
  const grtPool = await upgrades.deployProxy(
    await ethers.getContractFactory('contracts/v0.1.0/GrtPool.sol:GrtPool')
  );

  await grtPool.deployed();
  await grtPool.initializePool(GRT_ADDRESS, GRT_CHAIN_ID, REALITY_ADDRESS);

  console.log('GRT pool deployed to:', grtPool.address);
  console.log('GRT pool - owner address:', await grtPool.owner());
  console.log('GRT pool - GRT address:', await grtPool.grtAddress());
  console.log('GRT pool - GRT chain id:', await grtPool.grtChainId());
  console.log('GRT pool - Reality address:', await grtPool.realityAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
