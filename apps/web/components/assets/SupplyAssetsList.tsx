import { FC } from 'react';
import { HStack, Box, VStack, StackProps } from '@chakra-ui/react';
import SupplyAssetItem from './SupplyAssetItem';
import useInstance from 'hooks/instance';

const SupplyAssetsList: FC<StackProps> = ({ ...props }) => {
  const { instances } = useInstance();
  return (
    <VStack alignItems="stretch" spacing={4} {...props}>
      <HStack justify="space-between" px={8} fontWeight="bold" textAlign="center">
        <Box flex={1}>Asset</Box>
        <Box flex={1}>Balance</Box>
        <Box flex={1}>APY</Box>
        <Box flex={1}>Action</Box>
      </HStack>
      <VStack alignItems="stretch">
        {Object.keys(instances)
          // .slice(0, 1)
          .map((token) => (
            <SupplyAssetItem key={token} instance={instances[token]} />
          ))}
      </VStack>
    </VStack>
  );
};

export default SupplyAssetsList;
