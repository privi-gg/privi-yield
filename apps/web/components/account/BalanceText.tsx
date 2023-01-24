import { FC } from 'react';
import { TextProps, Text } from '@chakra-ui/react';
import { useAccount, useBalance } from 'wagmi';
import useInstance from 'hooks/instance';
import { useGetTokenBalance } from 'api/asset';
import { constants } from 'ethers';

interface IBalanceTextProps extends TextProps {
  label?: string;
}

const BalanceText: FC<IBalanceTextProps> = ({ label, ...props }) => {
  const { address } = useAccount();
  const { data } = useGetTokenBalance({ address, tokenAddress: constants.AddressZero });
  const { instance } = useInstance();

  const balance = Number(data?.formatted || 0).toFixed(4);
  return (
    <Text color="gray.500" {...props}>
      {label}
      {balance} {instance.currency}
    </Text>
  );
};

export default BalanceText;
