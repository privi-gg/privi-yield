import { useQuery } from '@tanstack/react-query';
import { useInstance } from 'contexts/instance';
import { useProvider } from 'wagmi';

export const useGetBlock = (blockTag: string | number) => {
  const provider = useProvider();
  //@todo fix this
  // const { chainId } = useInstance();
  return useQuery(['block', blockTag], () => provider.getBlock(blockTag), {
    enabled: !!blockTag,
  });
};
