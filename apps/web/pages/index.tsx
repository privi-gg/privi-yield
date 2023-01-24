import Script from 'next/script';
import { Center } from '@chakra-ui/react';
import { SupplyAssetsList } from 'components/assets';
import { Layout } from 'components/common/layout';
import logger from 'utils/logger';

export default function Home() {
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      <Center py={8}>
        <SupplyAssetsList maxW={1200} w="full" />
      </Center>
    </Layout>
  );
}
