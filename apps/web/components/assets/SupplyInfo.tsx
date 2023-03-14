import { FC } from 'react';
import { Button, Divider, Heading, StackProps, Text, VStack } from '@chakra-ui/react';
import { modalViews, useUI } from 'contexts/ui';

const SupplyInfo: FC<StackProps> = ({ ...props }) => {
  const { setModalViewAndOpen, setModalData, modalData } = useUI();

  const handleSupply = () => {
    const instance = modalData.instance;
    if (instance.token.isNative) {
      setModalViewAndOpen(modalViews.SUPPLY_ASSET_NATIVE);
    } else {
      setModalViewAndOpen(modalViews.SUPPLY_ASSET);
    }
  };

  return (
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Attention. Read before supplying.
      </Heading>
      <Divider />
      <VStack alignItems="stretch" px={8}>
        <Text>
          AAVE pool&apos;s liquidity may change any time and is dependent on time. Since, these
          factors cannot be determined ahead of sending supply transaction, you may not exactly
          supply the same amount as entered. So, if you want to supply 1 ETH add a very tiny buffer
          (e.g. 0.0001 ETH - supplying 1.0001 ETH) to it to adjust for the mentioned factors.
        </Text>
        <Text pb={4}>You DO NOT lose any money! Any unused supply amount is sent back to you.</Text>
        <Button onClick={handleSupply}>I understand</Button>
      </VStack>
    </VStack>
  );
};

export default SupplyInfo;
