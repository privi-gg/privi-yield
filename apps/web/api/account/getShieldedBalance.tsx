import { useQuery } from '@tanstack/react-query';
import { BigNumber, Contract } from 'ethers';
import { KeyPair, Utxo } from '@privi-yield/common';
import { fetchUserUnspentNotes } from 'utils/pool';
import { usePoolContract } from 'hooks/contracts';

export async function getShieldedBalance(keyPair: KeyPair, pool: Contract) {
  const unspentOutputs = await fetchUserUnspentNotes(keyPair, pool);

  const scaledBalance: BigNumber = unspentOutputs.reduce(
    (sum: BigNumber, utxo: Utxo) => sum.add(utxo.scaledAmount),
    BigNumber.from(0)
  );

  const balance: BigNumber = await pool.getBalance(scaledBalance);

  return {
    balance,
    scaledBalance,
  };
}

export const useGetShieldedBalance = ({ keyPair }: { keyPair?: KeyPair }) => {
  const pool = usePoolContract();

  return useQuery(
    ['shieldedBalance', keyPair?.publicKey],
    () => getShieldedBalance(keyPair as KeyPair, pool),
    {
      enabled: !!keyPair,
    }
  );
};
