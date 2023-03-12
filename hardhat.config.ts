import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import {
  OWNER_ADDRESS,
  ALCHEMY_API_KEY,
  OWNER_KEY,
  ETHERSCAN_KEY,
  BSCSCAN_KEY
} from "./secrets";

let protocolVersion = "0.2.0";

function getGrtAddress(network: string) {
  if (network === "goerli") {
    return "0x1e3C935E9A45aBd04430236DE959d12eD9763162";
  } else if (network == "cronostestnet") {
    return "0xa6Ec5790C26102018b07817fd464E2673a5e2B8D"
  } else if (network == "bscTestnet") {
    return "0x3b369B27c641637e5EE7FF9cF516Cb9F8F60cC85";
  }
  return "0x0000000000000000000000000000000000000000";
}

export {protocolVersion, getGrtAddress};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [OWNER_KEY],
    },
    mumbai: {
      url: `https://rpc.ankr.com/polygon_mumbai`,
      accounts: [OWNER_KEY],
    },
    chapel: {
      url: `https://rpc.ankr.com/bsc_testnet_chapel`,
      accounts: [OWNER_KEY],
    },
    polygon: {
      url: `https://rpc.ankr.com/polygon`,
      accounts: [OWNER_KEY],
    },
    harmony: {
      url: `https://rpc.ankr.com/harmony`,
      accounts: [OWNER_KEY],
    },
    celo: {
      url: `https://rpc.ankr.com/celo`,
      accounts: [OWNER_KEY],
    },
    fantom: {
      url: `https://rpc.ankr.com/fantom`,
      accounts: [OWNER_KEY],
    },
    gnosis: {
      url: `https://rpc.ankr.com/gnosis`,
      accounts: [OWNER_KEY],
    },
    avalanche: {
      url: `https://rpc.ankr.com/avalanche`,
      accounts: [OWNER_KEY],
    },
    bsc: {
      url: `https://rpc.ankr.com/bsc`,
      accounts: [OWNER_KEY],
    },
    bscTestnet: {
      url: `https://rpc.ankr.com/bsc_testnet_chapel`,
      accounts: [OWNER_KEY],
      chainId: 97,
      gasPrice: 20000000000,
    },
    eth: {
      url: `https://rpc.ankr.com/eth`,
      accounts: [OWNER_KEY],
    },
    arbitrum: {
      url: `https://arb1.arbitrum.io/rpc`,
      accounts: [OWNER_KEY],
    },
    cronos: {
      url: `https://evm.cronos.org`,
      accounts: [OWNER_KEY],
    },
    cronostestnet: {
      url: `https://evm-t3.cronos.org/`,
      accounts: [OWNER_KEY],
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: {
      goerli: ETHERSCAN_KEY!,
      bscTestnet: BSCSCAN_KEY!
    }
  },
  namedAccounts: {
    owner: {
      default: OWNER_ADDRESS,
      31337: 0,
    },
  },
  deterministicDeployment: {
    "338": {
      factory: "0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7",
      deployer: "0xE1CB04A0fA36DdD16a06ea828007E35e1a3cBC37",
      funding: "0",
      signedTx: "0xf8a8808609184e72a000830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf38202c8a0749cead18bfc5151c8414fab334577f8c56120de5cda871c2237c855962184b3a042f0b6ed04459c15e37381167292f965a93f63e399f99b3c4f0f504b5b934dbb",
    }
  }

};

export default config;