import { task } from 'hardhat/config';

task('dummyTx', 'Send dummy tx to increase nonce').setAction(
  async (taskArgs, hre) => {
    const { owner } = await hre.getNamedAccounts();
    const signer = await hre.ethers.getSigner(owner);
    const receipt = await signer
      .sendTransaction({
        to: await signer.getAddress(),
        value: 0,
      })
      .then((x) => x.wait());
    console.log(`Tx hash: ${receipt.transactionHash}`);
    console.log(`Tx count: ${await signer.getTransactionCount()}`);
  }
);
