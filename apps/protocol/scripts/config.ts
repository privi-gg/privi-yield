import { BigNumber } from 'ethers';
import { parseEther } from 'privi-utils';

type TokenInstance = {
  address: string;
  maxSupplyAmount: BigNumber;
  numTreeLevels: number;
};

type Network = {
  chainId: string;
  aavePoolAddressProvider: string;
  nativeWToken: string;
  sanctionsList: string;
  tokens: Record<string, TokenInstance>;
};

const polygon: Network = {
  chainId: '137',
  nativeWToken: 'wmatic',
  aavePoolAddressProvider: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
  sanctionsList: '0x40C57923924B5c5c5455c48D93317139ADDaC8fb',
  tokens: {
    wmatic: {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      maxSupplyAmount: parseEther('500'),
      numTreeLevels: 20,
    },
    // weth: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    // dai: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    // usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
};

const goerli: Network = {
  chainId: '5',
  nativeWToken: 'weth',
  aavePoolAddressProvider: '0xC911B590248d127aD18546B186cC6B324e99F02c',
  sanctionsList: '0xAAB8Bd495Ae247DF6798A60b7f9c52e15dCb071b',
  tokens: {
    weth: {
      address: '0xCCB14936C2E000ED8393A571D15A2672537838Ad',
      maxSupplyAmount: parseEther('5'),
      numTreeLevels: 20,
    },
  },
};

const polygonMumbai: Network = {
  chainId: '80001',
  nativeWToken: 'wmatic',
  aavePoolAddressProvider: '0xeb7A892BB04A8f836bDEeBbf60897A7Af1Bf5d7F',
  sanctionsList: '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216',
  tokens: {
    wmatic: {
      address: '0xf237dE5664D3c2D2545684E76fef02A3A58A364c',
      maxSupplyAmount: parseEther('500'),
      numTreeLevels: 20,
    },
  },
};

const hardhat: Network = {
  ...goerli,
  chainId: '31337',
};

export const networks: Record<string, Network> = {
  [polygon.chainId]: polygon,
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
  [hardhat.chainId]: hardhat,
};
