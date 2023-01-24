import { KeyPair, Utxo } from '@privi-yield/common';
import { Contract } from 'ethers';
import { BN, poseidonHash, toFixedHex } from 'privi-utils';

export const fetchUserShieldedAccount = async (address: string, registrar: Contract) => {
  const registerEventFilter = registrar.filters.ShieldedAddress(address);
  const events = await registrar.queryFilter(registerEventFilter);
  const shieldedAddress = events?.[events.length - 1]?.args?.shieldedAddress;

  if (shieldedAddress) {
    return KeyPair.fromAddress(shieldedAddress);
  }
};

export const fetchCommitmentEvents = (pool: Contract) => {
  const filter = pool.filters.CommitmentInserted();
  const eventData = pool.queryFilter(filter, 0);
  return eventData;
};

export const fetchUserUnspentNotes = async (keyPair: KeyPair, pool: Contract) => {
  const eventsList = await fetchCommitmentEvents(pool);

  const outputs: Utxo[] = [];
  for (let i = eventsList.length - 1; i >= 0; i--) {
    const encryptedOutput = eventsList[i]?.args?.encryptedOutput as string;
    const leafIndex = BN(eventsList[i]?.args?.leafIndex || 0).toNumber();
    try {
      const utxo = Utxo.decrypt(keyPair, encryptedOutput, leafIndex);
      outputs.push(utxo);
    } catch (e) {}
  }

  const isSpentArray: boolean[] = await Promise.all(
    outputs.map((utxo) => pool.isSpent(toFixedHex(utxo.nullifier as string)))
  );

  const unspentOutputs = outputs.filter((_, i) => !isSpentArray[i]).reverse();

  return unspentOutputs;
};

export function generateKeyPairFromSignature(signature: string) {
  const privateKey = toFixedHex(poseidonHash(signature));
  return new KeyPair(privateKey);
}
