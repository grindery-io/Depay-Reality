import { ethers } from 'hardhat';

const GRT_ADDRESS = '0x1e3C935E9A45aBd04430236DE959d12eD9763162';
const GRT_POOL_ADDRESS = '0x97B434f5f0fc9Ab060918bBb68671bd614fEA6CE';

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();

  const grtPool = (
    await ethers.getContractFactory('contracts/v0.2.0/GrtPool.sol:GrtPool')
  ).attach(GRT_POOL_ADDRESS);
  const grtToken = (await ethers.getContractFactory('ERC20Sample')).attach(
    GRT_ADDRESS
  );

  // await grtToken.connect(owner).approve(grtPool.address, 500);

  const tx = await (await grtPool.connect(owner).stakeGRT(1, 338)).wait();
  console.log('Transaction receipt', tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
