type Network = {
  chainId: string;
  aavePoolAddressProvider: string;
  assets: Record<string, string>;
};

const polygon: Network = {
  chainId: '137',
  aavePoolAddressProvider: '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb',
  assets: {
    wmatic: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
  },
};

const goerli: Network = {
  chainId: '5',
  aavePoolAddressProvider: '0xC911B590248d127aD18546B186cC6B324e99F02c',
  assets: {
    weth: '0xCCB14936C2E000ED8393A571D15A2672537838Ad',
  },
};

const polygonMumbai: Network = {
  chainId: '80001',
  aavePoolAddressProvider: '0xeb7A892BB04A8f836bDEeBbf60897A7Af1Bf5d7F',
  assets: {
    wmatic: '0xf237dE5664D3c2D2545684E76fef02A3A58A364c',
  },
};

const hardhat: Network = {
  chainId: '31337',
  aavePoolAddressProvider: goerli.aavePoolAddressProvider,
  assets: goerli.assets,
};

export const networks: Record<string, Network> = {
  [polygon.chainId]: polygon,
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
  [hardhat.chainId]: hardhat,
};
