import { ZERO_LEAF } from '@privi-yield/common';
import { constants } from 'ethers';
import { rpcGoerli, rpcPolygonMainnet, rpcPolygonMumbai } from './env';

export type Instance = {
  pool: string;
  deployedBlock: number;
  treeHeight: number;
  zeroElement: string;
  token: {
    wToken?: string;
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
  registrar: string;
  aavePool: string;
  instances: {
    [token: string]: Instance;
  };
};

export const chains = {
  GOERLI: 5,
  POLYGON_MUMBAI: 80001,
  POLYGON_MAINNET: 137,
};

export const defaultChainId = chains.GOERLI;

// #####################################
// #    POLYGON MAINNET INSTANCES      #
// #####################################
// const polygonMainnetConfig: InstanceConfig = {
//   rpcUrl: rpcPolygonMainnet,
//   wTokenGateway: '0xA3410F89bD9AF9858100062123717d2b21e31e53',
//   registrar: '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216',
//   instances: {
//     wmatic: {
//       pool: '0xb91682AB65Fb9e70cD619BFFd8FB045020Fb6de0',
//       deployedBlock: 28876158,
//       treeHeight: 20,
//       zeroElement: ZERO_LEAF,
//       token: {
//         address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
//         name: 'wmatic',
//         symbol: 'WMATIC',
//         decimals: 18,
//         isNative: false,
//         iconUrl: '/images/matic.png',
//       },
//     },
//     matic: {
//       pool: '0xb91682AB65Fb9e70cD619BFFd8FB045020Fb6de0',
//       deployedBlock: 28876158,
//       treeHeight: 20,
//       zeroElement: ZERO_LEAF,
//       token: {
//         address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
//         name: 'matic',
//         symbol: 'MATIC',
//         decimals: 18,
//         isNative: true,
//         iconUrl: '/images/matic.png',
//       },
//     },
//     dai: {
//       pool: '0x3107767054f1BB6811Ff36ce48CD778a14a51341',
//       deployedBlock: 28876158,
//       treeHeight: 20,
//       zeroElement: '21663839004416932945382355908790599225266501822907911457504978515578255421292',
//       token: {
//         address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
//         name: 'dai',
//         symbol: 'DAI',
//         decimals: 18,
//         isNative: false,
//         iconUrl: '/images/dai.png',
//       },
//     },
//   },
// };

// #####################################
// #         GOERLI INSTANCES          #
// #####################################
const goerliConfig: InstanceConfig = {
  rpcUrl: rpcGoerli,
  wTokenGateway: '0xddf373138f40e1dCF970DbCb0df5dB225d6f93b1',
  registrar: '0x930677540ab430420055528D7d952B502A3d109b',
  aavePool: '0x7b5C526B7F8dfdff278b4a3e045083FBA4028790',
  instances: {
    eth: {
      pool: '0x3b070f69DeA86cb235845cd3CD6D93dB4eeF322e',
      deployedBlock: 7831327,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: constants.AddressZero,
        name: 'eth',
        symbol: 'ETH',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/eth.png',
        wToken: '0xCCB14936C2E000ED8393A571D15A2672537838Ad',
      },
    },
    weth: {
      pool: '0x3b070f69DeA86cb235845cd3CD6D93dB4eeF322e',
      deployedBlock: 7831327,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0xCCB14936C2E000ED8393A571D15A2672537838Ad',
        name: 'weth',
        symbol: 'WETH',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/eth.png',
      },
    },
  },
};

// #####################################
// #     POLYGON MUMBAI INSTANCES      #
// #####################################
const mumbaiConfig: InstanceConfig = {
  rpcUrl: rpcGoerli,
  wTokenGateway: '0x3b796c331a5FD1fD84ebe387425fDC06995D9FFb',
  registrar: '0x3212B94c51b32289083CeA861718faE3AaE8a02c',
  aavePool: '0x0b913A76beFF3887d35073b8e5530755D60F78C7',
  instances: {
    matic: {
      pool: '0x04E95858b85D4Ff13A262D78616F0D2165D7D994',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: constants.AddressZero,
        name: 'matic',
        symbol: 'MATIC',
        decimals: 18,
        isNative: true,
        iconUrl: '/images/matic.png',
        wToken: '0xf237dE5664D3c2D2545684E76fef02A3A58A364c',
      },
    },
    wmatic: {
      pool: '0x04E95858b85D4Ff13A262D78616F0D2165D7D994',
      deployedBlock: 28876158,
      treeHeight: 20,
      zeroElement: ZERO_LEAF,
      token: {
        address: '0xf237dE5664D3c2D2545684E76fef02A3A58A364c',
        name: 'wmatic',
        symbol: 'WMATIC',
        decimals: 18,
        isNative: false,
        iconUrl: '/images/matic.png',
      },
    },
  },
};

export const instanceConfig: Record<number, InstanceConfig> = {
  [chains.GOERLI]: goerliConfig,
  [chains.POLYGON_MUMBAI]: mumbaiConfig,
  // [chains.POLYGON_MAINNET]: polygonMainnetConfig,
};

export const blockExplorers = {
  [chains.GOERLI]: 'https://goerli.etherscan.io',
  [chains.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [chains.POLYGON_MAINNET]: 'https://polygonscan.com',
};
