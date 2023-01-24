import { FC } from 'react';
import { Avatar, Box, Button, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
import { Instance } from 'config/network';
import { useUI, modalViews } from 'contexts/ui';
import { useGetShieldedBalance } from 'api/account';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { formatUnitsRounded } from 'privi-utils';
import { TokenPriceText } from 'components/common';

interface SupplyAssetItemProps extends StackProps {
  instance: Instance;
}

const SupplyAssetItem: FC<SupplyAssetItemProps> = ({ instance, ...props }) => {
  const { setModalViewAndOpen } = useUI();
  const { keyPair } = useShieldedAccount();
  const { data } = useGetShieldedBalance({ keyPair });

  const handleSupply = () => {
    setModalViewAndOpen(modalViews.SUPPLY_ASSET);
  };

  const handleWithdraw = () => {
    setModalViewAndOpen(modalViews.WITHDRAW_ASSET);
  };

  const amount = data?.balance || 0;
  const amountEth = formatUnitsRounded(amount, instance.decimals, 6);

  return (
    <HStack
      justify="space-between"
      alignItems="center"
      bgColor="primary.50"
      spacing={8}
      px={8}
      py={6}
      rounded="md"
      textAlign="center"
      {...props}
    >
      <HStack flex={1} justify="center">
        <Avatar src={instance.iconUrl} size="sm" />
        <Text fontWeight="bold">{instance.currency}</Text>
      </HStack>

      <VStack flex={1}>
        <Text fontWeight="bold">{amountEth}</Text>
        <TokenPriceText amount={amount} token={instance.currency.toLowerCase()} color="gray.400" />
      </VStack>

      <Box color="green.500" flex={1} justifyContent="center">
        30%
      </Box>

      <HStack flex={1} justify="center">
        <Button onClick={handleSupply}>Supply</Button>
        <Button variant="ghost" colorScheme="gray" onClick={handleWithdraw}>
          Withdraw
        </Button>
      </HStack>
    </HStack>
  );
};

export default SupplyAssetItem;
