const EXPECTED_ADDRESSES = {
  DETERMINISTIC_DEPLOYMENT_PROXY: '0x327E469C621d8A67e803b294fe363cd7fAcD9638',
  POOL: '0x8412dAbD1D6419e6692B0268551aD4B9d8BbfA74',
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
  if (address !== EXPECTED_ADDRESSES[type]) {
    throw new Error(`[${type}] Unexpected address: ${address}`);
  }
}
