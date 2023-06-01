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
} from './secrets';
import './tasks/v1/deploy-grtPool';
import './tasks/v1/deploy-grtLiquidityWallet';
import './tasks/v1/update-grtLiquidityWallet';
import './tasks/v1/update-grtPool';
import './tasks/v2/deploy-grtPool';
import './tasks/v2/deploy-grtLiquidityWallet';
import './tasks/v2/update-grtLiquidityWallet';
import './tasks/v2/update-grtPool';
import './tasks/Mocks/deploy-grtupgradeable';
import type { NetworkUserConfig } from 'hardhat/types';
import { chains } from './lib/chains';

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

/**
 * The function returns a network configuration object based on the input chain parameter.
 * @param chain - The `chain` parameter is a string representing the name of a blockchain network. It
 * is used to look up the corresponding configuration for that network in the `chains` object.
 * @returns The function `getChainConfig` is returning a `NetworkUserConfig` object that contains the
 * `chainId` and `url` properties of the specified `chain` parameter. The `chain` parameter is a string
 * that represents a key of the `chains` object, which is of type `typeof chains`. The `typeof`
 * operator returns the type of the `chains` object, which is
 */
function getChainConfig(chain: keyof typeof chains): NetworkUserConfig {
  return {
    chainId: chains[chain].chainId,
    url: chains[chain].rpc,
  };
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
    goerli: getChainConfig('goerli'),
    polygonMumbai: getChainConfig('polygonMumbai'),
    polygon: getChainConfig('polygon'),
    harmony: getChainConfig('harmony'),
    celo: getChainConfig('celo'),
    fantom: getChainConfig('fantom'),
    ftmTestnet: getChainConfig('ftmTestnet'),
    gnosis: getChainConfig('gnosis'),
    avalanche: getChainConfig('avalanche'),
    bsc: getChainConfig('bsc'),
    bscTestnet: getChainConfig('bscTestnet'),
    eth: getChainConfig('eth'),
    arbitrum: getChainConfig('arbitrum'),
    cronos: getChainConfig('cronos'),
    cronosTestnet: getChainConfig('cronosTestnet'),
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      goerli: ETHERSCAN_KEY || '',
      bscTestnet: BSCSCAN_KEY || '',
      cronosTestnet: CRONOS_SCAN_KEY || '',
      ftmTestnet: FANTOM_SCAN_KEY || '',
      polygonMumbai: MUMBAI_SCAN_KEY || '',
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
