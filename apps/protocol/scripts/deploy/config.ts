type Network = {
  chainId: string;
  aavePoolAddressProvider: string;
  assets: Record<string, string>;
};

const goerli: Network = {
  chainId: '5',
  aavePoolAddressProvider: '0xc4dCB5126a3AfEd129BC3668Ea19285A9f56D15D',
  assets: {
    weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
  },
};

const polygonMumbai: Network = {
  chainId: '80001',
  aavePoolAddressProvider: '0x5343b5bA672Ae99d627A1C87866b8E53F47Db2E6',
  assets: {
    wmatic: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
  },
};

export const networks: Record<string, Network> = {
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
};
