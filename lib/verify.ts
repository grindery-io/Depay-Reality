const EXPECTED_ADDRESSES = {
  DETERMINISTIC_DEPLOYMENT_PROXY: '0x327E469C621d8A67e803b294fe363cd7fAcD9638',
  // POOL: '0x8412dAbD1D6419e6692B0268551aD4B9d8BbfA74',
  // POOL: '0xE952773158776e80340541Fc6369465202377C4d',
  POOL: '0x185B0260EAf099Bb7a8c7dE6Ed18B34cE0A4268f',
};

export function verifyContractAddress(
  chainId: number | string,
  type: keyof typeof EXPECTED_ADDRESSES,
  address: string
) {
  if (chainId.toString() === '31337') {
    // Hardhat chain
    return;
  }
  if (process.env.DEV) {
    return;
  }
  // if (address !== EXPECTED_ADDRESSES[type]) {
  //   throw new Error(`[${type}] Unexpected address: ${address}`);
  // }
  return;
}
