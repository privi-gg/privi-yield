import { FC } from 'react';
import { Avatar, Box, Button, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
import { Instance } from 'config/network';
import { useUI, modalViews } from 'contexts/ui';
import { useGetShieldedBalance } from 'api/account';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { formatUnitsRounded } from 'privi-utils';
import { TokenPriceText } from 'components/common';
import { useGetAssetAPY } from 'api/asset';

interface SupplyAssetItemProps extends StackProps {
  instance: Instance;
}

const SupplyAssetItem: FC<SupplyAssetItemProps> = ({ instance, ...props }) => {
  const { setModalViewAndOpen, setModalData } = useUI();
  const { keyPair } = useShieldedAccount();
  const { data } = useGetShieldedBalance({ keyPair, poolAddress: instance.pool });

  const { data: apyData } = useGetAssetAPY({
    pool: instance.pool as any,
    asset: instance.token.address as any,
  });

  const handleSupply = () => {
    setModalData({ instance });
    if (instance.token.isNative) {
      setModalViewAndOpen(modalViews.SUPPLY_ASSET_NATIVE);
    } else {
      setModalViewAndOpen(modalViews.SUPPLY_ASSET);
    }
  };

  const handleWithdraw = () => {
    setModalData({ instance });
    setModalViewAndOpen(modalViews.WITHDRAW_ASSET);
  };

  const amount = data?.balance || 0;
  const amountEth = formatUnitsRounded(amount, instance.token.decimals, 6);
  const apy = Number(apyData || 0).toFixed(2);

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
        <Avatar src={instance.token.iconUrl} size="sm" />
        <Text fontWeight="bold">{instance.token.symbol}</Text>
      </HStack>

      <VStack flex={1}>
        <Text fontWeight="bold">{amountEth}</Text>
        <TokenPriceText amount={amount} token={instance.token.name} color="gray.400" />
      </VStack>

      <Box color="green.500" flex={1} justifyContent="center">
        {apy}%
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
