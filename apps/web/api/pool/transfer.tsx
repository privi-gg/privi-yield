import { useEffect } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { BN } from 'privi-utils';
import pool from 'abi/pool.json';
import useInstance from 'hooks/instance';
import logger from 'utils/logger';

export const usePoolTransfer = () => {
  const { instance } = useInstance();
  const txRes = useContractWrite({
    mode: 'recklesslyUnprepared',
    address: instance.pool,
    abi: pool.abi,
    functionName: 'transfer',
    overrides: {
      gasLimit: BN(2_000_000),
    },
  });

  const { data: receipt } = useWaitForTransaction({ hash: txRes.data?.hash });

  useEffect(() => {
    if (receipt) logger.info('Tx receipt:', receipt);
  }, [receipt]);

  useEffect(() => {
    if (txRes.data) logger.info('Tx:', txRes.data);
    if (txRes.error) logger.error(`Tx error:`, txRes.error);
  }, [txRes.data, txRes.error]);

  return txRes;
};
