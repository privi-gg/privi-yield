import Script from 'next/script';
import { Center } from '@chakra-ui/react';
import { SupplyAssetsList } from 'components/assets';
import { Layout } from 'components/common/layout';
import logger from 'utils/logger';
import { useAccount, useNetwork } from 'wagmi';

export default function Home() {
  const { chain } = useNetwork();
  const { isConnected } = useAccount();

  const isUnsupportedChain = isConnected && chain?.unsupported === true;

  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      {!isUnsupportedChain && (
        <Center py={8}>
          <SupplyAssetsList maxW={1200} w="full" />
        </Center>
      )}
    </Layout>
  );
}
