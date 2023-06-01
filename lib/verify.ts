const EXPECTED_ADDRESSES = {
  DETERMINISTIC_DEPLOYMENT_PROXY: '0x327E469C621d8A67e803b294fe363cd7fAcD9638',
  // DETERMINISTIC_DEPLOYMENT_PROXY: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
};

export function verifyContractAddress(
  chainId: number | string,
  type: keyof typeof EXPECTED_ADDRESSES,
  address: string
) {
  // if (chainId.toString() === "31337") {
  //   // Hardhat chain
  //   return;
  // }
  // if (address !== EXPECTED_ADDRESSES[type]) {
  //   throw new Error(`[${type}] Unexpected address: ${address}`);
  // }

  return;
}
