import { Center } from '@chakra-ui/react';
import { Layout } from 'components/common/layout';
import { WithdrawForm } from 'components/pool';
import Script from 'next/script';
import logger from 'utils/logger';

export default function Deposit() {
  return (
    <Layout>
      <Script src="js/snarkjs.min.js" onLoad={() => logger.info('SnarkJs Loaded!')} />
      <Center my={16}>
        <WithdrawForm maxW={200} />
      </Center>
    </Layout>
  );
}
