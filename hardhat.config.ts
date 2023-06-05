import './tasks/v2/update-grtPool';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-abi-exporter';
import {
  OWNER_ADDRESS,
  ETHERSCAN_KEY,
  BSCSCAN_KEY,
  CRONOS_SCAN_KEY,
  FANTOM_SCAN_KEY,
  MUMBAI_SCAN_KEY,
  GETBLOCK_BSCTESTNET_KEY,
  OWNER_KEY,
  ALCHEMY_API_KEY,
} from './secrets';
import './tasks/v1/deploy-grtPool';
import './tasks/v1/deploy-grtLiquidityWallet';
import './tasks/v1/update-grtLiquidityWallet';
import './tasks/v1/update-grtPool';
import './tasks/v2/deploy-grtPool';
import './tasks/v2/deploy-grtLiquidityWallet';
import './tasks/v2/update-grtLiquidityWallet';
import './tasks/v2/update-grtPool';
import './tasks/v2/deploy-mriToken';
import './tasks/Mocks/deploy-grtupgradeable';

export const protocolVersion = '1';

/**
 * The function returns a specific address based on the input network parameter.
 * @param {string} network - The `network` parameter is a string that represents the name of a
 * blockchain network. The function `getGrtAddress` takes this parameter as input and returns a
 * specific address depending on the value of the `network` parameter.
 * @returns a string representing an Ethereum address. The address returned depends on the input
 * parameter `network`. If `network` is equal to 'goerli', the function returns
 * '0x1e3C935E9A45aBd04430236DE959d12eD9763162'. If `network` is equal to 'cronosTestnet', the function
 * returns
 */
export function getGrtAddress(network: string) {
  if (network === 'goerli') {
    return '0x1e3C935E9A45aBd04430236DE959d12eD9763162';
  } else if (network == 'cronosTestnet') {
    return '0xa6Ec5790C26102018b07817fd464E2673a5e2B8D';
  } else if (network == 'bscTestnet') {
    return '0x3b369B27c641637e5EE7FF9cF516Cb9F8F60cC85';
  }
  return '0x0000000000000000000000000000000000000000';
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    eth: { chainId: 1, url: 'https://rpc.ankr.com/eth' },
    ropsten: { chainId: 3, url: '' },
    rinkeby: { chainId: 4, url: '' },
    goerli: {
      chainId: 5,
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    },
    optimisticEthereum: { chainId: 10, url: '' },
    kovan: { chainId: 42, url: '' },
    bsc: { chainId: 56, url: 'https://rpc.ankr.com/bsc' },
    sokol: { chainId: 77, url: '' },
    bscTestnet: {
      chainId: 97,
      url: `https://bsc.getblock.io/${GETBLOCK_BSCTESTNET_KEY}/testnet/`,
    },
    xdai: { chainId: 100, url: '' },
    gnosis: { chainId: 100, url: 'https://rpc.ankr.com/gnosis' },
    heco: { chainId: 128, url: '' },
    polygon: { chainId: 137, url: 'https://rpc.ankr.com/polygon' },
    opera: { chainId: 250, url: '' },
    hecoTestnet: { chainId: 256, url: '' },
    optimisticGoerli: { chainId: 420, url: '' },
    moonbeam: { chainId: 1284, url: '' },
    moonriver: { chainId: 1285, url: '' },
    moonbaseAlpha: { chainId: 1287, url: '' },
    fantom: { chainId: 250, url: 'https://rpc.ankr.com/fantom' },
    ftmTestnet: { chainId: 4002, url: 'https://rpc.ankr.com/fantom_testnet' },
    chiado: { chainId: 10200, url: '' },
    arbitrumOne: { chainId: 42161, url: '' },
    avalancheFujiTestnet: { chainId: 43113, url: '' },
    avalanche: { chainId: 43114, url: 'https://rpc.ankr.com/avalanche' },
    polygonMumbai: {
      chainId: 80001,
      url: 'https://rpc.ankr.com/polygon_mumbai',
    },
    arbitrumTestnet: { chainId: 421611, url: '' },
    arbitrumGoerli: { chainId: 421613, url: '' },
    sepolia: { chainId: 11155111, url: '' },
    aurora: { chainId: 1313161554, url: '' },
    auroraTestnet: { chainId: 1313161555, url: '' },
    harmony: { chainId: 1666600000, url: 'https://rpc.ankr.com/harmony' },
    harmonyTest: { chainId: 1666700000, url: '' },
    cronosTestnet: { chainId: 338, url: 'https://evm-t3.cronos.org/' },
    cronos: { chainId: 25, url: 'https://evm.cronos.org' },
    celo: { chainId: 42220, url: 'https://rpc.ankr.com/celo' },
    arbitrum: { chainId: 42161, url: 'https://arb1.arbitrum.io/rpc' },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      goerli: ETHERSCAN_KEY,
      bscTestnet: BSCSCAN_KEY,
      cronosTestnet: CRONOS_SCAN_KEY,
      ftmTestnet: FANTOM_SCAN_KEY,
      polygonMumbai: MUMBAI_SCAN_KEY,
    },
    customChains: [
      {
        network: 'cronosTestnet',
        chainId: 338,
        urls: {
          apiURL: 'https://api-testnet.cronoscan.com/api',
          browserURL: 'https://testnet.cronoscan.com/',
        },
      },
    ],
  },
  namedAccounts: {
    owner: {
      default: OWNER_ADDRESS,
      31337: 0,
    },
  },
  deterministicDeployment: {
    '338': {
      factory: '0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7',
      deployer: OWNER_ADDRESS,
      funding: '0',
      signedTx: '0x',
    },
  },

  // https://github.com/ItsNickBarry/hardhat-abi-exporter
  abiExporter: {
    path: './abis',
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [
      'contracts/v1/GrtPool.sol:GrtPool',
      'contracts/v1/GrtSatellite.sol:GrtSatellite',
      'contracts/v1/GrtLiquidityWallet.sol:GrtLiquidityWallet',
      'contracts/v2/GrtPool.sol:GrtPoolV2',
      'contracts/v2/GrtLiquidityWallet.sol:GrtLiquidityWalletV2',
      'contracts/v2-tmp/GrtPool.sol:GrtPoolV2Tmp',
      'contracts/v2-tmp/GrtLiquidityWallet.sol:GrtLiquidityWalletV2Tmp',
      'ERC20Sample',
      'GRTUpgradeable',
    ],
    spacing: 2,
    format: 'json',
  },
};

export default config;
