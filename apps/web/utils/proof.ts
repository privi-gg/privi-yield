import { BigNumberish, Contract } from 'ethers';
import {
  CircuitPath,
  FIELD_SIZE,
  KeyPair,
  SupplyProver,
  Utxo,
  ZERO_LEAF,
} from '@privi-yield/common';
import { toFixedHex, poseidonHash, BN, formatEther } from 'privi-utils';
import MerkleTree from 'fixed-merkle-tree';
import { TREE_HEIGHT } from 'config/constants';
import { fetchUserUnspentNotes } from './pool';
import logger from './logger';

const tx2CircuitPath: CircuitPath = {
  circuit: `/circuits/transaction2.wasm`,
  zKey: `/circuits/transaction2.zkey`,
};

const tx16CircuitPath: CircuitPath = {
  circuit: `/circuits/transaction16.wasm`,
  zKey: `/circuits/transaction16.zkey`,
};

async function buildMerkleTree(pool: Contract) {
  const filter = pool.filters.CommitmentInserted();
  const events = await pool.queryFilter(filter, 0);

  const leaves = events
    .sort((a, b) => a.args?.leafIndex - b.args?.leafIndex)
    .map((e) => toFixedHex(e.args?.commitment));
  return new MerkleTree(TREE_HEIGHT, leaves, {
    hashFunction: poseidonHash,
    zeroElement: ZERO_LEAF,
  });
}

export const prepareSupplyProof = async ({
  pool,
  from,
  to,
  scaledAmount,
}: {
  pool: Contract;
  from: KeyPair;
  to: KeyPair;
  scaledAmount: BigNumberish;
}) => {
  //@ts-ignore
  const snarkJs = window.snarkjs;
  const merkleTree = await buildMerkleTree(pool);
  const isSelfSupply = from.equals(to);

  let inputNotes: Utxo[] = [];
  if (isSelfSupply) {
    inputNotes = await fetchUserUnspentNotes(from, pool);
  }

  const inputsSum = inputNotes.reduce((acc, note) => acc.add(note.scaledAmount), BN(0));
  logger.info(`Current UTXOs: Count ${inputNotes.length} Sum: ${formatEther(inputsSum)}`);

  const outputsSum = BN(inputsSum).add(scaledAmount);
  const outputNotes = [new Utxo({ scaledAmount: outputsSum, keyPair: to })];
  logger.info(`New UTXOs: Amount sum: ${formatEther(outputsSum)}`);

  const prover = new SupplyProver({
    snarkJs,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
    fieldSize: FIELD_SIZE,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'supply',
    inputs: inputNotes,
    outputs: outputNotes,
    scaledFee: 0,
    relayer: 0,
    recipient: 0,
  });

  return { proofArgs, extData };
};

export const prepareWithdrawProof = async ({
  pool,
  from,
  scaledAmount,
  recipient,
}: {
  pool: Contract;
  from: KeyPair;
  scaledAmount: BigNumberish;
  recipient: string;
}) => {
  //@ts-ignore
  const snarkJs = window.snarkjs;
  const merkleTree = await buildMerkleTree(pool);

  const inputNotes = await fetchUserUnspentNotes(from, pool);

  const inputsSum = inputNotes.reduce((acc, note) => acc.add(note.scaledAmount), BN(0));
  logger.info(`Current UTXOs: Count ${inputNotes.length} Sum: ${formatEther(inputsSum)}`);

  const outputsSum = BN(inputsSum).sub(scaledAmount);
  if (outputsSum.isNegative()) {
    throw new Error('Not enough balance');
  }

  const outputNotes = [new Utxo({ scaledAmount: outputsSum, keyPair: from })];
  logger.info(`New UTXOs: Amount sum: ${formatEther(outputsSum)}`);

  const prover = new SupplyProver({
    snarkJs,
    circuits: { transact2: tx2CircuitPath, transact16: tx16CircuitPath },
    merkleTree,
    fieldSize: FIELD_SIZE,
  });

  const { proofArgs, extData } = await prover.prepareTxProof({
    txType: 'withdraw',
    inputs: inputNotes,
    outputs: outputNotes,
    recipient,
    scaledFee: 0,
    relayer: 0,
  });

  return { proofArgs, extData };
};
