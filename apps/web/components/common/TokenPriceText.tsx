import { FC } from 'react';
import { TextProps, Text } from '@chakra-ui/react';
import { useGetTokenPrice } from 'api/asset/getTokenPrice';
import useInstance from 'hooks/instance';
import { BigNumberish } from 'ethers';
import { formatUnits } from 'privi-utils';

interface ITokenPriceTextProps extends TextProps {
  amount: BigNumberish;
  token: string;
}

const TokenPriceText: FC<ITokenPriceTextProps> = ({ amount, token, ...props }) => {
  const { data: price } = useGetTokenPrice({ token });

  const amountEth = formatUnits(amount, 18);
  const usdPrice = price ? Number(amountEth) * price : 0;

  return <Text {...props}>$ {usdPrice.toFixed(5)}</Text>;
};

export default TokenPriceText;
