import { rpcGoerli, rpcPolygonMumbai } from './env';

export type Instance = {
  decimals: number;
  instanceAddress: string;
  deployedBlock: number;
  treeHeight: number;
  zeroElement: string;
  currency: string;
  iconUrl: string;
};

export type InstanceConfig = {
  rpcUrl: string;
  wTokenGateway: string;
  instances: {
    [token: string]: Instance;
  };
};

export const chains = {
  GOERLI: 5,
  POLYGON_MUMBAI: 80001,
};

export const defaultChainId = chains.POLYGON_MUMBAI;

export const instanceConfig: Record<number, InstanceConfig> = {
  // Goerli instances
  [chains.GOERLI]: {
    rpcUrl: rpcGoerli,
    wTokenGateway: '0x8e9b9c5f9f5b1b9e5e1c1e5b1b9e5e1c1e5b1b9e',
    instances: {
      weth: {
        currency: 'ETH',
        decimals: 18,
        instanceAddress: '0xA4908FcD064A4B9Bda5a3AFC096515F2E739D501',
        deployedBlock: 7831327,
        treeHeight: 20,
        zeroElement:
          '21663839004416932945382355908790599225266501822907911457504978515578255421292',
        iconUrl: '/images/eth.png',
      },
    },
  },

  // Polygon Mumbai instances
  [chains.POLYGON_MUMBAI]: {
    rpcUrl: rpcPolygonMumbai,
    wTokenGateway: '0x8e9b9c5f9f5b1b9e5e1c1e5b1b9e5e1c1e5b1b9e',
    instances: {
      wmatic: {
        currency: 'MATIC',
        decimals: 18,
        instanceAddress: '0x9839797052259D86811bCeFb80337A5FD478CF10',
        deployedBlock: 28876158,
        treeHeight: 20,
        zeroElement:
          '21663839004416932945382355908790599225266501822907911457504978515578255421292',
        iconUrl: '/images/matic.png',
      },
    },
  },
};

export const blockExplorers = {
  [chains.GOERLI]: 'https://goerli.etherscan.io',
  [chains.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
};

// export const registrarAddress = '0x20703B9e08b840A2Cb6AB3f7E8B8926C9ed3aF24';
export const registrarAddress = '0xFA9dCCDBeD0b934Ab0A2c0385E40A69F8d528BE7';
// export const tsunamiAddress = '0xc4c55B2c2Bb6fD0229A7aA508e33bc4Ca54D0aa0'; // wETH withdraws
// export const tsunamiAddress = '0x56aDcC1BaF658C19FA4B149270e351db01957ca4'; // ETH withdraws
