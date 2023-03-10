import { useQuery } from '@tanstack/react-query';
import { BigNumber, Contract } from 'ethers';
import { getAaveUserBalanceData, KeyPair, Utxo } from '@privi-yield/common';
import { fetchUserUnspentNotes } from 'utils/pool';
import { usePoolContract } from 'hooks/contracts';

export async function getShieldedBalance(keyPair: KeyPair, pool: Contract) {
  const unspentOutputs = await fetchUserUnspentNotes(keyPair, pool);

  const scaledBalance: BigNumber = unspentOutputs.reduce(
    (sum: BigNumber, utxo: Utxo) => sum.add(utxo.scaledAmount),
    BigNumber.from(0)
  );

  const { balance } = await getAaveUserBalanceData(scaledBalance, pool);

  return {
    balance,
    scaledBalance,
  };
}

export const useGetShieldedBalance = ({
  keyPair,
  poolAddress,
}: {
  keyPair?: KeyPair;
  poolAddress: string;
}) => {
  const pool = usePoolContract({ poolAddress });

  return useQuery(
    ['shieldedBalance', keyPair?.publicKey, poolAddress],
    () => getShieldedBalance(keyPair as KeyPair, pool),
    {
      enabled: !!keyPair && !!poolAddress,
    }
  );
};
