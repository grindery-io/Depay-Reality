// import './tasks/v2/update-grtPool';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-abi-exporter';
import {
  OWNER_ADDRESS,
  ETHERSCAN_KEY,
  BSCSCAN_KEY,
  OPBNB_BSCSCAN_KEY,
  CRONOS_SCAN_KEY,
  FANTOM_SCAN_KEY,
  MUMBAI_SCAN_KEY,
  GETBLOCK_BSCTESTNET_KEY,
  OWNER_KEY,
  ALCHEMY_API_KEY,
  OWNER_KMS_KEY_PATH,
  ANKR_KEY,
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
import './tasks/v2/deploy-G1Token';
import './tasks/v2/dummyTx';
import './tasks/v2/addMinter-G1Token';
import './tasks/v2/mint-G1Token';
import './tasks/v2/transfer-G1Token';
import './tasks/Mocks/deploy-grtupgradeable';
import { ethers } from 'ethers';

import { registerSigner } from './lib/gcpSigner';
registerSigner(OWNER_ADDRESS, OWNER_KMS_KEY_PATH);
import 'hardhat-deploy';
import { contractAddress, signerAddress } from './lib/deterministicDeployment';

function randomKey(salt: string) {
  return ethers.utils.keccak256(
    ethers.utils.arrayify(
      ethers.utils.toUtf8Bytes('GrinderyTestAccount' + salt)
    )
  );
}
const TEST_ACCOUNTS = Array(10)
  .fill(0)
  .map((_, index) => ({
    balance: ethers.utils.parseEther('10000').toString(),
    privateKey: randomKey(index.toString()),
  }));

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
      accounts: TEST_ACCOUNTS,
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
    opbnb: { chainId: 204, url: 'https://opbnb-rpc.publicnode.com' },
    sokol: { chainId: 77, url: '' },
    bscTestnet: {
      chainId: 97,
      url: `https://bsc.getblock.io/${GETBLOCK_BSCTESTNET_KEY}/testnet/`,
    },
    xdai: { chainId: 100, url: '' },
    gnosis: { chainId: 100, url: 'https://rpc.ankr.com/gnosis' },
    heco: { chainId: 128, url: '' },
    polygon: { chainId: 137, url: `https://rpc.ankr.com/polygon/${ANKR_KEY}` },
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
    polygonAmoy: {
      chainId: 80002,
      url: 'https://rpc.ankr.com/polygon_amoy',
    },
    arbitrumTestnet: { chainId: 421611, url: '' },
    arbitrumGoerli: { chainId: 421613, url: '' },
    sepolia: { chainId: 11155111, url: 'https://rpc.ankr.com/eth_sepolia' },
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
      sepolia: ETHERSCAN_KEY,
      bscTestnet: BSCSCAN_KEY,
      bsc: BSCSCAN_KEY,
      opbnb: OPBNB_BSCSCAN_KEY,
      cronosTestnet: CRONOS_SCAN_KEY,
      ftmTestnet: FANTOM_SCAN_KEY,
      polygonMumbai: MUMBAI_SCAN_KEY,
      polygon: MUMBAI_SCAN_KEY,
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
      {
        network: 'opbnb',
        chainId: 204,
        urls: {
          apiURL: 'https://api-opbnb.bscscan.com/api',
          browserURL: 'https://opbnbscan.com/',
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
  deterministicDeployment: () => {
    return {
      factory: contractAddress,
      deployer: signerAddress,
      funding: '0',
      signedTx: '0x0', // We will deploy from our own script
    };
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
