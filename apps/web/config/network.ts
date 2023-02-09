import { ZERO_LEAF } from '@privi-yield/common';
import { rpcGoerli, rpcPolygonMainnet, rpcPolygonMumbai } from './env';

export type Instance = {
  pool: string;
  deployedBlock: number;
  treeHeight: number;
  zeroElement: string;
  token: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    isNative: boolean;
    iconUrl: string;
  };
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
  POLYGON_MAINNET: 137,
};

export const defaultChainId = chains.POLYGON_MAINNET;

// #####################################
// #    POLYGON MAINNET INSTANCES      #
// #####################################
const polygonMainnetConfig: InstanceConfig = {
  rpcUrl: rpcPolygonMainnet,
  wTokenGateway: '0xA3410F89bD9AF9858100062123717d2b21e31e53',
  instances: {
    wmatic: {
      pool: '0xb91682AB65Fb9e70cD619BFFd8FB045020Fb6de0',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: '21663839004416932945382355908790599225266501822907911457504978515578255421292',
      token: {
        address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
        name: 'wmatic',
        symbol: 'WMATIC',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/matic.png',
      },
    },
    dai: {
      pool: '0x9839797052259D86811bCeFb80337A5FD478CF10',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: '21663839004416932945382355908790599225266501822907911457504978515578255421292',
      token: {
        address: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
        name: 'dai',
        symbol: 'DAI',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/dai.png',
      },
    },
    usdt: {
      pool: '0x9839797052259D86811bCeFb80337A5FD478CF10',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: '21663839004416932945382355908790599225266501822907911457504978515578255421292',
      token: {
        address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
        name: 'usdt',
        symbol: 'USDT',
        decimals: 6,
        isNative: false,
        iconUrl: '/images/usdt.png',
      },
    },
    weth: {
      pool: '0x9839797052259D86811bCeFb80337A5FD478CF10',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: '21663839004416932945382355908790599225266501822907911457504978515578255421292',
      token: {
        address: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
        name: 'weth',
        symbol: 'WETH',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/eth.png',
      },
    },
  },
};

export const instanceConfig: Record<number, InstanceConfig> = {
  [chains.POLYGON_MAINNET]: polygonMainnetConfig,

  // Goerli instances
  // [chains.GOERLI]: {
  //   rpcUrl: rpcGoerli,
  //   wTokenGateway: '0xDbe6d4B26B6112a99831D4a785c6D4bDF314c6D7',
  //   instances: {
  //     weth: {
  //       token: 'weth',
  //       tokenSymbol: 'ETH',
  //       decimals: 18,
  //       pool: '0xA1A0b2c84B978144517F7e168Fea919be8265507',
  //       deployedBlock: 7831327,
  //       treeHeight: 20,
  //       zeroElement: ZERO_LEAF,
  //       iconUrl: '/images/eth.png',
  //     },
  //   },
  // },

  // // Polygon Mumbai instances
  // [chains.POLYGON_MUMBAI]: {
  //   rpcUrl: rpcPolygonMumbai,
  //   wTokenGateway: '0x8e9b9c5f9f5b1b9e5e1c1e5b1b9e5e1c1e5b1b9e',
  //   instances: {
  //     wmatic: {
  //       token: 'wmatic',
  //       tokenSymbol: 'MATIC',
  //       decimals: 18,
  //       pool: '0x9839797052259D86811bCeFb80337A5FD478CF10',
  //       deployedBlock: 28876158,
  //       treeHeight: 20,
  //       zeroElement:
  //         '21663839004416932945382355908790599225266501822907911457504978515578255421292',
  //       iconUrl: '/images/matic.png',
  //     },
  //   },
  // },
};

export const blockExplorers = {
  [chains.GOERLI]: 'https://goerli.etherscan.io',
  [chains.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [chains.POLYGON_MAINNET]: 'https://polygonscan.com',
};

export const registrarAddress = '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216';
