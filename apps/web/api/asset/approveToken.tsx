import { BigNumber } from 'ethers';
import { BN } from 'privi-utils';
import { useEffect } from 'react';
import logger from 'utils/logger';
import { erc20ABI, useContractWrite, useWaitForTransaction } from 'wagmi';

interface ApproveTokensInput {
  // owner: `0x${string}`;
  spender: `0x${string}`;
  value: BigNumber;
}

export const useApproveToken = (token: `0x${string}`) => {
  const { data, error, writeAsync, isLoading, ...rest } = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: token,
    abi: erc20ABI,
    functionName: 'approve',
    overrides: {
      gasLimit: BN(80_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: data?.hash });

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (data) logger.info('Tx:', data);
    if (error) logger.error(`Tx error:`, error);
  }, [data, error]);

  const approveAsync = async ({ value, spender }: ApproveTokensInput) => {
    await writeAsync?.({
      recklesslySetUnpreparedArgs: [spender, value],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(80_000) },
    });
  };

  return { data, approveAsync, error, isLoading };

  // return { data, error, writeAsync, approveAsync: writeAsync, ...rest };
};
