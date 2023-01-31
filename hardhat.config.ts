import { HardhatUserConfig } from 'hardhat/config';

interface SolcConfig {
  optimizer: {
    enabled: boolean;
    runs: number;
    viaIR: boolean;
  };
}

interface CustomHardhatConfig extends HardhatUserConfig {
  solc: {
    version: string;
    settings: SolcConfig;
  };
}

const config: CustomHardhatConfig = {
  solc: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        viaIR: true,
      },
    },
  },
};

export default config;