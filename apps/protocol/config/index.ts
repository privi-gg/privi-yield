type Network = {
  chainId: string;
  aavePoolAddressProvider: string;
  assets: Record<string, string>;
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
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
  [hardhat.chainId]: hardhat,
};
