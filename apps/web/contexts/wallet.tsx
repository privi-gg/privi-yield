import { FC, PropsWithChildren } from 'react';
import { getDefaultWallets, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { goerli, polygonMumbai } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { keyAlchemyGoerli, keyAlchemyMumbai } from 'config/env';
import { APP_NAME } from 'config/constants';
import fonts from 'theme/fonts';
import { defaultChainId } from 'config/network';

const { chains, provider } = configureChains(
  [goerli, polygonMumbai],
  [alchemyProvider({ apiKey: keyAlchemyGoerli }), alchemyProvider({ apiKey: keyAlchemyMumbai })],
);

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
