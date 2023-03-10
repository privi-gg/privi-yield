import { FC, PropsWithChildren } from 'react';
import { getDefaultWallets, lightTheme, RainbowKitProvider, Chain } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, polygonMumbai, polygon } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { keyAlchemyGoerli, keyAlchemyPolygonMumbai, keyAlchemyPolygonMainnet } from 'config/env';
import { APP_NAME } from 'config/constants';
import fonts from 'theme/fonts';
import { defaultChainId } from 'config/network';

const defaultChains: Chain[] = [
  { ...goerli, iconUrl: '/images/eth.png' },
  // { ...polygonMumbai, iconUrl: '/images/matic.png' },
  // { ...polygon, iconUrl: '/images/matic.png' },
];

const { chains, provider } = configureChains(defaultChains, [
  alchemyProvider({ apiKey: keyAlchemyGoerli }),
  // alchemyProvider({ apiKey: keyAlchemyPolygonMumbai }),
  // alchemyProvider({ apiKey: keyAlchemyPolygonMainnet }),
]);

const { connectors } = getDefaultWallets({
  appName: APP_NAME,
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const rainbowKitTheme = {
  ...lightTheme({ fontStack: 'system', borderRadius: 'small' }),
  fonts: { body: fonts.body },
};

const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} initialChain={defaultChainId} theme={rainbowKitTheme}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default WalletProvider;
